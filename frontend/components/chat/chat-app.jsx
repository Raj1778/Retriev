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
  Trash2,
  X,
  ChevronRight,
  Edit3,
  Check,
  Menu,
  UserCircle,
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

function SettingsModal({ isOpen, onClose, userEmail, onLogout }) {
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savedName, setSavedName] = useState(() => {
    if (typeof window !== "undefined")
      return localStorage.getItem("displayName") || "";
    return "";
  });
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    if (isOpen) setDisplayName(savedName);
  }, [isOpen, savedName]);

  function handleSaveName() {
    setSavedName(displayName);
    if (typeof window !== "undefined")
      localStorage.setItem("displayName", displayName);
    setIsEditingName(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-50">Settings</span>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4">
          {["account", "appearance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                activeTab === tab
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {activeTab === "account" && (
            <>
              {/* Email */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1">
                <div className="text-xs text-zinc-500 font-medium">Email</div>
                <div className="text-sm text-zinc-200">
                  {userEmail || "Not signed in"}
                </div>
              </div>

              {/* Display Name */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                <div className="text-xs text-zinc-500 font-medium">
                  Display Name
                </div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                      placeholder="Enter display name…"
                    />
                    <button
                      onClick={handleSaveName}
                      className="grid size-8 place-items-center rounded-xl border border-emerald-600 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition-colors"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="grid size-8 place-items-center rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-200">
                      {savedName || "Not set"}
                    </div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    >
                      <Edit3 className="size-3" />
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400 hover:bg-red-950/60 hover:border-red-800 transition-colors"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </>
          )}

          {activeTab === "appearance" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
              Appearance settings coming soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatApp() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [draft, setDraft] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [hoveredChatId, setHoveredChatId] = useState(null);
  const [retrievalScope, setRetrievalScope] = useState("all");
  const [isClient, setIsClient] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) || null,
    [chats, activeChatId],
  );

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close mobile sidebar on resize
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setMobileSidebarOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
          setChats([
            { id, title: "New chat", updatedAt: Date.now(), messages: [] },
          ]);
          setActiveChatId(id);
        }
      } catch {
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeChat?.messages?.length]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [draft]);

  function createNewChat() {
    const id = newId();
    setChats((prev) => [
      { id, title: "New chat", updatedAt: Date.now(), messages: [] },
      ...prev,
    ]);
    setActiveChatId(id);
    setDraft("");
    setUploadedFileName(null);
    setUploadedFile(null);
    setMobileSidebarOpen(false);
  }

  function updateChat(id, updater) {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  function deleteChat(chatId) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== chatId);
      if (activeChatId === chatId) {
        if (next.length > 0) {
          setActiveChatId(next[0].id);
        } else {
          const newChatId = newId();
          const newChat = {
            id: newChatId,
            title: "New chat",
            updatedAt: Date.now(),
            messages: [],
          };
          setActiveChatId(newChatId);
          return [newChat];
        }
      }
      return next;
    });
    setChatToDelete(null);
  }

  async function handleSend() {
    const text = draft.trim();
    if (!activeChatId || isProcessing) return;
    if (!text && !uploadedFile) return;

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
      const nextTitle =
        chat.messages.find((m) => m.role === "user")?.content ||
        buildChatTitle(text);
      return {
        ...chat,
        title: chat.title === "New chat" ? nextTitle : chat.title,
        updatedAt: Date.now(),
        messages: [...chat.messages, userMessage, assistantPlaceholder],
      };
    });

    setDraft("");
    const fileToUpload = uploadedFile;
    const fileName = uploadedFileName;
    setUploadedFileName(null);
    setUploadedFile(null);
    setIsProcessing(true);

    try {
      let uploadData = null;
      let qaData = null;

      if (hasFile && fileToUpload) {
        uploadData = await uploadPdf(fileToUpload);
        updateChat(activeChatId, (chat) => ({
          ...chat,
          updatedAt: Date.now(),
          messages: chat.messages.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: `Processed ${fileName}. Generating answer...` }
              : m,
          ),
        }));
      }

      if (text) qaData = await askQuestion(text, activeChatId);

      let finalText = qaData
        ? typeof qaData === "string"
          ? qaData
          : qaData.answer || qaData.message || JSON.stringify(qaData, null, 2)
        : uploadData
          ? typeof uploadData === "string"
            ? uploadData
            : uploadData.message || JSON.stringify(uploadData, null, 2)
          : "No response from backend.";

      updateChat(activeChatId, (chat) => ({
        ...chat,
        updatedAt: Date.now(),
        messages: chat.messages.map((m) =>
          m.id === assistantMessageId ? { ...m, content: finalText } : m,
        ),
      }));
    } catch (error) {
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
                  typeof message === "string" ? message : "Unexpected error.",
              }
            : m,
        ),
      }));
    } finally {
      setIsProcessing(false);
    }
  }

  function handleLogout() {
    if (typeof window !== "undefined")
      window.localStorage.removeItem("authToken");
    router.push("/login");
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setUploadedFile(file);
    }
  }

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Sidebar Header */}
      <div className="flex items-center gap-2 p-3">
        {isMobile ? (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="grid size-9 place-items-center rounded-2xl hover:bg-zinc-900/70 text-zinc-400"
          >
            <X className="size-4" />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-2xl hover:bg-zinc-900/70 shrink-0"
          >
            <PanelLeft className="size-4" />
          </Button>
        )}
        {(isMobile || sidebarOpen) && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white/90">
              Retriev Chat
            </div>
            <div className="truncate text-xs text-white/55">Chat History</div>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-3">
        <Button
          onClick={createNewChat}
          className={cn(
            "w-full rounded-2xl bg-zinc-900 border border-zinc-700 text-zinc-50 hover:bg-zinc-800 hover:border-zinc-500",
            !isMobile && !sidebarOpen && "px-0 justify-center",
          )}
        >
          <Plus className={cn("size-4", (isMobile || sidebarOpen) && "mr-2")} />
          {isMobile || sidebarOpen ? "New Chat" : null}
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {(isMobile || sidebarOpen) && (
          <div className="px-2 pb-2 text-xs text-white/45">Recent</div>
        )}
        <div className="space-y-1">
          {chats.map((chat) => {
            const active = chat.id === activeChatId;
            const hovered = hoveredChatId === chat.id;
            return (
              <div
                key={chat.id}
                className="relative group"
                onMouseEnter={() => setHoveredChatId(chat.id)}
                onMouseLeave={() => setHoveredChatId(null)}
              >
                <button
                  onClick={() => {
                    setActiveChatId(chat.id);
                    if (isMobile) setMobileSidebarOpen(false);
                  }}
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
                  {(isMobile || sidebarOpen) && (
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-zinc-50">
                        {chat.title || "New chat"}
                      </div>
                      <div className="truncate text-xs text-zinc-400">
                        {chat.messages?.length || 0} messages
                      </div>
                    </div>
                  )}
                </button>
                {/* Delete button */}
                {(isMobile || sidebarOpen) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatToDelete(chat.id);
                    }}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-red-800 hover:bg-red-950/50 hover:text-red-400 transition-all duration-150",
                      hovered || active
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none",
                    )}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 space-y-2">
        {(isMobile || sidebarOpen) && (
          <AvatarChip
            icon={UserCircle}
            label={
              isClient
                ? (() => {
                    const n = localStorage.getItem("displayName");
                    if (n) return n;
                    return userEmail ? userEmail.split("@")[0] : "Signed in";
                  })()
                : "Loading..."
            }
            sublabel={isClient ? (userEmail ? "Retriev account" : "") : ""}
          />
        )}
        <Button
          variant="ghost"
          onClick={() => setShowSettings(true)}
          className={cn(
            "w-full justify-start rounded-2xl border border-zinc-700 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-900 hover:border-zinc-500",
            !isMobile && !sidebarOpen && "justify-center px-0",
          )}
        >
          <Settings
            className={cn("size-4", (isMobile || sidebarOpen) && "mr-2")}
          />
          {isMobile || sidebarOpen ? "Settings" : null}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950">
      {/* Delete Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setChatToDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl border border-red-900/50 bg-red-950/40">
                <Trash2 className="size-4 text-red-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-50">
                  Delete chat?
                </div>
                <div className="text-xs text-zinc-400">
                  This action cannot be undone.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 rounded-2xl border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                onClick={() => setChatToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 hover:border-red-600"
                onClick={() => deleteChat(chatToDelete)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col border-r border-zinc-800 bg-zinc-950 z-10">
            <SidebarContent isMobile={true} />
          </aside>
        </div>
      )}

      <div className="flex w-full overflow-hidden border border-zinc-800 bg-zinc-950/80 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex relative shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/70 backdrop-blur-sm transition-[width] duration-200",
            sidebarOpen ? "w-[18.5rem]" : "w-[4.25rem]",
          )}
        >
          <SidebarContent isMobile={false} />
        </aside>

        {/* Main Content */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-sm px-3 md:px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile hamburger */}
              <button
                className="md:hidden grid size-9 place-items-center rounded-2xl border border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:text-zinc-100 shrink-0"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="size-4" />
              </button>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-50">
                  {activeChat?.title || "Chat"}
                </div>
                <div className="hidden sm:block truncate text-xs text-zinc-400">
                  Backend RAG • PDF upload • drag & drop
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-2xl border border-zinc-700 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-900 hover:border-zinc-500 shrink-0"
              onClick={createNewChat}
            >
              <Plus className="mr-1.5 size-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto px-3 md:px-4 py-5">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {(activeChat?.messages || []).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="grid size-16 place-items-center rounded-3xl border border-zinc-800 bg-zinc-900">
                    <Bot className="size-7 text-zinc-400" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-zinc-200">
                      How can I help you?
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">
                      Ask a question or upload a PDF to get started.
                    </div>
                  </div>
                </div>
              )}
              {(activeChat?.messages || []).map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input Area */}
          <div
            className={cn(
              "shrink-0 border-t border-zinc-800 bg-zinc-950/80 px-3 md:px-4 py-3 md:py-4 backdrop-blur-md",
              isDraggingFile && "bg-emerald-500/10",
            )}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingFile(false);
            }}
          >
            <div className="mx-auto w-full max-w-3xl">
              {/* Retrieval Scope Selection */}
              <div className="mb-3 flex items-center gap-2">
                <label className="text-xs text-zinc-400">Search in:</label>
                <div className="flex gap-1">
                  {[
                    { value: "all", label: "All Documents" },
                    { value: "current", label: "Documents in this Chat" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRetrievalScope(option.value)}
                      className={cn(
                        "rounded-xl px-3 py-1 text-xs font-medium transition-colors",
                        retrievalScope === option.value
                          ? "bg-zinc-800 text-zinc-50"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {uploadedFileName && (
                <div className="mb-3 flex items-center justify-between rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
                  <div className="flex min-w-0 items-center gap-2">
                    <Paperclip className="size-4 text-zinc-300 shrink-0" />
                    <span className="truncate">{uploadedFileName}</span>
                  </div>
                  <button
                    className="ml-2 shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={() => {
                      setUploadedFileName(null);
                      setUploadedFile(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2 rounded-[22px] border border-zinc-700 bg-zinc-900/80 p-2 shadow-lg backdrop-blur-sm">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFileName(file.name);
                      setUploadedFile(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-2xl hover:bg-zinc-800"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="size-4 text-zinc-200" />
                </Button>

                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder={
                    isDraggingFile ? "Drop your file…" : "Message Retriev AI…"
                  }
                  rows={1}
                  className="max-h-[180px] min-h-[44px] flex-1 resize-none rounded-2xl bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                />

                <Button
                  type="button"
                  className="shrink-0 rounded-2xl bg-zinc-800 border border-zinc-600 text-zinc-50 hover:bg-zinc-700 hover:border-zinc-400"
                  disabled={isProcessing || (!draft.trim() && !uploadedFile)}
                  onClick={() => void handleSend()}
                >
                  <Send className="size-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {isProcessing ? "Processing…" : "Send"}
                  </span>
                </Button>
              </div>

              <div className="mt-2 hidden sm:flex items-center justify-between text-xs text-zinc-500">
                <div>
                  Press <span className="text-zinc-200">Enter</span> to send,{" "}
                  <span className="text-zinc-200">Shift+Enter</span> for new
                  line.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
