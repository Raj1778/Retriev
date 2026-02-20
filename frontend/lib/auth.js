import apiClient from "./apiClient";

export async function login({ email, password }) {
  const response = await apiClient.post("/user/login", { email, password });
  return response.data;
}

export async function register({ email, password }) {
  const response = await apiClient.post("/user/register", { email, password });
  return response.data;
}

