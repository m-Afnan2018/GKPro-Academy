const crypto     = require("crypto");
const Payment    = require("../models/Payment");
const Enrollment = require("../models/Enrollment");
const Course     = require("../models/Course");
const ApiError   = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { createOrder, verifySignature } = require("../services/payment.service");
const { hasActiveCourseEnrollment } = require("./enrollment.controller");

/* ── helpers ─────────────────────────────────────────────── */

/**
 * Returns the base course price for a given mode.
 * Throws if the mode is not available on this course.
 */
function resolveCoursePrice(course, mode) {
  const price = mode === "online" ? course.onlinePrice : course.recordedPrice;
  if (price == null) {
    throw new ApiError(400, `This course does not have a ${mode} option.`);
  }
  return price;
}

/**
 * Returns the book add-on price (0 if bookType is "none" or books are disabled).
 * Throws if the requested book type is not configured on this course.
 */
function resolveBookPrice(course, bookType) {
  if (!bookType || bookType === "none") return 0;
  if (!course.bookEnabled) throw new ApiError(400, "This course does not have a book add-on.");

  if (bookType === "ebook") {
    if (!course.eBookPrice) throw new ApiError(400, "eBook is not available for this course.");
    return course.eBookPrice;
  }
  if (bookType === "handbook") {
    if (!course.handbookPrice) throw new ApiError(400, "Handbook is not available for this course.");
    return course.handbookPrice;
  }
  throw new ApiError(400, "Invalid book type. Must be none, ebook, or handbook.");
}

/* ── createRazorpayOrder ─────────────────────────────────── */

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { courseId, mode, bookType = "none", deliveryAddress } = req.body;

  if (!courseId) throw new ApiError(400, "courseId is required.");
  if (!mode || !["online", "recorded"].includes(mode)) {
    throw new ApiError(400, "mode must be 'online' or 'recorded'.");
  }
  if (bookType === "handbook" && !deliveryAddress?.trim()) {
    throw new ApiError(400, "Delivery address is required for handbook.");
  }

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found.");

  // Block if already enrolled in this course
  const existing = await hasActiveCourseEnrollment(req.user._id, courseId);
  if (existing) throw new ApiError(409, "You are already enrolled in this course.");

  const coursePrice = resolveCoursePrice(course, mode);
  const bookPrice   = resolveBookPrice(course, bookType);
  const total       = coursePrice + bookPrice;

  const order = await createOrder(total * 100); // paise

  const payment = await Payment.create({
    studentId:       req.user._id,
    amount:          total,
    currency:        "INR",
    method:          "razorpay",
    razorpayOrderId: order.id,
    status:          "pending",
  });

  res.json(
    new ApiResponse(
      200,
      {
        orderId:   order.id,
        amount:    order.amount,
        currency:  order.currency,
        key:       process.env.RAZORPAY_KEY_ID,
        paymentId: payment._id,
      },
      "Razorpay order created."
    )
  );
});

/* ── verifyRazorpayPayment ───────────────────────────────── */

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    courseId,
    mode,
    bookType = "none",
    deliveryAddress,
  } = req.body;

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    console.error("[verify] FAIL — expected:", expected, "| got:", razorpay_signature);
    throw new ApiError(400, "Invalid payment signature.");
  }

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found.");

  // Safety check: if somehow already enrolled, record payment but don't double-enroll
  const existing = await hasActiveCourseEnrollment(req.user._id, courseId);
  if (existing) {
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    return res.json(
      new ApiResponse(200, { payment, enrollment: existing }, "Already enrolled. Payment recorded.")
    );
  }

  const coursePrice = resolveCoursePrice(course, mode);
  const bookPrice   = resolveBookPrice(course, bookType);

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id, status: "pending" },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "captured",
      paidAt: new Date(),
    },
    { new: true }
  );
  if (!payment) throw new ApiError(404, "Payment record not found.");

  const enrollment = await Enrollment.create({
    studentId:       req.user._id,
    courseId,
    mode,
    pricePaid:       coursePrice,
    bookType,
    deliveryAddress: bookType === "handbook" ? deliveryAddress : null,
    bookPricePaid:   bookPrice,
    paymentId:       payment._id,
    status:          "active",
  });

  await Payment.findByIdAndUpdate(payment._id, { enrollmentId: enrollment._id });

  const populated = await Enrollment.findById(enrollment._id)
    .populate("studentId", "name email phone")
    .populate("courseId",  "title slug thumbnailUrl onlinePrice recordedPrice")
    .populate("paymentId");

  console.log("[verify] SUCCESS — enrollment:", enrollment._id.toString());

  res.json(
    new ApiResponse(200, { payment, enrollment: populated }, "Payment verified. Enrollment created.")
  );
});

/* ── createManualPayment ─────────────────────────────────── */

const createManualPayment = asyncHandler(async (req, res) => {
  const { studentId, courseId, mode, amount } = req.body;

  if (!studentId) throw new ApiError(400, "studentId is required.");
  if (!courseId)  throw new ApiError(400, "courseId is required.");
  if (!mode || !["online", "recorded"].includes(mode)) {
    throw new ApiError(400, "mode must be 'online' or 'recorded'.");
  }

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found.");

  const existing = await hasActiveCourseEnrollment(studentId, courseId);
  if (existing) throw new ApiError(409, "Student is already enrolled in this course.");

  const coursePrice = amount ?? resolveCoursePrice(course, mode);

  const payment = await Payment.create({
    studentId,
    amount:      coursePrice,
    currency:    "INR",
    method:      "manual",
    isManual:    true,
    recordedBy:  req.user._id,
    status:      "captured",
    paidAt:      new Date(),
  });

  const enrollment = await Enrollment.create({
    studentId,
    courseId,
    mode,
    pricePaid:  coursePrice,
    bookType:   "none",
    paymentId:  payment._id,
    status:     "active",
  });

  await Payment.findByIdAndUpdate(payment._id, { enrollmentId: enrollment._id });

  res.status(201).json(
    new ApiResponse(201, { payment, enrollment }, "Manual payment recorded.")
  );
});

/* ── getPayments ─────────────────────────────────────────── */

const getPayments = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.user.role === "student") filter.studentId = req.user._id;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("studentId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(200, { payments, total, page, limit }, "Payments retrieved.")
  );
});

/* ── razorpayWebhook ─────────────────────────────────────── */

// Registered in index.js BEFORE express.json() so req.body is a raw Buffer
const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret) {
    const signature = req.headers["x-razorpay-signature"];
    const expected  = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");
    if (expected !== signature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ success: false, message: "Invalid JSON" });
  }

  if (event.event === "payment.captured") {
    const payload  = event.payload?.payment?.entity ?? {};
    const orderId  = payload.order_id;
    const paymentId = payload.id;
    if (orderId) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: "pending" },
        { status: "captured", razorpayPaymentId: paymentId, paidAt: new Date() }
      );
    }
  }

  res.json({ received: true });
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createManualPayment,
  getPayments,
  razorpayWebhook,
};
