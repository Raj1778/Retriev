import OpenAI from "openai";

export const buildPrompt = (chunks, question) => {
  const context = chunks.map((c) => c.content).join("\n\n");

  return `
You are a helpful assistant.

Answer the question using ONLY the context provided below.
If the answer is not contained in the context, say:
"I don't know based on the provided documents."

Context:
${context}

Question:
${question}

Answer:
`;
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
