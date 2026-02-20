import apiClient from "./apiClient";

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post("/upload/pdf", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function askQuestion(question, chatId) {
  const payload = chatId ? { question, chatId } : { question };
  const response = await apiClient.post("/ask", payload);
  return response.data;
}

export async function fetchChats() {
  const response = await apiClient.get("/chats");
  return response.data;
}