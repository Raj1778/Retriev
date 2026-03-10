import {
  getFilterDocIds,
  getChatHistory,
  persistChat,
  formatChat,
} from "../services/chat.service.js";
import { runQAPipeline } from "../services/qa.service.js";

const NO_DOCS_MESSAGES = {
  chat: "No documents uploaded in this chat. Upload a PDF first, then ask your question.",
  last20: "You have no processed documents yet. Upload a PDF to get started.",
  all: "No documents found. Please upload a PDF first.",
};

export const askQuestion = async (req, res) => {
  try {
    const { question, chatId, scope = "all" } = req.body;
    const userId = req.user?.userId;

    if (!question) {
      return res
        .status(400)
        .json({ success: false, message: "Question is required" });
    }

    // 1. Resolve document filter
    const filterDocIds = await getFilterDocIds(scope, chatId, userId);
    if (filterDocIds === "NO_DOCS") {
      return res.status(200).json({
        success: true,
        answer: NO_DOCS_MESSAGES[scope] ?? NO_DOCS_MESSAGES.all,
        sources: [],
        chat: null,
      });
    }

    // 2. Get chat history
    const chatHistory = await getChatHistory(chatId, userId);

    // 3. Run RAG pipeline
    const { answer, sources } = await runQAPipeline({
      question,
      userId,
      filterDocIds,
      chatHistory,
    });

    if (!answer) {
      return res.status(200).json({
        success: true,
        answer: "I couldn't find relevant information to answer that question.",
        sources: [],
        chat: null,
      });
    }

    // 4. Persist & respond
    const persistedChat = userId
      ? await persistChat({ userId, chatId, question, answer })
      : null;

    return res.status(200).json({
      success: true,
      answer,
      sources,
      chat: persistedChat ? formatChat(persistedChat) : null,
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
