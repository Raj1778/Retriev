import { retrieveTopChunks } from "./retrieval.service.js";
import { ask } from "./llm.service.js";

export const runQAPipeline = async ({
  question,
  userId,
  filterDocIds,
  chatHistory,
}) => {
  const results = await retrieveTopChunks(question, userId, 3, filterDocIds);
  const chunks = results.map((r) => r.chunk);

  if (chunks.length === 0) return { answer: null, chunks: [] };

  const { answer } = await ask(chunks, question, chatHistory);

  const sources = chunks.map((chunk) => ({
    documentId: chunk.documentId,
    chunkIndex: chunk.chunkIndex,
    documentName: chunk.metadata?.documentName,
    length: chunk.metadata?.length,
  }));

  return { answer, chunks, sources };
};
