const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  linkUrl: { type: String },
  altText: { type: String },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalStatus: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Banner", bannerSchema);
