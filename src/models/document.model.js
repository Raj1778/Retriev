import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalName: String,
    fileUrl: String,
    cloudinaryId: String,
  },
  { timestamps: true },
);

export default mongoose.model("Document", documentSchema);
