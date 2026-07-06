const multer = require("multer");
const path = require("path");
const fs = require("fs");

// External storage configuration
const MATERIALS_DIR = process.env.UPLOAD_ROOT || path.join("uploads", "materials");
const PROFILES_DIR = process.env.PROFILE_ROOT || path.join("uploads", "profiles");

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

// PDF-only filter for material files (the actual content)
const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (ext === ".pdf" && mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF files are allowed for materials."), false);
  }
};

// Excel-only filter for metadata uploads (.xlsx / .xls)
const excelFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const ALLOWED_EXCEL_MIMES = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream", // some browsers send this for .xls
  ];

  if ((".xlsx" === ext || ".xls" === ext) && ALLOWED_EXCEL_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else if (".xlsx" === ext || ".xls" === ext) {
    // Accept by extension even if MIME is unexpected (browser inconsistency)
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only Excel files (.xlsx, .xls) are allowed for metadata upload."),
      false
    );
  }
};

// Storage configuration logic
const storage = (targetDir) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, targetDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext).replace(/\s+/g, "_");
      cb(null, `${basename}-${uniqueSuffix}${ext}`);
    },
  });

// Exported middlewares

// For actual material PDF files
const materialUpload = multer({
  storage: storage(MATERIALS_DIR),
  fileFilter: pdfFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// For metadata Excel files — parsed in memory, never saved to disk
const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: excelFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const profileUpload = multer({
  storage: storage(PROFILES_DIR),
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = {
  materialUpload,
  excelUpload,
  profileUpload,
};
