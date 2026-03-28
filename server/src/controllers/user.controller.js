const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().select("-passwordHash").skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.json(new ApiResponse(200, { users, total, page, limit }, "Users retrieved."));
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) throw new ApiError(404, "User not found.");
  res.json(new ApiResponse(200, user, "User retrieved."));
});

const updateUser = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "admin";
  const isSelf = req.user._id.toString() === req.params.id;

  if (!isAdmin && !isSelf) throw new ApiError(403, "Not authorized.");

  const allowedFields = isAdmin
    ? ["name", "email", "phone", "role", "isActive"]
    : ["name", "phone"];

  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-passwordHash");
  if (!user) throw new ApiError(404, "User not found.");

  res.json(new ApiResponse(200, user, "User updated."));
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "User not found.");
  res.json(new ApiResponse(200, null, "User deleted."));
});

module.exports = { getUsers, getUser, updateUser, deleteUser };
