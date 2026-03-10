import apiClient from "./apiClient";

export async function uploadPdf(file, chatId = null) {
  const formData = new FormData();
  formData.append("file", file);
  // include chatId so backend can link document to a chat
  if (chatId) {
    formData.append("chatId", chatId);
  }

  const response = await apiClient.post("/api/upload/pdf", formData, {
    headers: {
      "Content-Type": "multipart/m-data",
    },
  });

  return response.data;
}

export async function askQuestion(question, chatId, scope = "all") {
  const payload = { question, scope };
  if (chatId) payload.chatId = chatId;
  const response = await apiClient.post("/api/ask", payload);
  return response.data;
}

export async function fetchChats() {
  const response = await apiClient.get("/api/chats");
  return response.data;
}
