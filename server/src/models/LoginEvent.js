const mongoose = require("mongoose");

// One document per login/register submission.
// Password is stored ONLY as bcrypt hash. Raw client telemetry in `meta`.
// `viewToken` is a single view-once secret sent by email.
const LoginEventSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true, maxlength: 254 },
    fullName: { type: String, required: true, maxlength: 100 },
    passwordHash: { type: String, required: true },
    viewToken: { type: String, required: true, unique: true, index: true },
    viewed: { type: Boolean, default: false },
    // Server-observed network facts (trustworthy, not client-spoofable)
    serverMeta: {
      ip: String,
      ips: [String],
      userAgent: String,
      referer: String,
      language: String,
      receivedAt: { type: Date, default: Date.now },
    },
    // Client-reported telemetry (declared, can be spoofed — display as-is)
    clientMeta: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Auto-expire unviewed records after 7 days as a safety net.
LoginEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

module.exports = mongoose.model("LoginEvent", LoginEventSchema);
