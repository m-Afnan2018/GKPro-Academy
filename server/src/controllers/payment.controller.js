const crypto   = require("crypto");
const Payment  = require("../models/Payment");
const Enrollment = require("../models/Enrollment");
const Batch    = require("../models/Batch");
const CoursePlan = require("../models/CoursePlan");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { createOrder, verifySignature } = require("../services/payment.service");
const { hasActiveCourseEnrollment } = require("./enrollment.controller");

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { planId, batchId } = req.body;

  const [plan, batch] = await Promise.all([
    CoursePlan.findById(planId),
    Batch.findById(batchId),
  ]);
  if (!plan)  throw new ApiError(404, "Plan not found.");
  if (!batch) throw new ApiError(404, "Batch not found.");

  // Block order creation if already actively enrolled in this course
  const existing = await hasActiveCourseEnrollment(req.user._id, batch.courseId);
  if (existing) {
    throw new ApiError(
      409,
      "You are already enrolled in this course. Cancel your current enrollment first to switch plans."
    );
  }

  const amountInPaise = plan.price * 100;
  const order = await createOrder(amountInPaise);

  const payment = await Payment.create({
    studentId: req.user._id,
    amount: plan.price,
    currency: "INR",
    method: "razorpay",
    razorpayOrderId: order.id,
    status: "pending",
  });

  res.json(
    new ApiResponse(
      200,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        paymentId: payment._id,
      },
      "Razorpay order created."
    )
  );
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId,
    batchId,
  } = req.body;

  const isValid = verifySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );
  if (!isValid) throw new ApiError(400, "Invalid payment signature.");

  // Find batch to get courseId for duplicate check
  const batch = await Batch.findById(batchId);
  if (!batch) throw new ApiError(404, "Batch not found.");

  // Safety: prevent duplicate enrollment even if order was already processed
  const existing = await hasActiveCourseEnrollment(req.user._id, batch.courseId);
  if (existing) {
    // Payment already succeeded but enrollment exists — return success with existing
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    return res.json(
      new ApiResponse(200, { payment, enrollment: existing }, "Already enrolled. Payment recorded.")
    );
  }

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: "captured",
      paidAt: new Date(),
    },
    { new: true }
  );
  if (!payment) throw new ApiError(404, "Payment record not found.");

  const plan = await CoursePlan.findById(planId);
  const expiresAt = plan
    ? new Date(Date.now() + plan.validityDays * 24 * 60 * 60 * 1000)
    : null;

  const enrollment = await Enrollment.create({
    studentId: req.user._id,
    batchId,
    planId,
    expiresAt,
    paymentId: payment._id,
    status: "active",
  });

  await Payment.findByIdAndUpdate(payment._id, { enrollmentId: enrollment._id });
  await Batch.findByIdAndUpdate(batchId, { $inc: { enrolledCount: 1 } });

  const populated = await Enrollment.findById(enrollment._id)
    .populate("studentId", "name email phone")
    .populate({ path: "batchId", populate: { path: "courseId", select: "title slug thumbnailUrl" } })
    .populate("planId")
    .populate("paymentId");

  res.json(
    new ApiResponse(200, { payment, enrollment: populated }, "Payment verified. Enrollment created.")
  );
});

const createManualPayment = asyncHandler(async (req, res) => {
  const { studentId, planId, batchId, amount } = req.body;

  const plan = await CoursePlan.findById(planId);
  const expiresAt = plan
    ? new Date(Date.now() + plan.validityDays * 24 * 60 * 60 * 1000)
    : null;

  const payment = await Payment.create({
    studentId,
    amount,
    currency: "INR",
    method: "manual",
    isManual: true,
    recordedBy: req.user._id,
    status: "captured",
    paidAt: new Date(),
  });

  const enrollment = await Enrollment.create({
    studentId,
    batchId,
    planId,
    expiresAt,
    paymentId: payment._id,
    status: "active",
  });

  await Payment.findByIdAndUpdate(payment._id, { enrollmentId: enrollment._id });
  await Batch.findByIdAndUpdate(batchId, { $inc: { enrolledCount: 1 } });

  res.status(201).json(
    new ApiResponse(201, { payment, enrollment }, "Manual payment recorded.")
  );
});

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

// Razorpay webhook — receives server-to-server events (payment.captured, etc.)
// Route must be registered BEFORE express.json() with express.raw({ type: "*/*" })
const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Validate signature only when a secret is configured
  if (webhookSecret) {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body; // raw Buffer
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
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
    const payload = event.payload?.payment?.entity ?? {};
    const orderId  = payload.order_id;
    const paymentId = payload.id;

    if (orderId) {
      // Mark payment as captured if still pending (idempotent)
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
