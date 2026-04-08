const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
  courseName: { type: String, trim: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  photoUrl: { type: String },
  isActive: { type: Boolean, default: true },
  isGeneral: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalStatus: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Testimonial", testimonialSchema);
