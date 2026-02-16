import { retrieveTopChunks } from "../services/retrieval.service.js";
import { buildPrompt, generateAnswer } from "../services/llm.service.js";

export const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // 1️⃣ Retrieve scored results
    const results = await retrieveTopChunks(question, 3);

    // 2️⃣ Extract actual chunk documents
    const chunks = results.map((r) => r.chunk);

    // 3️⃣ Build prompt
    const prompt = buildPrompt(chunks, question);

    // 4️⃣ Generate answer
    const answer = await generateAnswer(prompt);

    return res.status(200).json({
      success: true,
      answer,
      sources: chunks.map((chunk) => ({
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
      })),
    });
  } catch (error) {
    console.error("QA Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating answer",
      error: error.message,
    });
  }
};
