const Enrollment = require("../models/Enrollment");
const Batch      = require("../models/Batch");
const CoursePlan = require("../models/CoursePlan");
const ApiError   = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Helper: check if student is already actively enrolled in any batch of a course
async function hasActiveCourseEnrollment(studentId, courseId) {
  const batches = await Batch.find({ courseId }).select("_id");
  if (!batches.length) return null;
  return Enrollment.findOne({
    studentId,
    batchId: { $in: batches.map((b) => b._id) },
    status: "active",
  });
}

const getEnrollments = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.user.role === "student") filter.studentId = req.user._id;

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate("studentId", "name email phone")
      .populate({ path: "batchId", populate: { path: "courseId", select: "title slug thumbnailUrl" } })
      .populate("planId")
      .populate("paymentId")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { enrollments, total, page, limit }, "Enrollments retrieved."));
});

const getEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate("studentId", "name email phone")
    .populate({ path: "batchId", populate: { path: "courseId", select: "title slug description thumbnailUrl" } })
    .populate("planId")
    .populate("paymentId");

  if (!enrollment) throw new ApiError(404, "Enrollment not found.");

  if (
    req.user.role === "student" &&
    enrollment.studentId._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized.");
  }

  res.json(new ApiResponse(200, enrollment, "Enrollment retrieved."));
});

const updateEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!enrollment) throw new ApiError(404, "Enrollment not found.");
  res.json(new ApiResponse(200, enrollment, "Enrollment updated."));
});

const cancelEnrollment = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === "student") filter.studentId = req.user._id;

  const enrollment = await Enrollment.findOneAndUpdate(
    filter,
    { status: "cancelled" },
    { new: true }
  );
  if (!enrollment) throw new ApiError(404, "Enrollment not found.");
  res.json(new ApiResponse(200, enrollment, "Enrollment cancelled."));
});

// Student self-enrollment: POST /api/enrollments { batchId, planId }
const createEnrollment = asyncHandler(async (req, res) => {
  const { batchId, planId } = req.body;
  if (!batchId || !planId) throw new ApiError(400, "batchId and planId are required.");

  const [batch, plan] = await Promise.all([
    Batch.findById(batchId),
    CoursePlan.findById(planId),
  ]);
  if (!batch) throw new ApiError(404, "Batch not found.");
  if (!plan)  throw new ApiError(404, "Plan not found.");
  if (batch.status === "cancelled") throw new ApiError(400, "This batch is cancelled.");

  // Block if student already has an ACTIVE enrollment in ANY batch of this course
  const existing = await hasActiveCourseEnrollment(req.user._id, batch.courseId);
  if (existing) {
    throw new ApiError(
      409,
      "You are already enrolled in this course. Cancel your current enrollment first to switch plans."
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (plan.validityDays || 365));

  const enrollment = await Enrollment.create({
    studentId: req.user._id,
    batchId,
    planId,
    expiresAt,
    status: "active",
  });

  await Batch.findByIdAndUpdate(batchId, { $inc: { enrolledCount: 1 } });

  const populated = await Enrollment.findById(enrollment._id)
    .populate("studentId", "name email phone")
    .populate({ path: "batchId", populate: { path: "courseId", select: "title slug thumbnailUrl" } })
    .populate("planId");

  res.status(201).json(new ApiResponse(201, populated, "Enrolled successfully."));
});

module.exports = {
  getEnrollments,
  getEnrollment,
  updateEnrollment,
  cancelEnrollment,
  createEnrollment,
  hasActiveCourseEnrollment,
};
