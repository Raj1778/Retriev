"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Paperclip,
  Plus,
  Send,
  Settings,
  User,
  PanelLeft,
  Bot,
  LogOut,
} from "lucide-react";
import { askQuestion, uploadPdf, fetchChats } from "@/lib/rag";
import { useRouter } from "next/navigation";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function buildChatTitle(text) {
  const trimmed = (text || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 36 ? `${trimmed.slice(0, 36)}…` : trimmed;
}

function AvatarChip({ icon: Icon, label, sublabel }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 backdrop-blur-sm">
      <div className="grid size-9 place-items-center rounded-xl border border-zinc-700 bg-zinc-950">
        <Icon className="size-4 text-zinc-100" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-zinc-50">{label}</div>
        {sublabel ? (
          <div className="truncate text-xs text-zinc-400">{sublabel}</div>
        ) : null}
      </div>
    </div>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "group relative max-w-[46rem] rounded-3xl border border-zinc-800 px-4 py-3 shadow-sm backdrop-blur-sm",
          isUser ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-zinc-100",
        )}
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
          {isUser ? (
            <>
              <User className="size-3.5" />
              <span>You</span>
            </>
          ) : (
            <>
              <Bot className="size-3.5" />
              <span>AI</span>
            </>
          )}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}

export default function ChatApp() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [draft, setDraft] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) || null,
    [chats, activeChatId],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadChats() {
      try {
        const data = await fetchChats();
        if (!isMounted) return;

        if (data?.success && Array.isArray(data.chats) && data.chats.length) {
          setChats(
            data.chats.map((chat) => ({
              id: chat.id,
              title: chat.title || "New chat",
              updatedAt: chat.updatedAt,
              messages: chat.messages || [],
            })),
          );
          setActiveChatId(data.chats[0].id);
        } else {
          const id = newId();
          const initial = [
            { id, title: "New chat", updatedAt: Date.now(), messages: [] },
          ];
          setChats(initial);
          setActiveChatId(id);
        }
      } catch (error) {
        console.error("Failed to load chats", error);
        const id = newId();
        setChats([
          { id, title: "New chat", updatedAt: Date.now(), messages: [] },
        ]);
        setActiveChatId(id);
      } finally {
        if (isMounted) setIsLoadingChats(false);
      }
    }

    loadChats();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("authToken");
    if (!token) return;
    try {
      const [, payload] = token.split(".");
      const decoded = JSON.parse(atob(payload));
      if (decoded?.email) setUserEmail(decoded.email);
    } catch {}
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeChat?.messages?.length]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 180);
    el.style.height = `${next}px`;
  }, [draft]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showSettingsMenu &&
        !event.target.closest(".settings-menu-container")
      ) {
        setShowSettingsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettingsMenu]);

  function createNewChat() {
    const id = newId();
    const chat = { id, title: "New chat", updatedAt: Date.now(), messages: [] };
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(id);
    setDraft("");
    setUploadedFileName(null);
    setUploadedFile(null);
  }

  function updateChat(id, updater) {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  async function handleSend() {
    const text = draft.trim();
    if (!activeChatId) return;
    if (!text && !uploadedFile) return;
    if (isProcessing) return;

    const hasFile = Boolean(uploadedFile);

    const userMessage = {
      id: newId(),
      role: "user",
      content: text || (hasFile ? `Uploaded: ${uploadedFileName}` : ""),
      createdAt: Date.now(),
    };

    const assistantMessageId = newId();
    const assistantPlaceholder = {
      id: assistantMessageId,
      role: "assistant",
      content: hasFile
        ? `Uploading and processing ${uploadedFileName}…`
        : "Thinking…",
      createdAt: Date.now(),
    };

    updateChat(activeChatId, (chat) => {
      const nextMessages = [
        ...chat.messages,
        userMessage,
        assistantPlaceholder,
      ];
      const nextTitle =
        chat.messages.find((m) => m.role === "user")?.content ||
        buildChatTitle(text);
      return {
        ...chat,
        title: chat.title === "New chat" ? nextTitle : chat.title,
        updatedAt: Date.now(),
        messages: nextMessages,
      };
    });

    setDraft("");
    let fileName = uploadedFileName;
    setUploadedFileName(null);

    try {
      let uploadData = null;
      let qaData = null;

      if (hasFile && uploadedFile) {
        setIsProcessing(true);
        uploadData = await uploadPdf(uploadedFile);
        fileName = uploadedFile.name;
        setUploadedFile(null);

        updateChat(activeChatId, (chat) => ({
          ...chat,
          updatedAt: Date.now(),
          messages: chat.messages.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: `✅ Processed ${fileName}. Generating answer…`,
                }
              : m,
          ),
        }));
      }

      if (text) {
        qaData = await askQuestion(text, activeChatId);
      }

      let finalText = "";
      if (qaData) {
        finalText =
          typeof qaData === "string"
            ? qaData
            : qaData.answer ||
              qaData.message ||
              JSON.stringify(qaData, null, 2);
      } else if (uploadData) {
        finalText =
          typeof uploadData === "string"
            ? uploadData
            : uploadData.message || JSON.stringify(uploadData, null, 2);
      } else {
        finalText = "No response from backend.";
      }

      updateChat(activeChatId, (chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: chat.messages.map((m) =>
          m.id === assistantMessageId ? { ...m, content: finalText } : m,
        ),
      }));
    } catch (error) {
      console.error(error);
      const data = error?.response?.data;
      const message =
        (data && (data.message || data.error)) ||
        (typeof data === "string" ? data : null) ||
        error?.message ||
        "Error while calling backend.";

      updateChat(activeChatId, (chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: chat.messages.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content:
                  typeof message === "string"
                    ? message
                    : "Unexpected error from the server.",
              }
            : m,
        ),
      }));
    } finally {
      setIsProcessing(false);
    }
  }

  function onPickFileClick() {
    fileInputRef.current?.click();
  }

  function onFilesSelected(files) {
    const file = files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadedFile(file);
  }

  function handleTextareaKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(false);
    onFilesSelected(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(false);
  }

  function handleLogout() {
    if (typeof window !== "undefined")
      window.localStorage.removeItem("authToken");
    router.push("/login");
  }

  return (
    // KEY FIX: Use h-screen instead of min-h-svh, remove padding so it fills the full viewport
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950">
      <div className="flex w-full overflow-hidden border border-zinc-800 bg-zinc-950/80 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        {/* Sidebar */}
        <aside
          className={cn(
            "relative flex shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/70 backdrop-blur-sm transition-[width] duration-200",
            sidebarOpen ? "w-[18.5rem]" : "w-[4.25rem]",
          )}
        >
          <div className="flex items-center gap-2 p-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded-2xl hover:bg-zinc-900/70"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="size-4" />
            </Button>
            {sidebarOpen ? (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white/90">
                  Retriev Chat
                </div>
                <div className="truncate text-xs text-white/55">
                  Chat History
                </div>
              </div>
            ) : null}
          </div>

          <div className="px-3 pb-3">
            <Button
              onClick={createNewChat}
              className={cn(
                "w-full rounded-2xl bg-zinc-900 border border-zinc-700 text-zinc-50 hover:bg-zinc-800 hover:border-zinc-500",
                !sidebarOpen && "px-0",
              )}
            >
              <Plus className="mr-2 size-4" />
              {sidebarOpen ? "New Chat" : null}
            </Button>
          </div>

          {/* Scrollable chat list */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <div
              className={cn(
                "px-2 pb-2 text-xs text-white/45",
                !sidebarOpen && "sr-only",
              )}
            >
              Recent
            </div>
            <div className="space-y-1">
              {chats.map((chat) => {
                const active = chat.id === activeChatId;
                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-zinc-700 bg-zinc-900"
                        : "border-transparent hover:border-zinc-700 hover:bg-zinc-900/70",
                    )}
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-zinc-700 bg-zinc-950">
                      <Bot className="size-4 text-zinc-300" />
                    </div>
                    {sidebarOpen ? (
                      <div className="min-w-0">
                        <div className="truncate text-sm text-zinc-50">
                          {chat.title || "New chat"}
                        </div>
                        <div className="truncate text-xs text-zinc-400">
                          {chat.messages?.length || 0} messages
                        </div>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar footer */}
          <div className="p-3">
            <div className={cn("space-y-2", !sidebarOpen && "space-y-3")}>
              <div className={cn(!sidebarOpen && "hidden")}>
                <AvatarChip
                  icon={User}
                  label={userEmail || "Signed in"}
                  sublabel={
                    userEmail ? "Logged in to Retriev" : "Retriev account"
                  }
                />
              </div>
              <div className="relative settings-menu-container">
                <Button
                  variant="ghost"
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className={cn(
                    "w-full justify-start rounded-2xl border border-zinc-700 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-900 hover:border-zinc-500",
                    !sidebarOpen && "justify-center px-0",
                  )}
                >
                  <Settings className={cn("size-4", sidebarOpen && "mr-2")} />
                  {sidebarOpen ? "Settings" : null}
                </Button>
                {showSettingsMenu && sidebarOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-full rounded-2xl border border-zinc-700 bg-zinc-950/90 backdrop-blur-md shadow-lg overflow-hidden z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-zinc-100 hover:bg-zinc-900 transition-colors"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content — KEY FIX: flex-col with overflow-hidden so children control scroll */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-sm px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-50">
                {activeChat?.title || "Chat"}
              </div>
              <div className="truncate text-xs text-zinc-400">
                Backend RAG • PDF upload • drag & drop
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-2xl border border-zinc-700 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-900 hover:border-zinc-500"
                onClick={createNewChat}
              >
                <Plus className="mr-2 size-4" />
                New
              </Button>
            </div>
          </header>

          {/* Messages — KEY FIX: flex-1 + overflow-y-auto so messages scroll within available space */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {(activeChat?.messages || []).map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Composer — KEY FIX: shrink-0 so it never gets squeezed by messages */}
          <div
            className={cn(
              "shrink-0 border-t border-zinc-800 bg-zinc-950/80 px-4 py-4 backdrop-blur-md",
              isDraggingFile && "bg-emerald-500/10",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mx-auto w-full max-w-3xl">
              {uploadedFileName ? (
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
                  <div className="flex min-w-0 items-center gap-2">
                    <Paperclip className="size-4 text-zinc-300" />
                    <span className="truncate">{uploadedFileName}</span>
                  </div>
                  <button
                    className="rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={() => setUploadedFileName(null)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ) : null}

              <div className="flex items-end gap-2 rounded-[22px] border border-zinc-700 bg-zinc-900/80 p-2 shadow-lg backdrop-blur-sm">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => onFilesSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-2xl hover:bg-zinc-800"
                  onClick={onPickFileClick}
                  aria-label="Upload file"
                >
                  <Paperclip className="size-4 text-zinc-200" />
                </Button>

                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={
                    isDraggingFile
                      ? "Drop your file to attach…"
                      : "Message Retriev AI…"
                  }
                  rows={1}
                  className="max-h-[180px] min-h-[44px] flex-1 resize-none rounded-2xl bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                />

                <Button
                  type="button"
                  className="shrink-0 rounded-2xl bg-zinc-800 border border-zinc-600 text-zinc-50 hover:bg-zinc-700 hover:border-zinc-400"
                  disabled={isProcessing || (!draft.trim() && !uploadedFile)}
                  onClick={() => void handleSend()}
                  aria-label="Send message"
                >
                  <Send className="mr-2 size-4" />
                  {isProcessing ? "Processing…" : "Send"}
                </Button>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <div>
                  Tip: press <span className="text-zinc-200">Enter</span> to
                  send,
                  <span className="text-zinc-200"> Shift+Enter</span> for a new
                  line.
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-zinc-200">
                    {activeChat?.messages?.length || 0} msgs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
