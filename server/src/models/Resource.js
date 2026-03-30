const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  courseId:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
  batchId:     { type: mongoose.Schema.Types.ObjectId, ref: "Batch",  default: null },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type:        { type: String, enum: ["video", "pdf", "link", "doc", "meet"], required: true },
  url:         { type: String, required: true },
  section:     { type: String, trim: true, default: "General" },
  sortOrder:   { type: Number, default: 0 },
  duration:    { type: String, trim: true },   // e.g. "45 min"
  isPublic:    { type: Boolean, default: false },
  leadCaptureRequired: { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalStatus: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "approved",        // admin uploads are auto-approved
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Resource", resourceSchema);
