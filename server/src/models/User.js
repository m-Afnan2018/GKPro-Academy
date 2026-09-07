const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MAX_ACTIVE_DEVICES = 2;

const sessionSchema = new mongoose.Schema(
  {
    jti:          { type: String, required: true },
    userAgent:    { type: String, default: "" },
    ip:           { type: String, default: "" },
    createdAt:    { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["student", "manager", "admin"], default: "student" },
  avatarUrl: { type: String, default: null },
  isActive:   { type: Boolean, default: true },
  isVerified: { type: Boolean, default: true },   // false only during signup OTP flow
  createdAt:  { type: Date, default: Date.now },
  resetOtp:        { type: String, select: false, default: null },
  resetOtpExpiry:  { type: Date,   select: false, default: null },
  signupOtp:       { type: String, select: false, default: null },
  signupOtpExpiry: { type: Date,   select: false, default: null },
  sessions:        { type: [sessionSchema], default: [] },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

/** Registers a new login session, evicting the oldest device beyond the limit. */
userSchema.methods.addSession = function (jti, meta = {}) {
  this.sessions.push({ jti, userAgent: meta.userAgent || "", ip: meta.ip || "" });
  if (this.sessions.length > MAX_ACTIVE_DEVICES) {
    this.sessions = this.sessions.slice(this.sessions.length - MAX_ACTIVE_DEVICES);
  }
};

userSchema.methods.hasSession = function (jti) {
  return this.sessions.some((s) => s.jti === jti);
};

module.exports = mongoose.model("User", userSchema);
module.exports.MAX_ACTIVE_DEVICES = MAX_ACTIVE_DEVICES;
