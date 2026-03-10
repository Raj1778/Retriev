import OpenAI from "openai";


export const buildPrompt = (chunks, question, chatHistory = []) => {
  const context = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}${c.metadata?.title ? ` — ${c.metadata.title}` : ""}]\n${c.content}`,
    )
    .join("\n\n---\n\n");

  if (!context.trim()) return null;

  const historyBlock =
    chatHistory.length > 0
      ? `\nPrevious conversation:\n${chatHistory
          .map(
            (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
          )
          .join("\n")}\n`
      : "";

  return `You are an expert research assistant with deep analytical capabilities. Your job is to reason carefully over provided documents and give precise, well-structured answers.

${historyBlock}
## Documents
${context}

## Instructions
- Answer ONLY from the documents above or the current chat history.
- If the documents are insufficient, say: "The provided documents don't contain enough information to answer this fully." Then share what partial info you do have.
- Structure complex answers with headers, bullet points, or numbered steps where helpful.
- Always cite the source (e.g. [Source 2]) inline, directly after the claim.
- If multiple sources agree or conflict, say so explicitly.
- Think step by step before answering. Show your reasoning when the question is analytical or ambiguous.
- Never hallucinate facts, names, dates, or figures not present in the documents.
- If the question is a follow-up, factor in the conversation history above.

## Question
${question}

## Answer`;
};

// ─── LLM Call ─────────────────────────────────────────────────────────────────

export const generateAnswer = async (prompt, options = {}) => {
  const {
    model = "llama-3.3-70b-versatile", // Best available Groq model as of 2025
    temperature = 0.2, // Lower = more precise, factual
    maxTokens = 1024,
    stream = false,
  } = options;

  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const messages = [
    {
      role: "system",
      content:
        "You are a precise, analytical AI assistant. You reason carefully, cite sources, and never fabricate information. When uncertain, you say so.",
    },
    { role: "user", content: prompt },
  ];

  if (stream) {
    // Return a stream for real-time token output
    return client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });
  }

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    // Penalize repetition for cleaner prose
    frequency_penalty: 0.3,
    presence_penalty: 0.1,
  });

  const content = completion.choices[0].message.content;
  const usage = completion.usage; // { prompt_tokens, completion_tokens, total_tokens }

  return { content, usage };
};

// ─── Main entry (convenience wrapper) ────────────────────────────────────────

/**
 * Full pipeline: build prompt → call LLM → return answer + metadata
 *
 * @param {Array}  chunks       - Retrieved document chunks [{ content, metadata? }]
 * @param {string} question     - User's question
 * @param {Array}  chatHistory  - Optional prior turns [{ role, content }]
 * @param {Object} llmOptions   - Optional overrides for model/temp/maxTokens
 * @returns {{ answer: string, usage: object } | null}
 */
export const ask = async (
  chunks,
  question,
  chatHistory = [],
  llmOptions = {},
) => {
  const prompt = buildPrompt(chunks, question, chatHistory);

  if (!prompt) {
    return {
      answer: "I don't have any relevant documents to answer your question.",
      usage: null,
    };
  }

  const { content, usage } = await generateAnswer(prompt, llmOptions);

  return { answer: content, usage };
};
