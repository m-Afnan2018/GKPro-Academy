const express = require("express");
const router = express.Router();
const {
  getEnrollments,
  getEnrollment,
  updateEnrollment,
  cancelEnrollment,
  createEnrollment,
} = require("../controllers/enrollment.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

router.use(protect);

router.get("/",   getEnrollments);
router.post("/",  createEnrollment);          // any logged-in user can self-enroll
router.get("/:id", getEnrollment);
router.patch("/:id", requireRole("admin"), updateEnrollment);
router.patch("/:id/cancel", cancelEnrollment);

module.exports = router;
