const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
  courseId:  { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  mode:      { type: String, enum: ["online", "recorded"], required: true },

  pricePaid:     { type: Number, default: 0 },
  bookType:      { type: String, enum: ["none", "ebook", "handbook"], default: "none" },
  deliveryAddress: { type: String, default: null },
  bookPricePaid: { type: Number, default: 0 },

  enrolledAt: { type: Date, default: Date.now },
  expiresAt:  { type: Date },
  status:     { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  paymentId:  { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
});

module.exports = mongoose.model("Enrollment", enrollmentSchema);
