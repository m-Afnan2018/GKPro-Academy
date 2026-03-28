const express = require("express");
const router = express.Router();
const { getPlans, getPlan, createPlan, updatePlan, deletePlan } = require("../controllers/plan.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

router.get("/", getPlans);
router.get("/:id", getPlan);
router.post("/", protect, requireRole("admin"), createPlan);
router.patch("/:id", protect, requireRole("admin"), updatePlan);
router.delete("/:id", protect, requireRole("admin"), deletePlan);

module.exports = router;
