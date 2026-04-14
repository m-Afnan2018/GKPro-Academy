const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);
