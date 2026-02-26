import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    embedding: {
      type: [Number],
      index: false,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);
const documentChunk = mongoose.model("documentChunk", documentChunkSchema);
export default documentChunk;
