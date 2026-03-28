const CoursePlan = require("../models/CoursePlan");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getPlans = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = req.query.courseId ? { courseId: req.query.courseId } : {};
  const [plans, total] = await Promise.all([
    CoursePlan.find(filter).populate("courseId", "title slug").skip(skip).limit(limit),
    CoursePlan.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { plans, total, page, limit }, "Plans retrieved."));
});

const getPlan = asyncHandler(async (req, res) => {
  const plan = await CoursePlan.findById(req.params.id).populate("courseId", "title slug");
  if (!plan) throw new ApiError(404, "Plan not found.");
  res.json(new ApiResponse(200, plan, "Plan retrieved."));
});

const createPlan = asyncHandler(async (req, res) => {
  const plan = await CoursePlan.create(req.body);
  res.status(201).json(new ApiResponse(201, plan, "Plan created."));
});

const updatePlan = asyncHandler(async (req, res) => {
  const plan = await CoursePlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!plan) throw new ApiError(404, "Plan not found.");
  res.json(new ApiResponse(200, plan, "Plan updated."));
});

const deletePlan = asyncHandler(async (req, res) => {
  const plan = await CoursePlan.findByIdAndDelete(req.params.id);
  if (!plan) throw new ApiError(404, "Plan not found.");
  res.json(new ApiResponse(200, null, "Plan deleted."));
});

module.exports = { getPlans, getPlan, createPlan, updatePlan, deletePlan };
