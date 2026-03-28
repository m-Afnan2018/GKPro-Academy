const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "CoursePlan", required: true },
  name: { type: String, required: true, trim: true },
  mode: { type: String, enum: ["live", "recorded", "one_on_one"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  seatLimit: { type: Number },
  enrolledCount: { type: Number, default: 0 },
  status: { type: String, enum: ["upcoming", "ongoing", "completed", "cancelled"], default: "upcoming" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  meetingLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Batch", batchSchema);
