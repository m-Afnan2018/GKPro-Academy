const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  method: { type: String, enum: ["razorpay", "manual"], required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: { type: String, enum: ["pending", "captured", "failed", "refunded"], default: "pending" },
  isManual: { type: Boolean, default: false },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", paymentSchema);
