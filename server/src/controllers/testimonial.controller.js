const Testimonial = require("../models/Testimonial");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { submitForApproval } = require("../services/approval.service");

const getTestimonials = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const isPublic = !req.user || req.user.role === "student";
  const filter = isPublic ? { isActive: true, approvalStatus: "approved" } : {};

  const [testimonials, total] = await Promise.all([
    Testimonial.find(filter).skip(skip).limit(limit),
    Testimonial.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { testimonials, total, page, limit }, "Testimonials retrieved."));
});

const getTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) throw new ApiError(404, "Testimonial not found.");
  res.json(new ApiResponse(200, testimonial, "Testimonial retrieved."));
});

const createTestimonial = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  req.body.approvalStatus = req.isDraft ? "pending" : "approved";
  if (!req.isDraft) req.body.approvedBy = req.user._id;

  const testimonial = await Testimonial.create(req.body);

  if (req.isDraft) {
    await submitForApproval("Testimonial", testimonial._id, req.user._id);
  }

  res.status(201).json(new ApiResponse(201, testimonial, "Testimonial created."));
});

const updateTestimonial = asyncHandler(async (req, res) => {
  if (req.isDraft) req.body.approvalStatus = "pending";

  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!testimonial) throw new ApiError(404, "Testimonial not found.");

  if (req.isDraft) {
    await submitForApproval("Testimonial", testimonial._id, req.user._id);
  }

  res.json(new ApiResponse(200, testimonial, "Testimonial updated."));
});

const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) throw new ApiError(404, "Testimonial not found.");
  res.json(new ApiResponse(200, null, "Testimonial deleted."));
});

module.exports = { getTestimonials, getTestimonial, createTestimonial, updateTestimonial, deleteTestimonial };
