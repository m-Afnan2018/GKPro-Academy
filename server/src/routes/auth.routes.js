const express  = require("express");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const router   = express.Router();
const { register, login, getMe, updateMe, updateAvatar } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");
const ApiError    = require("../utils/ApiError");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename:    (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new ApiError(400, "Only image files are allowed."));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);

// PATCH /api/auth/me/avatar  — multipart/form-data, field: "avatar"
router.patch("/me/avatar", protect, avatarUpload.single("avatar"), updateAvatar);

module.exports = router;
