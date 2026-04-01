const express = require("express");
const router  = express.Router();
const { getFaculty, getFacultyById, createFaculty, updateFaculty, deleteFaculty } =
  require("../controllers/faculty.controller");
const { protect }     = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

router.get("/",    protect, requireRole("admin", "manager"), getFaculty);
router.get("/:id", protect, requireRole("admin", "manager"), getFacultyById);
router.post("/",        protect, requireRole("admin", "manager"), createFaculty);
router.patch("/:id",    protect, requireRole("admin", "manager"), updateFaculty);
router.delete("/:id",   protect, requireRole("admin"),            deleteFaculty);

module.exports = router;
