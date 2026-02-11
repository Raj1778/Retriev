import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    // Order of chunk within the document
    chunkIndex: {
      type: Number,
      required: true,
    },

    // Actual chunk text - for RAG to retrieve
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], // vector
      index: false, // we’ll handle similarity in code for now
    },

    // e.g. page number, section, etc.
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Helpful compound index
documentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

export default mongoose.model("DocumentChunk", documentChunkSchema);
