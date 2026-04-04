const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getUsers = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;

  const [users, total] = await Promise.all([
    User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { users, total, page, limit }, "Users retrieved."));
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) throw new ApiError(404, "User not found.");
  res.json(new ApiResponse(200, user, "User retrieved."));
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = "student", isActive = true } = req.body;

  if (!name?.trim())     throw new ApiError(400, "Name is required.");
  if (!email?.trim())    throw new ApiError(400, "Email is required.");
  if (!password?.trim()) throw new ApiError(400, "Password is required.");
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters.");

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) throw new ApiError(409, "A user with this email already exists.");

  // passwordHash field is pre-save hashed by the model middleware
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || undefined,
    passwordHash: password,
    role,
    isActive,
  });

  const safe = user.toObject();
  delete safe.passwordHash;

  res.status(201).json(new ApiResponse(201, safe, "User created."));
});

const updateUser = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "admin";
  const isSelf  = req.user._id.toString() === req.params.id;

  if (!isAdmin && !isSelf) throw new ApiError(403, "Not authorized.");

  const allowedFields = isAdmin
    ? ["name", "email", "phone", "role", "isActive"]
    : ["name", "phone"];

  // Guard: prevent removing the last admin's admin role
  if (isAdmin && req.body.role && req.body.role !== "admin") {
    const target = await User.findById(req.params.id);
    if (target && target.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        throw new ApiError(400, "Cannot change role — this is the only admin account.");
      }
    }
  }

  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  // Handle password reset by admin
  if (isAdmin && req.body.password) {
    if (req.body.password.length < 6) throw new ApiError(400, "Password must be at least 6 characters.");
    // Fetch user, set passwordHash, save (triggers bcrypt pre-save hook)
    const userDoc = await User.findById(req.params.id).select("+passwordHash");
    if (!userDoc) throw new ApiError(404, "User not found.");
    Object.assign(userDoc, updates);
    userDoc.passwordHash = req.body.password;
    await userDoc.save();
    const safe = userDoc.toObject();
    delete safe.passwordHash;
    return res.json(new ApiResponse(200, safe, "User updated."));
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-passwordHash");
  if (!user) throw new ApiError(404, "User not found.");

  res.json(new ApiResponse(200, user, "User updated."));
});

const deleteUser = asyncHandler(async (req, res) => {
  // Prevent self-deletion
  if (req.user._id.toString() === req.params.id) {
    throw new ApiError(400, "You cannot delete your own account.");
  }

  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, "User not found.");

  // Prevent deleting the last admin
  if (target.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot delete the only admin account. Create another admin first.");
    }
  }

  await target.deleteOne();
  res.json(new ApiResponse(200, null, "User deleted."));
});

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
