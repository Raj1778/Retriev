import axios from "axios";

export const embedText = async (text) => {
  if (!text) {
    throw new Error("embedText: text is required");
  }

  if (!process.env.EMBEDDING_URL) {
    throw new Error("EMBEDDING_URL is not defined");
  }

  try {
    const response = await axios.post(
      `${process.env.EMBEDDING_URL}/embed`,
      null,
      {
        params: { text },
        timeout: 60000, // important for cold start
      },
    );

    return response.data.embedding;
  } catch (error) {
    console.error("Embedding service error:", error.message);

    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Embedding service timeout (cold start or slow response)",
      );
    }

    throw new Error("Failed to generate embedding");
  }
};
