const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const populateEnrollment = (query) =>
  query
    .populate("studentId", "name email phone avatarUrl")
    .populate({ path: "courseId", select: "title slug thumbnailUrl onlinePrice recordedPrice", strictPopulate: false })
    .populate("paymentId");

const getEnrollments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.user.role === "student") filter.studentId = req.user._id;

  const [enrollments, total] = await Promise.all([
    populateEnrollment(
      Enrollment.find(filter).sort({ enrolledAt: -1 }).skip(skip).limit(limit)
    ),
    Enrollment.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { enrollments, total, page, limit }, "Enrollments retrieved."));
});

const getEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate("studentId", "name email phone avatarUrl")
    .populate({ path: "courseId", select: "title slug description thumbnailUrl onlinePrice recordedPrice eBookUrl", strictPopulate: false })
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

// Student self-enrollment
const createEnrollment = asyncHandler(async (req, res) => {
  const { courseId, mode, bookType = "none", deliveryAddress } = req.body;
  if (!courseId || !mode) throw new ApiError(400, "courseId and mode are required.");
  if (!["online", "recorded"].includes(mode)) throw new ApiError(400, "Invalid mode.");
  if (bookType === "handbook" && !deliveryAddress?.trim()) {
    throw new ApiError(400, "Delivery address is required for handbook.");
  }

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found.");

  const existing = await Enrollment.findOne({ studentId: req.user._id, courseId, status: "active" });
  if (existing) throw new ApiError(409, "You are already enrolled in this course.");

  const coursePrice = mode === "online" ? (course.onlinePrice ?? 0) : (course.recordedPrice ?? 0);

  const enrollment = await Enrollment.create({
    studentId: req.user._id,
    courseId,
    mode,
    pricePaid: coursePrice,
    bookType,
    deliveryAddress: bookType === "handbook" ? deliveryAddress : null,
    bookPricePaid: 0,
    status: "active",
  });

  const populated = await populateEnrollment(Enrollment.findById(enrollment._id));
  res.status(201).json(new ApiResponse(201, populated, "Enrolled successfully."));
});

// Admin-only: enroll any student in a course
const adminCreateEnrollment = asyncHandler(async (req, res) => {
  const { studentId, courseId, mode, bookType = "none", deliveryAddress } = req.body;
  if (!studentId || !courseId || !mode) {
    throw new ApiError(400, "studentId, courseId, and mode are required.");
  }
  if (!["online", "recorded"].includes(mode)) throw new ApiError(400, "Invalid mode.");

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found.");

  const existing = await Enrollment.findOne({ studentId, courseId, status: "active" });
  if (existing) throw new ApiError(409, "Student is already enrolled in this course.");

  const coursePrice = mode === "online" ? (course.onlinePrice ?? 0) : (course.recordedPrice ?? 0);

  const enrollment = await Enrollment.create({
    studentId,
    courseId,
    mode,
    pricePaid: coursePrice,
    bookType,
    deliveryAddress: bookType === "handbook" ? deliveryAddress : null,
    bookPricePaid: 0,
    status: "active",
  });

  const populated = await populateEnrollment(Enrollment.findById(enrollment._id));
  res.status(201).json(new ApiResponse(201, populated, "Enrolled successfully."));
});

module.exports = {
  getEnrollments,
  getEnrollment,
  updateEnrollment,
  cancelEnrollment,
  createEnrollment,
  adminCreateEnrollment,
};
