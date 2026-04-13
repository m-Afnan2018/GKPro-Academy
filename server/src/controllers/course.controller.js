const Course = require("../models/Course");
const CoursePlan = require("../models/CoursePlan");
const Faq = require("../models/Faq");
const CourseCategory = require("../models/CourseCategory");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { submitForApproval } = require("../services/approval.service");

const getCourses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { status: "published", approvalStatus: "approved" };

  if (req.query.categoryIds) {
    const ids = req.query.categoryIds.split(",").filter(Boolean);
    if (ids.length === 1) filter.categoryId = ids[0];
    else if (ids.length > 1) filter.categoryId = { $in: ids };
  } else if (req.query.category) {
    const cat = await CourseCategory.findOne({ slug: req.query.category });
    if (cat) filter.categoryId = cat._id;
  }

  if (req.query.subcategoryIds) {
    const ids = req.query.subcategoryIds.split(",").filter(Boolean);
    if (ids.length === 1) filter.subcategoryId = ids[0];
    else if (ids.length > 1) filter.subcategoryId = { $in: ids };
  } else if (req.query.subcategoryId) {
    filter.subcategoryId = req.query.subcategoryId;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const sortMap = {
    newest:     { createdAt: -1 },
    oldest:     { createdAt:  1 },
    price_asc:  { onlinePrice: 1,  recordedPrice: 1  },
    price_desc: { onlinePrice: -1, recordedPrice: -1 },
    name_asc:   { title:  1 },
    name_desc:  { title: -1 },
  };
  const sortQuery = sortMap[req.query.sort] || { createdAt: -1 };

  const [courses, total] = await Promise.all([
    Course.find(filter).populate("categoryId").populate("faculty").sort(sortQuery).skip(skip).limit(limit),
    Course.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { courses, total, page, limit }, "Courses retrieved."));
});

const getCourseBySlug = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, status: "published" })
    .populate("categoryId")
    .populate("subcategoryId", "name slug")
    .populate("faculty")
    .populate("createdBy", "name");

  if (!course) throw new ApiError(404, "Course not found.");

  const [plans, faqs] = await Promise.all([
    CoursePlan.find({ courseId: course._id, isActive: true }),
    Faq.find({ courseId: course._id, isActive: true }).sort({ sortOrder: 1 }),
  ]);

  res.json(new ApiResponse(200, { course, plans, faqs }, "Course retrieved."));
});

const createCourse = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;

  if (req.isDraft) {
    req.body.approvalStatus = "pending";
  } else {
    req.body.approvalStatus = "approved";
    req.body.approvedBy = req.user._id;
  }

  const course = await Course.create(req.body);

  if (req.isDraft) {
    await submitForApproval("Course", course._id, req.user._id);
  }

  res.status(201).json(new ApiResponse(201, course, "Course created."));
});

const updateCourse = asyncHandler(async (req, res) => {
  if (req.isDraft) {
    req.body.approvalStatus = "pending";
  }

  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!course) throw new ApiError(404, "Course not found.");

  if (req.isDraft) {
    await submitForApproval("Course", course._id, req.user._id);
  }

  res.json(new ApiResponse(200, course, "Course updated."));
});

const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw new ApiError(404, "Course not found.");
  res.json(new ApiResponse(200, null, "Course deleted."));
});

const getAllCoursesAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    Course.find().populate("categoryId").populate("subcategoryId").populate("faculty").populate("createdBy", "name").skip(skip).limit(limit),
    Course.countDocuments(),
  ]);

  res.json(new ApiResponse(200, { courses, total, page, limit }, "All courses retrieved."));
});

module.exports = { getCourses, getCourseBySlug, createCourse, updateCourse, deleteCourse, getAllCoursesAdmin };
