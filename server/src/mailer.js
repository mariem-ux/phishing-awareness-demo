const nodemailer = require("nodemailer");

let transporter = null;

function getMailFrom() {
  const addr = process.env.MAIL_FROM || process.env.GMAIL_USER || process.env.SMTP_USER || "no-reply@example.com";
  const name = (process.env.MAIL_FROM_NAME || "").trim();
  return name ? `"${name.replace(/"/g, "")}" <${addr}>` : addr;
}

function getTransporter() {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  // App password from Google Account -> Security -> 2-Step Verification -> App passwords.
  // Spaces are stripped so "udqj kife dsrw etww" works as-is.
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || "").replace(/\s+/g, "");

  if (gmailUser && gmailPass) {
    // Port/TLS stay Gmail-465 by default but remain overridable for a
    // controlled test (e.g. GMAIL_PORT=587 GMAIL_SECURE=false for STARTTLS).
    // Never disable TLS / certificate validation here.
    const gmailPort = Number(process.env.GMAIL_PORT || 465);
    const gmailSecure =
      process.env.GMAIL_SECURE !== undefined && process.env.GMAIL_SECURE !== ""
        ? process.env.GMAIL_SECURE === "true"
        : gmailPort === 465;
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: gmailPort,
      secure: gmailSecure,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  if (host) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER || process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    return transporter;
  }

  // Dev fallback: stream transport prints the message to the console,
  // so the flow is testable with zero SMTP config.
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });
  return transporter;
}

async function sendViewOnceEmail({ to, fullName, viewUrl, lang }) {
  const fr = (lang || "en").toLowerCase().startsWith("fr");
  const subject = fr ? "Vérifiez votre adresse e-mail" : "Verify your email address";
  const body = fr
    ? `Bonjour ${fullName || ""},\n\nMerci de votre inscription. Veuillez vérifier votre compte en cliquant sur le lien ci-dessous :\n${viewUrl}\n\nSi vous n'avez pas créé ce compte, vous pouvez ignorer cet e-mail.\n`
    : `Hello ${fullName || ""},\n\nThank you for signing up. Please verify your account by clicking the link below:\n${viewUrl}\n\nIf you didn't create this account, you can ignore this email.\n`;
  const from = getMailFrom();
  const info = await getTransporter().sendMail({ from, to, subject, text: body });
  // streamTransport puts the raw message in info.message. Redact any URLs
  // (they contain one-time verification tokens) before logging.
  if (info && info.message) {
    const raw = info.message.toString().replace(/https?:\/\/\S+/g, "[url-redacted]");
    console.log("[mail:dev] ----\n" + raw + "\n----");
  }
  // Never log viewUrl / tokens / passwords: only recipient + message id.
  console.log(`[mail] sent to=${to} messageId=${info.messageId || "dev"}`);
  return info;
}

// Safe, credential-free summary of the effective transport. Proves which
// host/port/TLS mode production actually uses (startup "mode=" log alone
// does not prove this).
function getMailDebugInfo() {
  try {
    const t = getTransporter();
    const o = (t && t.options) || {};
    return {
      mode: o.streamTransport ? "console-dev" : o.host === "smtp.gmail.com" ? "gmail" : "smtp",
      host: o.host || "(stream)",
      port: o.port !== undefined ? o.port : "(n/a)",
      secure: o.secure !== undefined ? o.secure : false,
    };
  } catch (err) {
    return { mode: "unknown", error: String((err && err.message) || err) };
  }
}

// Keep only safe SMTP diagnostic fields (code/command/responseCode).
// Never includes auth credentials, tokens, or message bodies.
function formatSmtpError(err) {
  if (!err) return { message: "unknown error" };
  const out = { message: String(err.message || err) };
  for (const k of ["code", "command", "responseCode", "response"]) {
    if (err[k] !== undefined && err[k] !== null && err[k] !== "") out[k] = String(err[k]);
  }
  return out;
}

module.exports = { sendViewOnceEmail, getMailFrom, getTransporter, getMailDebugInfo, formatSmtpError };
