const Blog = require("../models/Blog");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { submitForApproval } = require("../services/approval.service");

const getBlogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const isPublic = !req.user || req.user.role === "student";
  const filter = isPublic ? { isPublished: true, approvalStatus: "approved" } : {};

  let blogQuery = Blog.find(filter)
    .populate("authorId", "name")
    .populate("courseTags", "title slug")
    .skip(skip)
    .limit(limit);
  if (isPublic) blogQuery = blogQuery.select("-content");

  const [blogs, total] = await Promise.all([
    blogQuery,
    Blog.countDocuments(filter),
  ]);

  res.json(new ApiResponse(200, { blogs, total, page, limit }, "Blogs retrieved."));
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const filter = { slug: req.params.slug };
  const isPublic = !req.user || req.user.role === "student";
  if (isPublic) { filter.isPublished = true; filter.approvalStatus = "approved"; }

  const blog = await Blog.findOne(filter)
    .populate("authorId", "name")
    .populate("courseTags", "title slug");
  if (!blog) throw new ApiError(404, "Blog not found.");
  res.json(new ApiResponse(200, blog, "Blog retrieved."));
});

const createBlog = asyncHandler(async (req, res) => {
  req.body.authorId = req.user._id;
  req.body.approvalStatus = req.isDraft ? "pending" : "approved";
  if (!req.isDraft) req.body.approvedBy = req.user._id;

  const blog = await Blog.create(req.body);

  if (req.isDraft) {
    await submitForApproval("Blog", blog._id, req.user._id);
  }

  res.status(201).json(new ApiResponse(201, blog, "Blog created."));
});

const updateBlog = asyncHandler(async (req, res) => {
  if (req.isDraft) req.body.approvalStatus = "pending";

  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!blog) throw new ApiError(404, "Blog not found.");

  if (req.isDraft) {
    await submitForApproval("Blog", blog._id, req.user._id);
  }

  res.json(new ApiResponse(200, blog, "Blog updated."));
});

const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found.");
  res.json(new ApiResponse(200, null, "Blog deleted."));
});

module.exports = { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog };
