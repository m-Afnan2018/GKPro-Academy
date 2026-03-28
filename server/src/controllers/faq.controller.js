const Faq = require("../models/Faq");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getFaqs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const isPublic = !req.user || req.user.role === "student";
  const filter = isPublic ? { isActive: true } : {};
  if (req.query.courseId) filter.courseId = req.query.courseId;
  else if (req.query.global === "true") filter.courseId = null;

  const [faqs, total] = await Promise.all([
    Faq.find(filter).sort({ sortOrder: 1 }).skip(skip).limit(limit),
    Faq.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { faqs, total, page, limit }, "FAQs retrieved."));
});

const getFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found.");
  res.json(new ApiResponse(200, faq, "FAQ retrieved."));
});

const createFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.create(req.body);
  res.status(201).json(new ApiResponse(201, faq, "FAQ created."));
});

const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) throw new ApiError(404, "FAQ not found.");
  res.json(new ApiResponse(200, faq, "FAQ updated."));
});

const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndDelete(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found.");
  res.json(new ApiResponse(200, null, "FAQ deleted."));
});

module.exports = { getFaqs, getFaq, createFaq, updateFaq, deleteFaq };
