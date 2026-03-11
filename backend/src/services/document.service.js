import { parsePDFBuffer } from "./parsing.service.js";
import { chunkText } from "./chunking.service.js";
import { embedText } from "./embedding.service.js";
import { uploadToCloudinary } from "./cloudinary.service.js";
import Document from "../models/document.model.js";
import DocumentChunk from "../models/documentChunk.model.js";

export const processAndStoreDocument = async (file, userId) => {
  const text = await parsePDFBuffer(file.buffer);
  const chunks = await chunkText(text);

  const cloudinaryResult = await uploadToCloudinary(file.buffer, {
    folder: "pdf-documents",
    public_id: `${Date.now()}-${file.originalname.replace(".pdf", "")}`,
  });

  const document = await Document.create({
    user: userId,
    originalName: file.originalname,
    cloudinaryUrl: cloudinaryResult.secure_url,
    cloudinaryPublicId: cloudinaryResult.public_id,
    size: cloudinaryResult.bytes,
    status: "embedding",
  });

  const embeddings = await Promise.all(chunks.map((chunk) => embedText(chunk)));

  await DocumentChunk.insertMany(
    chunks.map((chunk, index) => ({
      user: userId,
      documentId: document._id,
      chunkIndex: index,
      content: chunk,
      embedding: embeddings[index],
      metadata: {
        documentName: file.originalname,
        chunkIndex: index,
        uploadedAt: new Date(),
      },
    })),
  );

  document.status = "ready";
  await document.save();

  return { document, text, chunks };
};
