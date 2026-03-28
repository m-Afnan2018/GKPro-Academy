const Resource   = require("../models/Resource");
const Enrollment = require("../models/Enrollment");
const Batch      = require("../models/Batch");
const ApiError   = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { submitForApproval } = require("../services/approval.service");

/* ── helper ──────────────────────────────────────────── */
async function isEnrolled(userId, courseId) {
  const batches = await Batch.find({ courseId }).select("_id");
  if (!batches.length) return false;
  const enrollment = await Enrollment.findOne({
    studentId: userId,
    batchId:   { $in: batches.map((b) => b._id) },
    status:    "active",
  });
  return !!enrollment;
}

/* ── controllers ─────────────────────────────────────── */

const getResources = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip  = (page - 1) * limit;

  const isAdmin   = req.user && (req.user.role === "admin" || req.user.role === "manager");
  const isStudent = req.user && req.user.role === "student";
  const filter = {};

  if (req.query.courseId) {
    filter.courseId = req.query.courseId;

    if (isStudent) {
      const enrolled = await isEnrolled(req.user._id, req.query.courseId);
      filter.approvalStatus = "approved";
      if (!enrolled) filter.isPublic = true;  // unenrolled → only public
    } else if (!isAdmin) {
      filter.isPublic = true;
      filter.approvalStatus = "approved";
    }
  } else if (!isAdmin) {
    filter.isPublic = true;
    filter.approvalStatus = "approved";
  }

  const [resources, total] = await Promise.all([
    Resource.find(filter)
      .populate("courseId", "title slug")
      .sort({ section: 1, sortOrder: 1 })
      .skip(skip).limit(limit),
    Resource.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { resources, total, page, limit }, "Resources retrieved."));
});

const getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate("courseId", "title slug");
  if (!resource) throw new ApiError(404, "Resource not found.");
  res.json(new ApiResponse(200, resource, "Resource retrieved."));
});

const createResource = asyncHandler(async (req, res) => {
  req.body.createdBy  = req.user._id;
  req.body.approvalStatus = req.isDraft ? "pending" : "approved";
  if (!req.isDraft) req.body.approvedBy = req.user._id;

  const resource = await Resource.create(req.body);
  if (req.isDraft) await submitForApproval("Resource", resource._id, req.user._id);

  res.status(201).json(new ApiResponse(201, resource, "Resource created."));
});

const updateResource = asyncHandler(async (req, res) => {
  if (req.isDraft) req.body.approvalStatus = "pending";
  const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!resource) throw new ApiError(404, "Resource not found.");
  if (req.isDraft) await submitForApproval("Resource", resource._id, req.user._id);
  res.json(new ApiResponse(200, resource, "Resource updated."));
});

const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndDelete(req.params.id);
  if (!resource) throw new ApiError(404, "Resource not found.");
  res.json(new ApiResponse(200, null, "Resource deleted."));
});

const accessResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new ApiError(404, "Resource not found.");

  if (resource.isPublic && resource.approvalStatus === "approved") {
    return res.json(new ApiResponse(200, { url: resource.url, type: resource.type }, "Access granted."));
  }

  if (!req.user) throw new ApiError(401, "Please log in to access this content.");

  if (req.user.role === "admin" || req.user.role === "manager") {
    return res.json(new ApiResponse(200, { url: resource.url, type: resource.type }, "Access granted."));
  }

  if (resource.courseId) {
    const enrolled = await isEnrolled(req.user._id, resource.courseId);
    if (!enrolled) throw new ApiError(403, "You are not enrolled in this course.");
  }

  res.json(new ApiResponse(200, { url: resource.url, type: resource.type }, "Access granted."));
});

module.exports = {
  getResources, getResource, createResource, updateResource, deleteResource, accessResource,
};
