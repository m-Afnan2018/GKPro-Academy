const CourseCategory = require("../models/CourseCategory");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    CourseCategory.find().sort({ sortOrder: 1 }).skip(skip).limit(limit),
    CourseCategory.countDocuments(),
  ]);

  res.json(new ApiResponse(200, { categories, total, page, limit }, "Categories retrieved."));
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await CourseCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found.");
  res.json(new ApiResponse(200, category, "Category retrieved."));
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await CourseCategory.findOne({ slug: req.params.slug });
  if (!category) throw new ApiError(404, "Category not found.");
  res.json(new ApiResponse(200, category, "Category retrieved."));
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await CourseCategory.create(req.body);
  res.status(201).json(new ApiResponse(201, category, "Category created."));
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await CourseCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) throw new ApiError(404, "Category not found.");
  res.json(new ApiResponse(200, category, "Category updated."));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await CourseCategory.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, "Category not found.");
  res.json(new ApiResponse(200, null, "Category deleted."));
});

module.exports = { getCategories, getCategory, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
