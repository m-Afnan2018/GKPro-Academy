const mongoose = require("mongoose");
const slugify = require("slugify");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  categoryId:    { type: mongoose.Schema.Types.ObjectId, ref: "CourseCategory", required: true },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseSubcategory", default: null },
  description: { type: String },
  overview: { type: String },
  whoIsItFor: [{ type: String }],
  technicalRequirements: [{ type: String }],
  thumbnailUrl: { type: String },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvalStatus: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publishedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

courseSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("Course", courseSchema);
