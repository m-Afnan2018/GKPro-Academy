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
  onlinePrice:         { type: Number, default: null },
  onlineOriginalPrice: { type: Number, default: null },
  recordedPrice:         { type: Number, default: null },
  recordedOriginalPrice: { type: Number, default: null },
  bookEnabled:   { type: Boolean, default: false },
  eBookPrice:    { type: Number, default: null },
  eBookUrl:      { type: String, default: null },
  handbookPrice: { type: Number, default: null },
  handbookUrl:   { type: String, default: null },
  // Curriculum details
  numLectures: { type: String, default: null },
  duration:    { type: String, default: null },
  language:    { type: String, default: null },
  highlights:  [{ type: String }],
  prerequisites: [{ type: String }],
  // Faculty (multiple)
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faculty" }],
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
