import axios from "axios";

export const embedText = async (text) => {
  if (!text) {
    throw new Error("embedText: text is required");
  }

  const response = await axios.post("http://localhost:8001/embed", null, {
    params: { text },
  });

  return response.data.embedding;
};
