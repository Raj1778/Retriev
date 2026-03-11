import { processAndStoreDocument } from "../services/document.service.js";
import { linkDocumentToChat } from "../services/chat.service.js";

export const uploadPDF = async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });

  const userId = req.user?.userId;
  if (!userId)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { chatId } = req.body;

  const { document, text, chunks } = await processAndStoreDocument(
    req.file,
    userId,
  );

  if (chatId) {
    await linkDocumentToChat(
      userId,
      chatId,
      document._id,
      req.file.originalname,
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
};
