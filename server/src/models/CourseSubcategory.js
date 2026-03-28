const mongoose = require("mongoose");
const slugify = require("slugify");

const courseSubcategorySchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  slug:         { type: String, unique: true },
  categoryId:   { type: mongoose.Schema.Types.ObjectId, ref: "CourseCategory", required: true },
  sortOrder:    { type: Number, default: 0 },
  isComingSoon: { type: Boolean, default: false },
});

courseSubcategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("CourseSubcategory", courseSubcategorySchema);
