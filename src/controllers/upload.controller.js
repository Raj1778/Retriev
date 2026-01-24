import { cloudinary } from "../config/cloudinary.config.js";
import streamifier from "streamifier";

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // Use 'raw' for PDF files
        format: "pdf",
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Controller for handling PDF upload
export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Upload PDF to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "pdf-documents", // Optional: organize files in folders
      public_id: req.file.originalname.replace(".pdf", ""), // Optional: custom public_id
    });

    // Response with Cloudinary URL and details
    res.status(200).json({
      success: true,
      message: "PDF uploaded successfully",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        size: result.bytes,
        created_at: result.created_at,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading PDF",
      error: error.message,
    });
  }
};

// Optional: Controller for multiple PDF uploads
export const uploadMultiplePDFs = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, {
        folder: "pdf-documents",
        public_id: file.originalname.replace(".pdf", ""),
      });

      return {
        originalName: file.originalname,
        url: result.secure_url,
        public_id: result.public_id,
        size: result.bytes,
      };
    });

    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: "PDFs uploaded successfully",
      data: results,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading PDFs",
      error: error.message,
    });
  }
};

// Optional: Delete PDF from Cloudinary
export const deletePDF = async (req, res) => {
  try {
    const { public_id } = req.params;

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "raw",
    });

    res.status(200).json({
      success: result.result === "ok",
      message:
        result.result === "ok"
          ? "PDF deleted successfully"
          : "Failed to delete PDF",
      data: result,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting PDF",
      error: error.message,
    });
  }
};
