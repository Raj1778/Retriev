import OpenAI from "openai";

export const buildPrompt = (chunks, question) => {
  const context = chunks.map((c) => c.content).join("\n\n");

  // if context is empty we want to short-circuit before calling the LLM
  if (!context.trim()) {
    return null;
  }

  return `You are a factual assistant. You MUST answer using ONLY the context below.

CRITICAL RULES:
1. ONLY use information explicitly stated in the Context section
2. Do NOT infer, assume, or add external knowledge
3. If information is missing, respond: "I don't have information about this in the provided documents"
4. Quote directly when possible

Context:
${context}

Question:
${question}

You must cite which part of the context your answer comes from.
Answer:`;
};

export const generateAnswer = async (prompt) => {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2, 
  });

  return completion.choices[0].message.content;
};
