const Banner = require("../models/Banner");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { submitForApproval } = require("../services/approval.service");

const getBanners = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const isPublic = !req.user || req.user.role === "student";
  const filter = isPublic ? { isActive: true, approvalStatus: "approved" } : {};

  const [banners, total] = await Promise.all([
    Banner.find(filter).sort({ sortOrder: 1 }).populate("createdBy", "name").skip(skip).limit(limit),
    Banner.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, { banners, total, page, limit }, "Banners retrieved."));
});

const getBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw new ApiError(404, "Banner not found.");
  res.json(new ApiResponse(200, banner, "Banner retrieved."));
});

const createBanner = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  req.body.approvalStatus = req.isDraft ? "pending" : "approved";
  if (!req.isDraft) req.body.approvedBy = req.user._id;

  const banner = await Banner.create(req.body);

  if (req.isDraft) {
    await submitForApproval("Banner", banner._id, req.user._id);
  }

  res.status(201).json(new ApiResponse(201, banner, "Banner created."));
});

const updateBanner = asyncHandler(async (req, res) => {
  if (req.isDraft) req.body.approvalStatus = "pending";

  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) throw new ApiError(404, "Banner not found.");

  if (req.isDraft) {
    await submitForApproval("Banner", banner._id, req.user._id);
  }

  res.json(new ApiResponse(200, banner, "Banner updated."));
});

const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new ApiError(404, "Banner not found.");
  res.json(new ApiResponse(200, null, "Banner deleted."));
});

module.exports = { getBanners, getBanner, createBanner, updateBanner, deleteBanner };
