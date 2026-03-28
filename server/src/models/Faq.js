const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Faq", faqSchema);
