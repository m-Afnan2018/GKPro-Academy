const express = require("express");
const router  = express.Router();
const {
  getSubcategories,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require("../controllers/subcategory.controller");
const { protect }      = require("../middleware/auth");
const { requireRole }  = require("../middleware/roles");

router.get("/",    getSubcategories);
router.get("/:id", getSubcategory);
router.post("/",       protect, requireRole("admin"), createSubcategory);
router.patch("/:id",   protect, requireRole("admin"), updateSubcategory);
router.delete("/:id",  protect, requireRole("admin"), deleteSubcategory);

module.exports = router;
