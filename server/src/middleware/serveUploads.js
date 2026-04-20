const path = require("path");
const fs   = require("fs");
const jwt  = require("jsonwebtoken");

const IMAGE_EXTS    = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"]);
const MATERIAL_EXTS = new Set([".mp4", ".mov", ".webm", ".mkv", ".avi", ".pdf", ".doc", ".docx", ".xls", ".xlsx"]);

/**
 * Smart file-serving middleware for /uploads.
 * - Sets Cross-Origin-Resource-Policy: cross-origin (fixes Helmet CORP block
 *   that prevents the Next.js client on port 3000 from loading files from port 5000).
 * - Image files are served publicly (needed on the public-facing website).
 * - Material files require a valid JWT in the Authorization header.
 */
function serveUploads(uploadsDir) {
  return async (req, res, next) => {
    const filename = path.basename(req.path);
    const filePath = path.join(uploadsDir, filename);
    const ext      = path.extname(filename).toLowerCase();

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    if (IMAGE_EXTS.has(ext)) {
      return res.sendFile(filePath);
    }

    if (MATERIAL_EXTS.has(ext)) {
      // Accept token from Authorization header OR ?token= query param
      // (browsers can't send headers when navigating directly or embedding iframes)
      const authHeader = req.headers.authorization;
      const rawToken = (authHeader && authHeader.startsWith("Bearer "))
        ? authHeader.split(" ")[1]
        : (req.query.token || null);

      if (!rawToken) {
        return res.status(401).json({ success: false, message: "Authentication required to access this file." });
      }
      try {
        jwt.verify(rawToken, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
      }
      return res.sendFile(filePath);
    }

    return res.status(403).json({ success: false, message: "Access denied." });
  };
}

module.exports = { serveUploads };
