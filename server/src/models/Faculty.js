const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  designation: { type: String, default: null },
  bio:         { type: String, default: null },
  avatar:      { type: String, default: null },
  email:       { type: String, default: null, trim: true },
  phone:       { type: String, default: null, trim: true },
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model("Faculty", facultySchema);
