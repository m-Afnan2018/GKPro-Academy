const express = require("express");
const router = express.Router();
const {
  getCourses,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCoursesAdmin,
} = require("../controllers/course.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { approvalGuard } = require("../middleware/approvalGuard");

router.get("/", getCourses);
router.get("/admin/all", protect, requireRole("admin", "manager"), getAllCoursesAdmin);
router.get("/:slug", getCourseBySlug);
router.post("/", protect, requireRole("admin", "manager"), approvalGuard, createCourse);
router.patch("/:id", protect, requireRole("admin", "manager"), approvalGuard, updateCourse);
router.delete("/:id", protect, requireRole("admin"), deleteCourse);

module.exports = router;
