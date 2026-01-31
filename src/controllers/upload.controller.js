import Document from "../models/document.model.js";
import { parsePDFBuffer } from "../services/parsing.service.js";
import { chunkText } from "../services/chunking.service.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinary.service.js";
import DocumentChunk from "../models/documentChunk.model.js";

// Controller for handling PDF upload
export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    //pdf parsing
    const text = await parsePDFBuffer(req.file.buffer);

    //chunking of parsed text
    const chunks = await chunkText(text);

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "pdf-documents",
      public_id: `${Date.now()}-${req.file.originalname.replace(".pdf", "")}`,
    });

    const document = await Document.create({
      user: req.user.userId,
      originalName: req.file.originalname,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      size: result.bytes,
      status: "parsed",
    });

    const chunkDocs = chunks.map((chunk, index) => ({
      documentId: document._id,
      chunkIndex: index,
      content: chunk,
    }));

    await DocumentChunk.insertMany(chunkDocs);
    document.status = "chunked";
    await document.save();

    res.status(201).json({
      success: true,
      message: "PDF uploaded, parsed and chunked successfully",
      data: {
        documentId: document._id,
        textLength: text.length,
        chunkCount: chunks.length,
        status: document.status,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading and parsing PDF",
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

    const result = await deleteFromCloudinary(public_id);

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
