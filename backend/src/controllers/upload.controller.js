import Document from "../models/document.model.js";
import { parsePDFBuffer } from "../services/parsing.service.js";
import { chunkText } from "../services/chunking.service.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinary.service.js";
import DocumentChunk from "../models/documentChunk.model.js";
import { embedText } from "../services/embedding.service.js";

/**
 * Controller: Upload and Process Single PDF
 * Flow:
 * 1. Parse PDF
 * 2. Chunk text
 * 3. Upload file to Cloudinary
 * 4. Create Document entry
 * 5. Generate embeddings for each chunk (parallel)
 * 6. Store chunks with embeddings + user isolation
 */
export const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1️⃣ Parse PDF
    const text = await parsePDFBuffer(req.file.buffer);

    // 2️⃣ Chunk parsed text
    const chunks = await chunkText(text);

    // 3️⃣ Upload original PDF to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
      folder: "pdf-documents",
      public_id: `${Date.now()}-${req.file.originalname.replace(".pdf", "")}`,
    });

    // 4️⃣ Create Document entry
    const document = await Document.create({
      user: userId,
      originalName: req.file.originalname,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      size: cloudinaryResult.bytes,
      status: "embedding", // now entering embedding phase
    });

    // 5️⃣ Generate embeddings in parallel
    const embeddingPromises = chunks.map((chunk) => embedText(chunk));
    const embeddings = await Promise.all(embeddingPromises);

    // 6️⃣ Prepare chunk documents with embeddings
    const chunkDocs = chunks.map((chunk, index) => ({
      user: userId,
      documentId: document._id,
      chunkIndex: index,
      content: chunk,
      embedding: embeddings[index],
    }));

    // 7️⃣ Insert all chunks into DB
    await DocumentChunk.insertMany(chunkDocs);

    // 8️⃣ Mark document ready
    document.status = "ready";
    await document.save();

    return res.status(201).json({
      success: true,
      message: "PDF uploaded, embedded and stored successfully",
      data: {
        documentId: document._id,
        textLength: text.length,
        chunkCount: chunks.length,
        status: document.status,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Error uploading and processing PDF",
      error: error.message,
    });
  }
};

/**
 * Controller: Upload Multiple PDFs (Upload Only - No Embedding)
 * This is optional and currently does NOT embed.
 */
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
        public_id: `${Date.now()}-${file.originalname.replace(".pdf", "")}`,
      });

      return {
        originalName: file.originalname,
        url: result.secure_url,
        public_id: result.public_id,
        size: result.bytes,
      };
    });

    const results = await Promise.all(uploadPromises);

    return res.status(200).json({
      success: true,
      message: "PDFs uploaded successfully",
      data: results,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Error uploading PDFs",
      error: error.message,
    });
  }
};

/**
 * Controller: Delete PDF from Cloudinary
 */
export const deletePDF = async (req, res) => {
  try {
    const { public_id } = req.params;

    const result = await deleteFromCloudinary(public_id);

    return res.status(200).json({
      success: result.result === "ok",
      message:
        result.result === "ok"
          ? "PDF deleted successfully"
          : "Failed to delete PDF",
      data: result,
    });
  } catch (error) {
    console.error("Delete error:", error);

    return res.status(500).json({
      success: false,
      message: "Error deleting PDF",
      error: error.message,
    });
  }
};
