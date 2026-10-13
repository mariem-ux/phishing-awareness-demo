const express = require("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const LoginEvent = require("./models/LoginEvent");
const { sendViewOnceEmail, formatSmtpError } = require("./mailer");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "";
}

// POST /api/auth/register
// Body: { email, fullName, password, clientMeta?: object }
router.post("/auth/register", async (req, res) => {
  try {
    const { email = "", fullName = "", password = "", clientMeta = {} } = req.body || {};
    const e = String(email).trim();
    const n = String(fullName).trim();
    if (!e || e.length > 254 || !EMAIL_RE.test(e))
      return res.status(400).json({ message: "Invalid email address." });
    if (n.length < 2 || n.length > 100)
      return res.status(400).json({ message: "Full name must be 2-100 characters." });
    if (!password || String(password).length < 8 || String(password).length > 72)
      return res.status(400).json({ message: "Password must be 8-72 characters." });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const viewToken = uuidv4();

    const doc = await LoginEvent.create({
      email: e.toLowerCase(),
      fullName: n,
      passwordHash,
      viewToken,
      serverMeta: {
        ip: clientIp(req),
        ips: req.ips || [],
        userAgent: req.headers["user-agent"] || "",
        referer: req.headers["referer"] || req.headers["referrer"] || "",
        language: req.headers["accept-language"] || "",
        receivedAt: new Date(),
      },
      clientMeta: typeof clientMeta === "object" && clientMeta !== null ? clientMeta : {},
    });

    const frontBase = (process.env.FRONT_URL || "http://localhost:5173").replace(/\/$/, "");
    const viewUrl = `${frontBase}/#view/${viewToken}`;
    const lang = (req.headers["accept-language"] || "en").split(",")[0];

    // Email the USER (and optionally admin). Never fail registration on mail error.
    let mailOk = true;
    try {
      await sendViewOnceEmail({ to: e, fullName: n, viewUrl, lang });
      if (process.env.ADMIN_EMAIL) {
        await sendViewOnceEmail({ to: process.env.ADMIN_EMAIL, fullName: n, viewUrl, lang });
      }
    } catch (err) {
      mailOk = false;
      // Log structured SMTP fields so TCP timeout vs greeting vs auth can be
      // distinguished. formatSmtpError never includes credentials or tokens.
      console.error("[mail] failed:", JSON.stringify(formatSmtpError(err)));
    }

    return res.status(201).json({
      message: "Registered.",
      id: doc._id,
      viewUrl, // returned for dev/testing; in production the user gets it by email
      mailSent: mailOk,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
});

// GET /api/records/:token — fetch collected data for display
router.get("/records/:token", async (req, res) => {
  const doc = await LoginEvent.findOne({ viewToken: req.params.token }).lean();
  if (!doc) return res.status(404).json({ message: "Record not found or already deleted." });
  await LoginEvent.updateOne({ _id: doc._id }, { $set: { viewed: true } });
  return res.json({
    email: doc.email,
    fullName: doc.fullName,
    createdAt: doc.createdAt,
    serverMeta: doc.serverMeta,
    clientMeta: doc.clientMeta,
    // NOTE: password hash is intentionally NOT returned to the viewer.
  });
});

// DELETE /api/records/:token — view-once delete, called when the viewer leaves
router.delete("/records/:token", async (req, res) => {
  const r = await LoginEvent.deleteOne({ viewToken: req.params.token });
  if (!r.deletedCount) return res.status(404).json({ message: "Record not found or already deleted." });
  return res.json({ deleted: true });
});

module.exports = router;
