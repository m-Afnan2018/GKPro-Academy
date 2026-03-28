const Lead = require("../models/Lead");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.user.role === "manager") filter.assignedTo = req.user._id;

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate("courseId", "title slug")
      .populate("assignedTo", "name email")
      .skip(skip)
      .limit(limit),
    Lead.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { leads, total, page, limit }, "Leads retrieved."));
});

const getLead = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === "manager") filter.assignedTo = req.user._id;

  const lead = await Lead.findOne(filter).populate("courseId", "title slug").populate("assignedTo", "name email");
  if (!lead) throw new ApiError(404, "Lead not found.");
  res.json(new ApiResponse(200, lead, "Lead retrieved."));
});

const createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create(req.body);
  res.status(201).json(new ApiResponse(201, lead, "Lead created."));
});

const updateLead = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === "manager") filter.assignedTo = req.user._id;

  const lead = await Lead.findOneAndUpdate(filter, req.body, { new: true });
  if (!lead) throw new ApiError(404, "Lead not found.");
  res.json(new ApiResponse(200, lead, "Lead updated."));
});

const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) throw new ApiError(404, "Lead not found.");
  res.json(new ApiResponse(200, null, "Lead deleted."));
});

const convertLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { status: "converted", ...req.body },
    { new: true }
  );
  if (!lead) throw new ApiError(404, "Lead not found.");
  res.json(new ApiResponse(200, lead, "Lead converted."));
});

module.exports = { getLeads, getLead, createLead, updateLead, deleteLead, convertLead };
