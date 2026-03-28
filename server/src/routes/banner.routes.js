const express = require("express");
const router = express.Router();
const { getBanners, getBanner, createBanner, updateBanner, deleteBanner } = require("../controllers/banner.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { approvalGuard } = require("../middleware/approvalGuard");

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  const jwt = require("jsonwebtoken");
  const User = require("../models/User");
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (!err && decoded) {
      const user = await User.findById(decoded.id).select("-passwordHash");
      if (user) req.user = user;
    }
    next();
  });
};

router.get("/", optionalAuth, getBanners);
router.get("/:id", getBanner);
router.post("/", protect, requireRole("admin", "manager"), approvalGuard, createBanner);
router.patch("/:id", protect, requireRole("admin", "manager"), approvalGuard, updateBanner);
router.delete("/:id", protect, requireRole("admin"), deleteBanner);

module.exports = router;
