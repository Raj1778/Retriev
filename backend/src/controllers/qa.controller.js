import { retrieveTopChunks } from "../services/retrieval.service.js";
import { ask } from "../services/llm.service.js";
import Chat from "../models/chat.model.js";

const buildChatTitle = (question) => {
  const trimmed = (question || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
};

export const askQuestion = async (req, res) => {
  try {
    const { question, chatId, scope = "all", documentIds } = req.body; // scope: "all", "current", "selected"

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // 1️⃣ Determine filter document IDs based on scope
    const userId = req.user?.userId;
    let filterDocIds = null;

    if (scope === "current" && chatId) {
      // For current, use the chat's associated documentIds
      const existing = await Chat.findOne({
        user: userId,
        clientChatId: chatId,
      }).lean();
      if (
        existing &&
        Array.isArray(existing.documentIds) &&
        existing.documentIds.length > 0
      ) {
        filterDocIds = existing.documentIds;
      } else {
        // No documents in this chat
        return res.status(200).json({
          success: true,
          answer:
            "No documents uploaded in this chat. Please upload a document first to ask questions about it.",
          sources: [],
          chat: null,
        });
      }
    }
    // For "all" or invalid scope, filterDocIds remains null

    const results = await retrieveTopChunks(question, userId, 3, filterDocIds);

    // 2️⃣ Extract actual chunk documents
    const chunks = results.map((r) => r.chunk);

    // If we didn't retrieve any chunks, there's no context to answer from
    if (chunks.length === 0) {
      const noContextAnswer =
        "I don't have any documents or relevant information to answer that question. Please upload or index some documents first.";
      return res.status(200).json({
        success: true,
        answer: noContextAnswer,
        sources: [],
        chat: null,
      });
    }

    // 3️⃣ Get chat history for context
    let chatHistory = [];
    if (chatId) {
      const existingChat = await Chat.findOne({
        user: userId,
        clientChatId: chatId,
      }).lean();
      if (existingChat && existingChat.messages) {
        chatHistory = existingChat.messages;
      }
    }

    // 4️⃣ Generate answer with context
    const { answer, usage } = await ask(chunks, question, chatHistory);

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
        documentName: chunk.metadata?.documentName,
        length: chunk.metadata?.length,
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
