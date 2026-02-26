import { retrieveTopChunks } from "../services/retrieval.service.js";
import { buildPrompt, generateAnswer } from "../services/llm.service.js";
import Chat from "../models/chat.model.js";

const buildChatTitle = (question) => {
  const trimmed = (question || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
};

export const askQuestion = async (req, res) => {
  try {
    const { question, chatId } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // 1️⃣ Retrieve scored results
    const userId = req.user?.userId;
    const results = await retrieveTopChunks(question, userId, 3);

    // 2️⃣ Extract actual chunk documents
    const chunks = results.map((r) => r.chunk);

    // 3️⃣ Build prompt
    const prompt = buildPrompt(chunks, question);

    // 4️⃣ Generate answer
    const answer = await generateAnswer(prompt);

    // 5️⃣ Persist chat history per user/chat
    let persistedChat = null;

    if (userId) {
      const now = new Date();
      const clientChatId = chatId || undefined;

      const baseFilter = clientChatId
        ? { user: userId, clientChatId }
        : { user: userId, clientChatId: "__default__" };

      const baseUpdate = {
        $setOnInsert: {
          user: userId,
          clientChatId: clientChatId || "__default__",
          title: buildChatTitle(question),
        },
        $set: { updatedAt: now },
        $push: {
          messages: {
            $each: [
              { role: "user", content: question, createdAt: now },
              { role: "assistant", content: answer, createdAt: now },
            ],
          },
        },
      };

      persistedChat = await Chat.findOneAndUpdate(baseFilter, baseUpdate, {
        new: true,
        upsert: true,
      });
    }

    return res.status(200).json({
      success: true,
      answer,
      sources: chunks.map((chunk) => ({
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
      })),
      chat:
        persistedChat &&
        ((chat) => ({
          id: chat.clientChatId,
          title: chat.title,
          updatedAt: chat.updatedAt,
          messages: (chat.messages || []).map((m) => ({
            id: m._id.toString(),
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
        }))(persistedChat),
    });
  } catch (error) {
    console.error("QA Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating answer",
      error: error.message,
    });
  }
};
