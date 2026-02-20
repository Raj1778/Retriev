import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientChatId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "New chat",
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  },
);

chatSchema.index({ user: 1, clientChatId: 1 }, { unique: true });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;

