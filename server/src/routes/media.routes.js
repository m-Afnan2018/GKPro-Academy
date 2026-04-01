const express  = require("express");
const path     = require("path");
const fs       = require("fs");
const multer   = require("multer");
const router   = express.Router();
const { protect }     = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const ApiError    = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

const IMAGE_EXTS    = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"]);
const VIDEO_EXTS    = new Set([".mp4", ".mov", ".webm", ".mkv", ".avi"]);
const PDF_EXTS      = new Set([".pdf"]);
const DOC_EXTS      = new Set([".doc", ".docx"]);

function typeOf(ext) {
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (PDF_EXTS.has(ext))   return "pdf";
  if (DOC_EXTS.has(ext))   return "document";
  return "other";
}

function fmtSize(bytes) {
  if (bytes < 1024)             return `${bytes} B`;
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── GET /api/media ─────────────────────────────── */
router.get("/", protect, requireRole("admin", "manager"), (req, res) => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    return res.json(new ApiResponse(200, { files: [], total: 0 }, "No files."));
  }

  const typeFilter   = req.query.type   || "all";
  const searchFilter = (req.query.search || "").toLowerCase();
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 50;

  let files = fs.readdirSync(UPLOADS_DIR)
    .map(filename => {
      const filePath = path.join(UPLOADS_DIR, filename);
      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) return null;
        const ext = path.extname(filename).toLowerCase();
        const type = typeOf(ext);
        return {
          filename,
          url: `/uploads/${filename}`,
          ext,
          type,
          size: stat.size,
          sizeFormatted: fmtSize(stat.size),
          createdAt: stat.birthtime || stat.mtime,
          mtime: stat.mtime,
        };
      } catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

  if (typeFilter !== "all") files = files.filter(f => f.type === typeFilter);
  if (searchFilter)         files = files.filter(f => f.filename.toLowerCase().includes(searchFilter));

  const total  = files.length;
  const paged  = files.slice((page - 1) * limit, page * limit);

  res.json(new ApiResponse(200, { files: paged, total, page, limit }, "Files listed."));
});

/* ── DELETE /api/media/:filename ────────────────── */
router.delete("/:filename", protect, requireRole("admin", "manager"), (req, res) => {
  // Prevent path traversal
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) throw new ApiError(404, "File not found.");

  fs.unlinkSync(filePath);
  res.json(new ApiResponse(200, null, "File deleted."));
});

/* ── POST /api/media/upload ─────────────────────── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const ALLOWED_MIMES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif",
  "video/mp4", "video/quicktime", "video/webm", "video/x-matroska", "video/avi",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) cb(null, true);
    else cb(new ApiError(400, "File type not allowed."));
  },
  limits: { fileSize: 500 * 1024 * 1024 },
});

router.post("/upload", protect, requireRole("admin", "manager"), upload.single("file"), (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded.");
  const ext  = path.extname(req.file.filename).toLowerCase();
  res.json(new ApiResponse(200, {
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    type: typeOf(ext),
    size: req.file.size,
    sizeFormatted: fmtSize(req.file.size),
    originalName: req.file.originalname,
  }, "Uploaded."));
});

module.exports = router;
