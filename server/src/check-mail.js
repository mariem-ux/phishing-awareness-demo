// Safe SMTP diagnostic: checks TCP + TLS + auth via transporter.verify().
// Sends NO email, prints NO credentials/tokens/URLs.
// Usage (local):        node src/check-mail.js        (from server/)
// Usage (repo root):    npm run check:mail --prefix server
// On Railway: run as a one-off command (service Settings -> Deploy ->
// custom start temporarily) or `railway run npm run check:mail --prefix server`
// from a linked local shell. Never blocks server startup.
require("dotenv").config();
const { getTransporter, getMailDebugInfo, formatSmtpError } = require("./mailer");

async function main() {
  const info = getMailDebugInfo();
  console.log(
    `[check-mail] host=${info.host} port=${info.port} secure=${info.secure} mode=${info.mode}`
  );
  if (info.mode === "console-dev") {
    console.log("[check-mail] no Gmail/SMTP env set: using dev stream transport (no network).");
  }

  const transporter = getTransporter();
  const timeoutMs = Number(process.env.MAIL_VERIFY_TIMEOUT_MS || 25000);
  let timer;
  const timeoutP = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const e = new Error(`verify timeout after ${timeoutMs}ms (TCP/TLS blocked or host unreachable?)`);
      e.code = "VERIFY_TIMEOUT";
      reject(e);
    }, timeoutMs);
  });

  try {
    await Promise.race([transporter.verify(), timeoutP]);
    clearTimeout(timer);
    console.log("[check-mail] verify OK: SMTP connection + auth accepted (no mail sent).");
  } catch (err) {
    clearTimeout(timer);
    // Safe fields only: message/code/command/responseCode. No secrets.
    console.error("[check-mail] verify FAILED:", JSON.stringify(formatSmtpError(err)));
    process.exitCode = 1;
  } finally {
    try {
      if (typeof transporter.close === "function") transporter.close();
    } catch {
      /* ignore */
    }
  }
}

main().then(
  () => process.exit(process.exitCode || 0),
  (err) => {
    console.error("[check-mail] unexpected:", String((err && err.message) || err));
    process.exit(1);
  }
);
