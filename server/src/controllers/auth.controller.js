const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email, and password are required.");

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, "Email already in use.");

  const user = await User.create({ name, email, phone, passwordHash: password, role: "student" });
  const token = signToken(user._id);

  const userObj = user.toObject();
  delete userObj.passwordHash;

  res.status(201).json(new ApiResponse(201, { token, user: userObj }, "Registered successfully."));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required.");

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }
  if (!user.isActive) throw new ApiError(403, "Account is deactivated.");

  const token = signToken(user._id);
  const userObj = user.toObject();
  delete userObj.passwordHash;

  res.json(new ApiResponse(200, { token, user: userObj }, "Logged in successfully."));
});

const getMe = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, req.user, "Current user."));
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, password } = req.body;
  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user) throw new ApiError(404, "User not found.");

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (password) user.passwordHash = password; // pre-save hook will hash it
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
  const updatedUser = await user.save();

  const userObj = updatedUser.toObject();
  delete userObj.passwordHash;
  res.json(new ApiResponse(200, { user: userObj, avatarUrl: updatedUser.avatarUrl }, "Avatar updated."));
});

module.exports = { register, login, getMe, updateMe, updateAvatar };
