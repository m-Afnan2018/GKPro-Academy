const express = require("express");
const router = express.Router();
const {
  getTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonial.controller");
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

router.get("/", optionalAuth, getTestimonials);
router.get("/:id", getTestimonial);
router.post("/", protect, requireRole("admin", "manager"), approvalGuard, createTestimonial);
router.patch("/:id", protect, requireRole("admin", "manager"), approvalGuard, updateTestimonial);
router.delete("/:id", protect, requireRole("admin"), deleteTestimonial);

module.exports = router;
