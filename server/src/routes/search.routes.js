const express    = require("express");
const Course     = require("../models/Course");
const Blog       = require("../models/Blog");
const CourseCategory = require("../models/CourseCategory");
const ApiResponse    = require("../utils/ApiResponse");
const asyncHandler   = require("../utils/asyncHandler");

const router = express.Router();

// GET /api/search?q=term&type=all|courses|blogs|categories&page=1&limit=10
router.get("/", asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json(new ApiResponse(200, { courses: [], blogs: [], categories: [], coursesTotal: 0, blogsTotal: 0, categoriesTotal: 0 }, "Empty query"));

  const type  = req.query.type  || "all";
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(20, parseInt(req.query.limit) || 8);
  const skip  = (page - 1) * limit;

  const regex  = { $regex: q, $options: "i" };
  const result = { courses: [], blogs: [], categories: [], coursesTotal: 0, blogsTotal: 0, categoriesTotal: 0 };

  const tasks = [];

  if (type === "all" || type === "courses") {
    const filter = {
      status: "published",
      approvalStatus: "approved",
      $or: [{ title: regex }, { description: regex }, { overview: regex }],
    };
    tasks.push(
      Course.find(filter)
        .populate("categoryId", "name slug")
        .select("title slug description thumbnailUrl onlinePrice recordedPrice onlineOriginalPrice recordedOriginalPrice categoryId")
        .sort({ createdAt: -1 })
        .skip(type === "all" ? 0 : skip)
        .limit(type === "all" ? 4 : limit)
        .then(docs  => { result.courses = docs; })
        .then(() => Course.countDocuments(filter))
        .then(count => { result.coursesTotal = count; })
    );
  }

  if (type === "all" || type === "blogs") {
    const filter = {
      isPublished: true,
      approvalStatus: "approved",
      $or: [{ title: regex }, { content: regex }],
    };
    tasks.push(
      Blog.find(filter)
        .populate("authorId", "name")
        .select("title slug imageUrl createdAt authorId")
        .sort({ createdAt: -1 })
        .skip(type === "all" ? 0 : skip)
        .limit(type === "all" ? 4 : limit)
        .then(docs  => { result.blogs = docs; })
        .then(() => Blog.countDocuments(filter))
        .then(count => { result.blogsTotal = count; })
    );
  }

  if (type === "all" || type === "categories") {
    const filter = {
      $or: [{ name: regex }, { description: regex }],
    };
    tasks.push(
      CourseCategory.find(filter)
        .select("name slug description imageUrl isComingSoon")
        .sort({ sortOrder: 1 })
        .skip(type === "all" ? 0 : skip)
        .limit(type === "all" ? 4 : limit)
        .then(docs  => { result.categories = docs; })
        .then(() => CourseCategory.countDocuments(filter))
        .then(count => { result.categoriesTotal = count; })
    );
  }

  await Promise.all(tasks);
  res.json(new ApiResponse(200, result, "Search results"));
}));

module.exports = router;
