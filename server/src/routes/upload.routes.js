const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// __dirname = /app/src/routes  →  ../../ = /app  →  /app/uploads (matches Docker volume)
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

/* ── Image upload (POST /api/upload) ── */
const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new ApiError(400, "Only image files are allowed."));
};
const uploadImage = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post(
  "/",
  protect,
  requireRole("admin", "manager"),
  uploadImage.single("file"),
  (req, res) => {
    if (!req.file) throw new ApiError(400, "No file uploaded.");
    res.json(new ApiResponse(200, { url: `/uploads/${req.file.filename}` }, "File uploaded."));
  }
);

/* ── Avatar upload (POST /api/upload/avatar) — any authenticated user ── */
router.post(
  "/avatar",
  protect,
  uploadImage.single("file"),
  (req, res) => {
    if (!req.file) throw new ApiError(400, "No file uploaded.");
    res.json(new ApiResponse(200, { url: `/uploads/${req.file.filename}` }, "Avatar uploaded."));
  }
);

/* ── PDF upload (POST /api/upload/pdf) ── */
const pdfFilter = (_req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new ApiError(400, "Only PDF files are allowed."));
};
const uploadPdf = multer({ storage, fileFilter: pdfFilter, limits: { fileSize: 50 * 1024 * 1024 } });

router.post(
  "/pdf",
  protect,
  requireRole("admin", "manager"),
  uploadPdf.single("file"),
  (req, res) => {
    if (!req.file) throw new ApiError(400, "No file uploaded.");
    res.json(new ApiResponse(200, { url: `/uploads/${req.file.filename}` }, "PDF uploaded."));
  }
);

/* ── Material upload (POST /api/upload/material) — video/pdf/doc ── */
const materialFilter = (_req, file, cb) => {
  const allowed = [
    "video/mp4", "video/quicktime", "video/webm", "video/x-matroska", "video/avi",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new ApiError(400, "Allowed types: MP4, MOV, WebM, PDF, DOC, DOCX, XLS, XLSX."));
};
const uploadMaterial = multer({ storage, fileFilter: materialFilter, limits: { fileSize: 500 * 1024 * 1024 } });

router.post(
  "/material",
  protect,
  requireRole("admin", "manager"),
  uploadMaterial.single("file"),
  (req, res) => {
    if (!req.file) throw new ApiError(400, "No file uploaded.");
    res.json(new ApiResponse(200, {
      url: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    }, "Material uploaded."));
  }
);

module.exports = router;
