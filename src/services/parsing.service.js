import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

export const parsePDFBuffer = async (buffer) => {
  if (!buffer) {
    throw new Error("PDF buffer is required for parsing");
  }

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const cleanText = result.text
    .replace(/\n+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) {
    throw new Error("Failed to extract text from PDF");
  }

  return cleanText;
};
