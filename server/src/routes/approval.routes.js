const express = require("express");
const router = express.Router();
const {
  getPendingApprovals,
  getMyApprovals,
  approveApproval,
  rejectApproval,
} = require("../controllers/approval.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

router.use(protect);

router.get("/pending", requireRole("admin"), getPendingApprovals);
router.get("/mine", requireRole("admin", "manager"), getMyApprovals);
router.post("/:id/approve", requireRole("admin"), approveApproval);
router.post("/:id/reject", requireRole("admin"), rejectApproval);

module.exports = router;
