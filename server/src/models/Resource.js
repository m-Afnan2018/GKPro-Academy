const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  courseId:    { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
  batchId:     { type: mongoose.Schema.Types.ObjectId, ref: "Batch",  default: null },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type:        { type: String, enum: ["video", "pdf", "link", "doc", "meet", "excel"], required: true },
  url:         { type: String, required: true },
  section:     { type: String, trim: true, default: "General" },
  sortOrder:   { type: Number, default: 0 },
  duration:    { type: String, trim: true },   // e.g. "45 min"
  isPublic:    { type: Boolean, default: false },
  targetMode:  { type: String, enum: ["both", "online", "recorded"], default: "both" },
  leadCaptureRequired: { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalStatus: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "approved",        // admin uploads are auto-approved
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Adaptive-bitrate (HLS) transcode of self-hosted videos. `url` (the original
  // upload) always stays valid and is used as a fallback until/unless this is "ready".
  hlsStatus: { type: String, enum: ["none", "queued", "processing", "ready", "failed"], default: "none" },
  hlsUrl:    { type: String, default: null },
  hlsError:  { type: String, default: null },
});

module.exports = mongoose.model("Resource", resourceSchema);
