const express = require("express");
const router = express.Router();
const { getLeads, getLead, createLead, updateLead, deleteLead, convertLead } = require("../controllers/lead.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

// Public contact form submission
router.post("/contact", createLead);

router.use(protect);
router.use(requireRole("admin", "manager"));

router.get("/", getLeads);
router.get("/:id", getLead);
router.post("/", createLead);
router.patch("/:id", updateLead);
router.delete("/:id", requireRole("admin"), deleteLead);
router.post("/:id/convert", convertLead);

module.exports = router;
