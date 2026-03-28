const express = require("express");
const router = express.Router();
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} = require("../controllers/demoBooking.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

// Public: create a demo booking
router.post("/", createBooking);

// Protected
router.get("/", protect, requireRole("admin", "manager"), getBookings);
router.get("/:id", protect, requireRole("admin", "manager"), getBooking);
router.patch("/:id", protect, requireRole("admin", "manager"), updateBooking);
router.delete("/:id", protect, requireRole("admin"), deleteBooking);

module.exports = router;
