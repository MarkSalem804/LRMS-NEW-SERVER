const multer = require("multer");
const path = require("path");
const fs = require("fs");

// External storage configuration
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || "uploads";
const MATERIALS_DIR = path.join(UPLOAD_ROOT, "materials");
const PROFILES_DIR = path.join(UPLOAD_ROOT, "profiles");

// Ensure directories exist
const uploadDirs = [MATERIALS_DIR, PROFILES_DIR];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Whitelist of allowed extensions and MIME types for Profiles (Images only)
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".svg"];
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/svg+xml"];

// General file filter function (for profiles - Images only)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext) && ALLOWED_IMAGE_MIME_TYPES.includes(mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`
      ),
      false
    );
  }
};

// PDF-only filter for materials
const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (ext === ".pdf" && mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF files are allowed for materials."), false);
  }
};

// Storage configuration logic
const storage = (subDir) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(UPLOAD_ROOT, subDir));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext).replace(/\s+/g, "_");
      cb(null, `${basename}-${uniqueSuffix}${ext}`);
    },
  });

// Exported middlewares
const materialUpload = multer({
  storage: storage("materials"),
  fileFilter: pdfFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const profileUpload = multer({
  storage: storage("profiles"),
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = {
  materialUpload,
  profileUpload,
};
