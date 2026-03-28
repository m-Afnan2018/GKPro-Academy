const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "CoursePlan", required: true },
  enrolledAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
});

module.exports = mongoose.model("Enrollment", enrollmentSchema);
