require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const api = require("./routes");

const PORT = Number(process.env.PORT || 4000);

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    await mongoose.connect(uri);
    console.log("[db] connected to MONGODB_URI");
    return null;
  }
  // Zero-config fallback for local testing: ephemeral in-memory MongoDB.
  const mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  console.log("[db] using in-memory MongoDB (set MONGODB_URI for a persistent DB)");
  return mem;
}

async function main() {
  await connectDb();
  const gmailConfigured = Boolean(
    (process.env.GMAIL_USER || process.env.EMAIL_USER) &&
      (process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS)
  );
  console.log(
    `[mail] mode=${gmailConfigured ? "gmail:" + (process.env.GMAIL_USER || process.env.EMAIL_USER) : process.env.SMTP_HOST ? "smtp:" + process.env.SMTP_HOST : "console-dev"} fromName=${process.env.MAIL_FROM_NAME || "(none)"}`
  );
  const app = express();
  app.set("trust proxy", true);
  app.use(cors({ origin: (process.env.FRONT_URL || "http://localhost:5173").split(","), credentials: false }));
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.use("/api", api);

  app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
    console.log(`[api] FRONT_URL=${process.env.FRONT_URL || "http://localhost:5173"}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
