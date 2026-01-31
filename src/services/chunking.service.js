import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export const chunkText = async (text) => {
  if (!text) {
    throw new Error("Text is required for chunking");
  }

  return splitter.splitText(text);
};
