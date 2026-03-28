const Announcement = require("../models/Announcement");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { submitForApproval } = require("../services/approval.service");

const getAnnouncements = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const isPublic = !req.user || req.user.role === "student";
  const filter = isPublic ? { isActive: true, approvalStatus: "approved" } : {};

  const [announcements, total] = await Promise.all([
    Announcement.find(filter).populate("createdBy", "name").skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { announcements, total, page, limit }, "Announcements retrieved."));
});

const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate("createdBy", "name");
  if (!announcement) throw new ApiError(404, "Announcement not found.");
  res.json(new ApiResponse(200, announcement, "Announcement retrieved."));
});

const createAnnouncement = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  req.body.approvalStatus = req.isDraft ? "pending" : "approved";
  if (!req.isDraft) req.body.approvedBy = req.user._id;

  const announcement = await Announcement.create(req.body);

  if (req.isDraft) {
    await submitForApproval("Announcement", announcement._id, req.user._id);
  }

  res.status(201).json(new ApiResponse(201, announcement, "Announcement created."));
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  if (req.isDraft) req.body.approvalStatus = "pending";

  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!announcement) throw new ApiError(404, "Announcement not found.");

  if (req.isDraft) {
    await submitForApproval("Announcement", announcement._id, req.user._id);
  }

  res.json(new ApiResponse(200, announcement, "Announcement updated."));
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) throw new ApiError(404, "Announcement not found.");
  res.json(new ApiResponse(200, null, "Announcement deleted."));
});

module.exports = { getAnnouncements, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement };
