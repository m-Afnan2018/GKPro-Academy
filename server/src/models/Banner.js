const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  desktopImageUrl: { type: String, required: true },
  mobileImageUrl:  { type: String, default: null },   // falls back to desktopImageUrl if omitted
  linkUrl:  { type: String, default: null },
  altText:  { type: String, default: null },
  sortOrder: { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalStatus: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Banner", bannerSchema);
