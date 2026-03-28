const express = require("express");
const router = express.Router();
const { getBatches, getBatch, createBatch, updateBatch, deleteBatch } = require("../controllers/batch.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { approvalGuard } = require("../middleware/approvalGuard");

// Public batch listing (for course cards to show mode badges)
router.get("/", getBatches);
router.get("/:id", getBatch);

router.use(protect);
router.post("/", requireRole("admin", "manager"), approvalGuard, createBatch);
router.patch("/:id", requireRole("admin", "manager"), approvalGuard, updateBatch);
router.delete("/:id", requireRole("admin"), deleteBatch);

module.exports = router;
