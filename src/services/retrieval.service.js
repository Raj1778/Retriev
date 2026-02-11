import DocumentChunk from "../models/documentChunk.model.js";
import { embedText } from "./embedding.service.js";

const cosineSimilarity = (vecA, vecB) => {
  let dot = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }

  return dot; // embeddings are normalized
};

export const retrieveTopChunks = async (question, k = 3) => {
  if (!question) {
    throw new Error("Question is required");
  }

  
  const questionEmbedding = await embedText(question);

  
  const chunks = await DocumentChunk.find({
    embedding: { $exists: true },
  });

  
  const scoredChunks = chunks.map((chunk) => {
    const score = cosineSimilarity(questionEmbedding, chunk.embedding);

    return { chunk, score };
  });

  
  scoredChunks.sort((a, b) => b.score - a.score);

  
  return scoredChunks.slice(0, k);
};
