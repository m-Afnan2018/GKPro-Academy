const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authenticated. No token provided.");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select("-passwordHash");
  if (!user || !user.isActive) {
    throw new ApiError(401, "User not found or inactive.");
  }

  if (!decoded.jti || !user.hasSession(decoded.jti)) {
    throw new ApiError(401, "You have been logged out because your account signed in on another device.");
  }

  req.user = user;
  req.tokenJti = decoded.jti;
  next();
});

module.exports = { protect };
