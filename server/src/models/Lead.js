const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    source: { type: String, enum: ["website", "whatsapp", "demo", "referral", "other"], default: "website" },
    status: { type: String, enum: ["new", "contacted", "converted"], default: "new" },
    notes: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("Lead", leadSchema);
