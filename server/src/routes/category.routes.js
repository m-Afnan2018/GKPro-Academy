const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

router.get("/", getCategories);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/:id", getCategory);
router.post("/", protect, requireRole("admin"), createCategory);
router.patch("/:id", protect, requireRole("admin"), updateCategory);
router.delete("/:id", protect, requireRole("admin"), deleteCategory);

module.exports = router;
