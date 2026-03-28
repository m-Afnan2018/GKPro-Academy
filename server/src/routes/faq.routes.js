const express = require("express");
const router = express.Router();
const { getFaqs, getFaq, createFaq, updateFaq, deleteFaq } = require("../controllers/faq.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-passwordHash");
    }
  } catch (_) {}
  next();
};

router.get("/", optionalAuth, getFaqs);
router.get("/:id", getFaq);
router.post("/", protect, requireRole("admin", "manager"), createFaq);
router.patch("/:id", protect, requireRole("admin", "manager"), updateFaq);
router.delete("/:id", protect, requireRole("admin"), deleteFaq);

module.exports = router;
