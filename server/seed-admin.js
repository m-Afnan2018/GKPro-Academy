/**
 * Seed script — creates the first admin user.
 * Usage: node seed-admin.js
 * Env:   MONGODB_URI (or defaults to mongodb://localhost:27017/gkpro)
 *        ADMIN_EMAIL  (defaults to admin@gkpro.in)
 *        ADMIN_PASS   (defaults to Admin@123)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/gkpro";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gkpro.in";
const ADMIN_PASS  = process.env.ADMIN_PASS  || "Admin@123";
const ADMIN_NAME  = process.env.ADMIN_NAME  || "Super Admin";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log(`Updated existing user ${ADMIN_EMAIL} → role: admin`);
      } else {
        console.log(`Admin user ${ADMIN_EMAIL} already exists.`);
      }
      process.exit(0);
    }

    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASS,
      role: "admin",
    });

    console.log(`Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASS}`);
    console.log("IMPORTANT: Change the password after first login.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
})();
