import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const upload = multer({
  dest: UPLOADS_DIR,
  fileFilter: (_, file, cb) => {
    if (file.mimetype === "application/zip" || file.originalname.endsWith(".zip")) {
      cb(null, true);
    } else {
      cb(new Error("Only zip files are allowed"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});
