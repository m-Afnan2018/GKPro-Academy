const mongoose = require("mongoose");

const contentApprovalSchema = new mongoose.Schema({
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  reviewNotes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
});

module.exports = mongoose.model("ContentApproval", contentApprovalSchema);
