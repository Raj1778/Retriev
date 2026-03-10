import Document from "../models/document.model.js";
import Chat from "../models/chat.model.js";
import { parsePDFBuffer } from "../services/parsing.service.js";
import { chunkText } from "../services/chunking.service.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinary.service.js";
import DocumentChunk from "../models/documentChunk.model.js";
import { embedText } from "../services/embedding.service.js";

export const uploadPDF = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const userId = req.user?.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { chatId } = req.body; // ← grab chatId from frontend

    const text = await parsePDFBuffer(req.file.buffer);
    const chunks = await chunkText(text);

    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
      folder: "pdf-documents",
      public_id: `${Date.now()}-${req.file.originalname.replace(".pdf", "")}`,
    });

    const document = await Document.create({
      user: userId,
      originalName: req.file.originalname,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      size: cloudinaryResult.bytes,
      status: "embedding",
    });

    const embeddings = await Promise.all(
      chunks.map((chunk) => embedText(chunk)),
    );

    const chunkDocs = chunks.map((chunk, index) => ({
      user: userId,
      documentId: document._id,
      chunkIndex: index,
      content: chunk,
      embedding: embeddings[index],
      metadata: {
        documentName: req.file.originalname,
        chunkIndex: index,
        uploadedAt: new Date(),
      },
    }));

    await DocumentChunk.insertMany(chunkDocs);

    document.status = "ready";
    await document.save();

    // ✅ Link document to chat if chatId was provided
    if (chatId) {
      await Chat.findOneAndUpdate(
        { user: userId, clientChatId: chatId },
        {
          $addToSet: { documentIds: document._id }, // addToSet avoids duplicates
          $setOnInsert: {
            user: userId,
            clientChatId: chatId,
            title: req.file.originalname,
          },
        },
        { upsert: true },
      );
    }

    return res.status(201).json({
      success: true,
      message: "PDF uploaded and processed successfully",
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
      message: "Error uploading PDF",
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
