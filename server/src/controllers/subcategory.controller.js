const CourseSubcategory = require("../models/CourseSubcategory");
const ApiError    = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getSubcategories = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;

  const [subcategories, total] = await Promise.all([
    CourseSubcategory.find(filter)
      .populate("categoryId", "name slug")
      .sort({ sortOrder: 1 })
      .skip(skip)
      .limit(limit),
    CourseSubcategory.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { subcategories, total, page, limit }, "Subcategories retrieved."));
});

const getSubcategory = asyncHandler(async (req, res) => {
  const sub = await CourseSubcategory.findById(req.params.id).populate("categoryId", "name slug");
  if (!sub) throw new ApiError(404, "Subcategory not found.");
  res.json(new ApiResponse(200, sub, "Subcategory retrieved."));
});

const createSubcategory = asyncHandler(async (req, res) => {
  const sub = await CourseSubcategory.create(req.body);
  res.status(201).json(new ApiResponse(201, sub, "Subcategory created."));
});

const updateSubcategory = asyncHandler(async (req, res) => {
  // If name is changing, regenerate slug via pre-save — use findById + save
  const sub = await CourseSubcategory.findById(req.params.id);
  if (!sub) throw new ApiError(404, "Subcategory not found.");

  Object.assign(sub, req.body);
  await sub.save();

  res.json(new ApiResponse(200, sub, "Subcategory updated."));
});

const deleteSubcategory = asyncHandler(async (req, res) => {
  const sub = await CourseSubcategory.findByIdAndDelete(req.params.id);
  if (!sub) throw new ApiError(404, "Subcategory not found.");
  res.json(new ApiResponse(200, null, "Subcategory deleted."));
});

module.exports = {
  getSubcategories,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
