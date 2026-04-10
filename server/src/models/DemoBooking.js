const mongoose = require("mongoose");

const demoBookingSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true, lowercase: true },
  phone:   { type: String, required: true, trim: true },
  course:  { type: String, trim: true },           // free-text course interest
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, // optional link
  preferredDate: { type: String },                 // "2025-06-15"
  preferredTime: { type: String },                 // "10:00 AM – 11:00 AM"
  message: { type: String, trim: true },
  status:  { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  adminNote: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DemoBooking", demoBookingSchema);
