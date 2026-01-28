import { parseDocumentById } from "../services/document.service.js";

export const parseDocumentController = async (req, res) => {
  console.log("🔥 PARSE CONTROLLER HIT", req.params);
  try {
    const { id } = req.params;

    const { text, document } = await parseDocumentById(id);
    console.log("Parsing document:", document.originalName, document.size);

    // update status
    document.status = "parsed";
    await document.save();

    res.status(200).json({
      success: true,
      message: "Document parsed successfully",
      textPreview: text.slice(0, 500),
      textLength: text.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to parse document",
      error: error.message,
    });
  }
};
