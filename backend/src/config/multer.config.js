import multer from "multer";

// Configure storage - using memory storage for Cloudinary upload
const storage = multer.memoryStorage();

// File filter to allow only PDF files
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export default upload;
