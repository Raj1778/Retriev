import DocumentChunk from "../models/documentChunk.model.js";
import { embedText } from "./embedding.service.js";

const cosineSimilarity = (vecA, vecB) => {
  let dot = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }

  return dot; // embeddings are normalized
};

export const retrieveTopChunks = async (
  question,
  userId,
  k = 20,
  documentIds = null, // optional list of document objectIds to restrict search
) => {
  if (!question) {
    throw new Error("Question is required");
  }

  const questionEmbedding = await embedText(question);

  // build base query scoped to the user
  const query = {
    user: userId,
    embedding: { $exists: true },
  };

  if (Array.isArray(documentIds) && documentIds.length > 0) {
    query.documentId = { $in: documentIds };
  }

  const chunks = await DocumentChunk.find(query);

  const scoredChunks = chunks.map((chunk) => {
    const score = cosineSimilarity(questionEmbedding, chunk.embedding);

    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, k);
};
