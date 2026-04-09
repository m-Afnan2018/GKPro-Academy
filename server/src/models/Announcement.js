const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  type: { type: String, enum: ["discount", "upcoming_batch", "ongoing_batch", "general"], required: true },
  link: { type: String, trim: true },
  validUntil: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalStatus: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Announcement", announcementSchema);
