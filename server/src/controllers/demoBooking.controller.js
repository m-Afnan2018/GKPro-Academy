const DemoBooking = require("../models/DemoBooking");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    DemoBooking.find()
      .populate("courseId", "title slug")
      .populate("handledBy", "name email")
      .skip(skip)
      .limit(limit),
    DemoBooking.countDocuments(),
  ]);

  res.json(new ApiResponse(200, { bookings, total, page, limit }, "Demo bookings retrieved."));
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await DemoBooking.findById(req.params.id)
    .populate("courseId", "title slug")
    .populate("handledBy", "name email");
  if (!booking) throw new ApiError(404, "Booking not found.");
  res.json(new ApiResponse(200, booking, "Booking retrieved."));
});

const createBooking = asyncHandler(async (req, res) => {
  const booking = await DemoBooking.create(req.body);
  res.status(201).json(new ApiResponse(201, booking, "Demo booking created."));
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await DemoBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!booking) throw new ApiError(404, "Booking not found.");
  res.json(new ApiResponse(200, booking, "Booking updated."));
});

const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await DemoBooking.findByIdAndDelete(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found.");
  res.json(new ApiResponse(200, null, "Booking deleted."));
});

module.exports = { getBookings, getBooking, createBooking, updateBooking, deleteBooking };
