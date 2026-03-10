export const buildChatTitle = (question) => {
  const trimmed = (question || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
};
