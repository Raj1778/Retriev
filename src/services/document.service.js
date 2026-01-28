import axios from "axios";
import https from "https";
import { cloudinary } from "../config/cloudinary.config.js";
import { createRequire } from "module";
import Document from "../models/document.model.js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // ⚠️ DEV ONLY
});

export const parseDocumentById = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) throw new Error("Document not found");

  const signedUrl = cloudinary.utils.private_download_url(
    document.cloudinaryPublicId,
    "pdf",
    {
      resource_type: "raw",
      expires_at: Math.floor(Date.now() / 1000) + 60,
    },
  );

  const response = await axios.get(signedUrl, {
    responseType: "arraybuffer",
    httpsAgent,
  });

  const pdfBuffer = Buffer.from(response.data);
  console.log("📦 PDF buffer length:", pdfBuffer.length);

  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  await parser.destroy();

  const cleanText = result.text
    .replace(/\n+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  return { document, text: cleanText };
};
