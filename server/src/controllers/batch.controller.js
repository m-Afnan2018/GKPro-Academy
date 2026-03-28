const Batch = require("../models/Batch");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { submitForApproval } = require("../services/approval.service");

const getBatches = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.courseId) filter.courseId = req.query.courseId;

  // Students see only batches for their enrolled courses — handled at enrollment level
  // Managers see all batches they created
  if (req.user && req.user.role === "manager") {
    filter.createdBy = req.user._id;
  }

  const [batches, total] = await Promise.all([
    Batch.find(filter).populate("courseId", "title slug").populate("planId").skip(skip).limit(limit),
    Batch.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { batches, total, page, limit }, "Batches retrieved."));
});

const getBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id).populate("courseId").populate("planId");
  if (!batch) throw new ApiError(404, "Batch not found.");
  res.json(new ApiResponse(200, batch, "Batch retrieved."));
});

const createBatch = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;

  const batch = await Batch.create(req.body);

  if (req.isDraft) {
    await submitForApproval("Batch", batch._id, req.user._id);
  }

  res.status(201).json(new ApiResponse(201, batch, "Batch created."));
});

const updateBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!batch) throw new ApiError(404, "Batch not found.");

  if (req.isDraft) {
    await submitForApproval("Batch", batch._id, req.user._id);
  }

  res.json(new ApiResponse(200, batch, "Batch updated."));
});

const deleteBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findByIdAndDelete(req.params.id);
  if (!batch) throw new ApiError(404, "Batch not found.");
  res.json(new ApiResponse(200, null, "Batch deleted."));
});

module.exports = { getBatches, getBatch, createBatch, updateBatch, deleteBatch };
