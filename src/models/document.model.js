import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    cloudinaryUrl: {
      type: String,
      required: true,
    },

    cloudinaryPublicId: {
      type: String,
      required: true,
    },

    size: {
      type: Number, // bytes
      required: true,
    },

    status: {
      type: String,
      enum: ["uploaded", "parsed", "chunked", "ready"],
      default: "uploaded",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Document", documentSchema);
