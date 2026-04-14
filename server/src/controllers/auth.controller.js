const jwt    = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User   = require("../models/User");
const ApiError    = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { sendOtpEmail, sendSignupOtpEmail } = require("../services/email.service");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

/* ── Register: create unverified user + send OTP ─────── */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email, and password are required.");
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters.");

  const normalised = email.toLowerCase().trim();

  // Reject if a verified account already exists
  const existing = await User.findOne({ email: normalised });
  if (existing && existing.isVerified) throw new ApiError(409, "Email is already registered. Please sign in.");

  const otp      = crypto.randomInt(100000, 999999).toString();
  const otpHash  = await bcrypt.hash(otp, 10);
  const expiry   = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  if (existing && !existing.isVerified) {
    // Refresh pending registration with new data + new OTP
    existing.name            = name;
    existing.phone           = phone || existing.phone;
    existing.passwordHash    = password;      // pre-save hook re-hashes
    existing.signupOtp       = otpHash;
    existing.signupOtpExpiry = expiry;
    await existing.save();
  } else {
    await User.create({
      name,
      email:           normalised,
      phone,
      passwordHash:    password,
      role:            "student",
      isVerified:      false,
      signupOtp:       otpHash,
      signupOtpExpiry: expiry,
    });
  }

  await sendSignupOtpEmail({ to: normalised, name, otp });

  res.status(200).json(new ApiResponse(200, { email: normalised }, "OTP sent to your email. Please verify to complete registration."));
});

/* ── Verify signup OTP ───────────────────────────────── */
const verifySignup = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required.");

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select("+signupOtp +signupOtpExpiry +passwordHash");

  if (!user || user.isVerified) throw new ApiError(400, "No pending verification found for this email.");
  if (!user.signupOtp || !user.signupOtpExpiry) throw new ApiError(400, "No pending verification found.");
  if (user.signupOtpExpiry < new Date()) throw new ApiError(400, "OTP has expired. Please register again to get a new code.");

  const isValid = await bcrypt.compare(otp.trim(), user.signupOtp);
  if (!isValid) throw new ApiError(400, "Incorrect OTP. Please check your email and try again.");

  user.isVerified      = true;
  user.signupOtp       = undefined;
  user.signupOtpExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);
  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.signupOtp;
  delete userObj.signupOtpExpiry;

  res.json(new ApiResponse(200, { token, user: userObj }, "Email verified! Welcome to GKPro Academy."));
});

/* ── Login ───────────────────────────────────────────── */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required.");

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }
  if (!user.isActive) throw new ApiError(403, "Account is deactivated. Please contact support.");
  if (user.isVerified === false) throw new ApiError(403, "Please verify your email before signing in.");

  const token = signToken(user._id);
  const userObj = user.toObject();
  delete userObj.passwordHash;

  res.json(new ApiResponse(200, { token, user: userObj }, "Logged in successfully."));
});

/* ── Get / Update current user ───────────────────────── */
const getMe = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, req.user, "Current user."));
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, password } = req.body;
  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user) throw new ApiError(404, "User not found.");

  if (name)                      user.name         = name;
  if (phone !== undefined)       user.phone        = phone;
  if (password)                  user.passwordHash = password;
  if (req.body.avatarUrl !== undefined) user.avatarUrl = req.body.avatarUrl || null;

  await user.save();
  const userObj = user.toObject();
  delete userObj.passwordHash;
  res.json(new ApiResponse(200, userObj, "Profile updated."));
});

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/api$/, "");

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image file provided.");
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found.");

  user.avatarUrl = `${SERVER_BASE}/uploads/${req.file.filename}`;
  const updated  = await user.save();
  const userObj  = updated.toObject();
  delete userObj.passwordHash;
  res.json(new ApiResponse(200, { user: userObj, avatarUrl: updated.avatarUrl }, "Avatar updated."));
});

/* ── Forgot Password ─────────────────────────────────── */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required.");

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new ApiError(404, "No account found with that email address.");

  const otp      = crypto.randomInt(100000, 999999).toString();
  const otpHash  = await bcrypt.hash(otp, 10);
  const expiry   = new Date(Date.now() + 10 * 60 * 1000);

  user.resetOtp       = otpHash;
  user.resetOtpExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  await sendOtpEmail({ to: user.email, name: user.name, otp });

  res.json(new ApiResponse(200, null, "OTP sent to your email address."));
});

/* ── Reset Password ──────────────────────────────────── */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) throw new ApiError(400, "Email, OTP, and new password are required.");
  if (newPassword.length < 6) throw new ApiError(400, "Password must be at least 6 characters.");

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select("+resetOtp +resetOtpExpiry +passwordHash");

  if (!user || !user.resetOtp || !user.resetOtpExpiry) throw new ApiError(400, "Invalid or expired OTP.");
  if (user.resetOtpExpiry < new Date()) throw new ApiError(400, "OTP has expired. Please request a new one.");

  const isValid = await bcrypt.compare(otp.trim(), user.resetOtp);
  if (!isValid) throw new ApiError(400, "Incorrect OTP.");

  user.passwordHash   = newPassword;
  user.resetOtp       = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  const token = signToken(user._id);
  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.resetOtp;
  delete userObj.resetOtpExpiry;

  res.json(new ApiResponse(200, { token, user: userObj }, "Password reset successfully."));
});

module.exports = { register, login, getMe, updateMe, updateAvatar, forgotPassword, resetPassword, verifySignup };
