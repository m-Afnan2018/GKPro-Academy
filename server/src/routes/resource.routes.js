const express = require("express");
const router = express.Router();
const {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  accessResource,
  reorderResources,
} = require("../controllers/resource.controller");
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

router.get("/", optionalAuth, getResources);
router.post("/:id/access", optionalAuth, accessResource);
router.get("/:id", getResource);
router.post("/", protect, requireRole("admin", "manager"), approvalGuard, createResource);
// reorder must be before /:id to avoid being captured as an ID param
router.patch("/reorder", protect, requireRole("admin", "manager"), reorderResources);
router.patch("/:id", protect, requireRole("admin", "manager"), approvalGuard, updateResource);
router.delete("/:id", protect, requireRole("admin"), deleteResource);

module.exports = router;
