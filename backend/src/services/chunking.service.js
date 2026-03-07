import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 80,
  separators: ["\n\n", "\n", ".", " ", ""],
});
export const chunkText = async (text) => {
  if (!text) {
    throw new Error("Text is required for chunking");
  }

  return splitter.splitText(text);
};
