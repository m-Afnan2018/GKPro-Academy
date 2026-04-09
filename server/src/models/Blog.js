const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseTags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  tags: [{ type: String, trim: true }],
  isPublished: { type: Boolean, default: false },
  approvalStatus: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publishedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

blogSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("Blog", blogSchema);
