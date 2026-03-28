const ContentApproval = require("../models/ContentApproval");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Map entity type to its Mongoose model
const getModel = (entityType) => {
  try {
    return mongoose.model(entityType);
  } catch {
    return null;
  }
};

const getPendingApprovals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [approvals, total] = await Promise.all([
    ContentApproval.find({ status: "pending" })
      .populate("submittedBy", "name email")
      .skip(skip)
      .limit(limit),
    ContentApproval.countDocuments({ status: "pending" }),
  ]);

  res.json(new ApiResponse(200, { approvals, total, page, limit }, "Pending approvals retrieved."));
});

const getMyApprovals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { submittedBy: req.user._id };
  const [approvals, total] = await Promise.all([
    ContentApproval.find(filter).skip(skip).limit(limit),
    ContentApproval.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { approvals, total, page, limit }, "Your approvals retrieved."));
});

const approveApproval = asyncHandler(async (req, res) => {
  const approval = await ContentApproval.findById(req.params.id);
  if (!approval) throw new ApiError(404, "Approval record not found.");
  if (approval.status !== "pending") throw new ApiError(400, "Approval is not pending.");

  approval.status = "approved";
  approval.reviewedBy = req.user._id;
  approval.reviewedAt = new Date();
  await approval.save();

  const Model = getModel(approval.entityType);
  if (Model) {
    await Model.findByIdAndUpdate(approval.entityId, {
      approvalStatus: "approved",
      approvedBy: req.user._id,
    });
  }

  res.json(new ApiResponse(200, approval, "Approved successfully."));
});

const rejectApproval = asyncHandler(async (req, res) => {
  const approval = await ContentApproval.findById(req.params.id);
  if (!approval) throw new ApiError(404, "Approval record not found.");
  if (approval.status !== "pending") throw new ApiError(400, "Approval is not pending.");

  approval.status = "rejected";
  approval.reviewedBy = req.user._id;
  approval.reviewedAt = new Date();
  approval.reviewNotes = req.body.reviewNotes || "";
  await approval.save();

  const Model = getModel(approval.entityType);
  if (Model) {
    await Model.findByIdAndUpdate(approval.entityId, { approvalStatus: "rejected" });
  }

  res.json(new ApiResponse(200, approval, "Rejected successfully."));
});

module.exports = { getPendingApprovals, getMyApprovals, approveApproval, rejectApproval };
