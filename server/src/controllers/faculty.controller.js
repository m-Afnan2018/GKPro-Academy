const Faculty     = require("../models/Faculty");
const ApiError    = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getFaculty = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.active === "true")  filter.isActive = true;
  if (req.query.active === "false") filter.isActive = false;

  const [faculty, total] = await Promise.all([
    Faculty.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Faculty.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { faculty, total, page, limit }, "Faculty retrieved."));
});

const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new ApiError(404, "Faculty not found.");
  res.json(new ApiResponse(200, faculty, "Faculty retrieved."));
});

const createFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.create(req.body);
  res.status(201).json(new ApiResponse(201, faculty, "Faculty created."));
});

const updateFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faculty) throw new ApiError(404, "Faculty not found.");
  res.json(new ApiResponse(200, faculty, "Faculty updated."));
});

const deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findByIdAndDelete(req.params.id);
  if (!faculty) throw new ApiError(404, "Faculty not found.");
  res.json(new ApiResponse(200, null, "Faculty deleted."));
});

module.exports = { getFaculty, getFacultyById, createFaculty, updateFaculty, deleteFaculty };
