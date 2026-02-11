import mongoose from "mongoose";
import dotenv from "dotenv";
import { retrieveTopChunks } from "./services/retrieval.service.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const run = async () => {
  const question = "How does the food discovery app help students?";

  const results = await retrieveTopChunks(question, 3);

  console.log("\nTop Semantic Results:\n");

  results.forEach((item, index) => {
    console.log(`Rank ${index + 1} | Score: ${item.score.toFixed(4)}\n`);
    console.log(item.chunk.content);
    console.log("\n----------------------\n");
  });

  process.exit(0);
};

run();
