import Chat from "../models/chat.model.js";
import Document from "../models/document.model.js";
import { buildChatTitle } from "../utils/chat.utils.js";

export const getFilterDocIds = async (scope, chatId, userId) => {
  // Scope: "chat" → only docs linked to this chat
  if (scope === "chat") {
    if (!chatId) return "NO_DOCS";
    const chat = await Chat.findOne({
      user: userId,
      clientChatId: chatId,
    }).lean();
    if (!chat?.documentIds?.length) return "NO_DOCS";
    return chat.documentIds; // ✅ actual ObjectIds
  }

  // Scope: "last20" → last 20 docs uploaded by this user
  if (scope === "last20") {
    const docs = await Document.find({ user: userId, status: "ready" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("_id")
      .lean();
    if (!docs.length) return "NO_DOCS";
    return docs.map((d) => d._id);
  }

  // Scope: "all" → no filter, search everything
  return null;
};

export const getChatHistory = async (chatId, userId) => {
  if (!chatId) return [];
  const chat = await Chat.findOne({
    user: userId,
    clientChatId: chatId,
  }).lean();
  return chat?.messages || [];
};

export const persistChat = async ({ userId, chatId, question, answer }) => {
  const now = new Date();
  const clientChatId = chatId || "__default__";

  return Chat.findOneAndUpdate(
    { user: userId, clientChatId },
    {
      $setOnInsert: {
        user: userId,
        clientChatId,
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
    },
    { new: true, upsert: true },
  );
};

export const formatChat = (chat) => ({
  id: chat.clientChatId,
  title: chat.title,
  updatedAt: chat.updatedAt,
  messages: (chat.messages || []).map((m) => ({
    id: m._id.toString(),
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  })),
});
