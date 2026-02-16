import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

import { retrieveTopChunks } from "./services/retrieval.service.js";
import { buildPrompt, generateAnswer } from "./services/llm.service.js";

await mongoose.connect(process.env.MONGO_URI);

const run = async () => {
  const question = "How does the food discovery app help students?";

  const results = await retrieveTopChunks(question, 3);

  const chunks = results.map((r) => r.chunk);

  const prompt = buildPrompt(chunks, question);

  const answer = await generateAnswer(prompt);

  console.log("\nGenerated Answer:\n");
  console.log(answer);

  process.exit(0);
};

run();
