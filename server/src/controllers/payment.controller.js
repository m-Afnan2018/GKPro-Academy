const Payment = require("../models/Payment");
const Enrollment = require("../models/Enrollment");
const Batch = require("../models/Batch");
const CoursePlan = require("../models/CoursePlan");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { createOrder, verifySignature } = require("../services/payment.service");

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { planId, batchId } = req.body;

  const plan = await CoursePlan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found.");

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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, batchId } = req.body;

  const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!isValid) throw new ApiError(400, "Invalid payment signature.");

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
  const expiresAt = plan ? new Date(Date.now() + plan.validityDays * 24 * 60 * 60 * 1000) : null;

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

  res.json(new ApiResponse(200, { payment, enrollment }, "Payment verified. Enrollment created."));
});

const createManualPayment = asyncHandler(async (req, res) => {
  const { studentId, planId, batchId, amount } = req.body;

  const plan = await CoursePlan.findById(planId);
  const expiresAt = plan ? new Date(Date.now() + plan.validityDays * 24 * 60 * 60 * 1000) : null;

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

  res.status(201).json(new ApiResponse(201, { payment, enrollment }, "Manual payment recorded."));
});

const getPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.user.role === "student") filter.studentId = req.user._id;

  const [payments, total] = await Promise.all([
    Payment.find(filter).populate("studentId", "name email").skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { payments, total, page, limit }, "Payments retrieved."));
});

module.exports = { createRazorpayOrder, verifyRazorpayPayment, createManualPayment, getPayments };
