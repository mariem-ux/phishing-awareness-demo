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
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
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
  // streamTransport puts the raw message in info.message — log it for tests
  if (info && info.message) console.log("[mail:dev] ----\n" + info.message.toString() + "\n----");
  console.log(`[mail] to=${to} viewUrl=${viewUrl} messageId=${info.messageId || "dev"}`);
  return info;
}

module.exports = { sendViewOnceEmail, getMailFrom, getTransporter };
