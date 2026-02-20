import Chat from "../models/chat.model.js";

const mapChatToDto = (chat) => ({
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

export const getUserChats = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const chats = await Chat.find({ user: userId })
      .sort({ updatedAt: -1 })
      .lean(false);

    return res.status(200).json({
      success: true,
      chats: chats.map(mapChatToDto),
    });
  } catch (error) {
    console.error("Error fetching user chats:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching chats",
      error: error.message,
    });
  }
};

