const mongoose = require("mongoose");
const slugify = require("slugify");

const courseCategorySchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  slug:         { type: String, unique: true },
  description:  { type: String, default: null },
  imageUrl:     { type: String, default: null },
  isComingSoon: { type: Boolean, default: false },
  sortOrder:    { type: Number, default: 0 },
});

courseCategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("CourseCategory", courseCategorySchema);
