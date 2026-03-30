const express = require("express");
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createManualPayment,
  getPayments,
  razorpayWebhook,
} = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

// Webhook — no auth, raw body so HMAC verification works
router.post(
  "/razorpay/webhook",
  express.raw({ type: "*/*" }),
  razorpayWebhook
);

router.use(protect);

router.get("/", getPayments);
router.post("/razorpay/create-order", requireRole("student"), createRazorpayOrder);
router.post("/razorpay/verify", requireRole("student"), verifyRazorpayPayment);
router.post("/manual", requireRole("admin", "manager"), createManualPayment);

module.exports = router;
