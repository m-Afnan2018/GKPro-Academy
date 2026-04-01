require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));

// Razorpay webhook MUST be registered before express.json() — needs raw body for HMAC verification
const { razorpayWebhook } = require("./src/controllers/payment.controller");
app.post("/api/payments/razorpay/webhook", express.raw({ type: "*/*" }), razorpayWebhook);

app.use(express.json());

// Serve uploaded files
// Images are public (used on public website); material files (pdf/video/doc) require JWT
const path = require("path");
const { serveUploads } = require("./src/middleware/serveUploads");
app.use("/uploads", serveUploads(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/users", require("./src/routes/user.routes"));
app.use("/api/categories",    require("./src/routes/category.routes"));
app.use("/api/subcategories", require("./src/routes/subcategory.routes"));
app.use("/api/courses", require("./src/routes/course.routes"));
app.use("/api/plans", require("./src/routes/plan.routes"));
app.use("/api/batches", require("./src/routes/batch.routes"));
app.use("/api/enrollments", require("./src/routes/enrollment.routes"));
app.use("/api/payments", require("./src/routes/payment.routes"));
app.use("/api/leads", require("./src/routes/lead.routes"));
app.use("/api/demo-bookings", require("./src/routes/demoBooking.routes"));
app.use("/api/announcements", require("./src/routes/announcement.routes"));
app.use("/api/banners", require("./src/routes/banner.routes"));
app.use("/api/testimonials", require("./src/routes/testimonial.routes"));
app.use("/api/resources", require("./src/routes/resource.routes"));
app.use("/api/blogs", require("./src/routes/blog.routes"));
app.use("/api/faqs", require("./src/routes/faq.routes"));
app.use("/api/approvals", require("./src/routes/approval.routes"));
app.use("/api/upload",   require("./src/routes/upload.routes"));

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
