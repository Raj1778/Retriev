import mongoose from "mongoose";
import dotenv from "dotenv";
import DocumentChunk from "../src/models/documentChunk.model.js";
import { embedText } from "../src/services/embedding.service.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const embedAllChunks = async () => {
  const chunks = await DocumentChunk.find({
    embedding: { $exists: false },
  });

  console.log(`Found ${chunks.length} chunks to embed...`);

  for (const chunk of chunks) {
    console.log(`Embedding chunk ${chunk._id}`);

    const embedding = await embedText(chunk.content);

    chunk.embedding = embedding;
    await chunk.save();
  }

  console.log("✅ All chunks embedded.");
  process.exit(0);
};

embedAllChunks();
