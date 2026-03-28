const mongoose = require("mongoose");

const coursePlanSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  planType: { type: String, enum: ["basic", "standard", "premium"], required: true },
  price: { type: Number, required: true },
  validityDays: { type: Number, required: true },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("CoursePlan", coursePlanSchema);
