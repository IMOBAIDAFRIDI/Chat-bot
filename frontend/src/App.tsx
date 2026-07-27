import React, { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, Code, Cpu, ShieldCheck, AlertCircle, RefreshCw, Zap, Globe, MessageSquare, Terminal } from "lucide-react";
import { Chat, Message, Attachment } from "./types";
import {
  createChatApi,
  deleteChatApi,
  fetchChatsApi,
  fetchMessagesApi,
  renameChatApi,
  streamMessageApi,
} from "./services/api";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";

export const AppContent: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Load existing chats on mount
  useEffect(() => {
    async function loadChats() {
      try {
        const list = await fetchChatsApi();
        setChats(list);
        if (list.length > 0) {
          setActiveChatId(list[0].id);
        }
      } catch (err: any) {
        console.warn("Failed to load initial chats:", err.message);
      }
    }
    loadChats();
  }, []);

  // Fetch messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const msgs = await fetchMessagesApi(activeChatId!);
        setMessages(msgs);
      } catch (err: any) {
        console.error("Failed to load messages:", err.message);
      }
    }
    loadMessages();
  }, [activeChatId]);

  const handleNewChat = async () => {
    if (isStreaming) handleStopStreaming();
    try {
      const newChat = await createChatApi();
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to create new chat");
    }
  };

  const handleSelectChat = (chatId: string) => {
    if (isStreaming) handleStopStreaming();
    setActiveChatId(chatId);
    setSidebarOpen(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChatApi(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        const remaining = chats.filter((c) => c.id !== chatId);
        setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to delete chat");
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const updated = await renameChatApi(chatId, newTitle);
      setChats((prev) => prev.map((c) => (c.id === chatId ? updated : c)));
    } catch (err: any) {
      setErrorNotice(err.message || "Failed to rename chat");
    }
  };

  const handleSendMessage = async (text: string, attachments?: Attachment[]) => {
    let targetChatId = activeChatId;

    // Auto-create chat if none selected
    if (!targetChatId) {
      try {
        const newChat = await createChatApi();
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        targetChatId = newChat.id;
      } catch (err: any) {
        setErrorNotice(err.message || "Failed to initialize conversation");
        return;
      }
    }

    // Optimistic UI update
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      chatId: targetChatId,
      role: "user",
      content: text || (attachments && attachments.length > 0 ? `[Attached ${attachments.length} file(s)]` : ""),
      attachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingText("");
    setErrorNotice(null);

    abortControllerRef.current = new AbortController();

    await streamMessageApi(
      targetChatId,
      text || (attachments && attachments.length > 0 ? `Please analyze the attached document / image.` : ""),
      attachments,
      (userMsg) => {
        setMessages((prev) => prev.map((m) => (m.id === tempUserMsg.id ? { ...userMsg, attachments } : m)));
      },
      (chunk) => {
        setStreamingText((prev) => prev + chunk);
      },
      (assistantMsg) => {
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingText("");
        setIsStreaming(false);
      },
      (errText) => {
        setErrorNotice(errText);
        setStreamingText("");
        setIsStreaming(false);
      },
      (newTitle) => {
        setChats((prev) =>
          prev.map((c) => (c.id === targetChatId ? { ...c, title: newTitle } : c))
        );
      },
      abortControllerRef.current.signal
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  // Export current conversation history as Markdown file
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const content = messages
      .map((m) => `### ${m.role === "user" ? "You" : "Afridi-GPT"}\n${m.content}\n`)
      .join("\n---\n\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Afridi-GPT-Chat-${Date.now()}.md`;
    a.click();
  };

  const quickPrompts = [
    {
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      title: "🎨 AI Art Generator",
      prompt: "/image futuristic cybernetic AI city at sunset, highly detailed 8k digital art",
    },
    {
      icon: <Terminal className="h-4 w-4 text-emerald-500" />,
      title: "💻 Write Fullstack Code",
      prompt: "Write a complete React component with TypeScript for a modern responsive dashboard",
    },
    {
      icon: <Globe className="h-4 w-4 text-cyan-500" />,
      title: "🌐 Live Web Search",
      prompt: "Search the web for the latest technology news today and summarize key headlines",
    },
    {
      icon: <Cpu className="h-4 w-4 text-amber-500" />,
      title: "🧠 Quantum Physics",
      prompt: "Explain quantum computing and qubit superposition with simple analogies",
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-chat-bg-light dark:bg-chat-bg-dark text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
      />

      {/* Main Chat Workspace */}
      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onExportChat={handleExportChat}
          onNewChat={handleNewChat}
        />

        {/* Error Alert Bar */}
        {errorNotice && (
          <div className="mx-4 mt-2 flex items-center justify-between gap-2 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-600 dark:text-rose-400 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages Feed Area */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isStreaming ? (
            /* Afridi-GPT Hero Welcome Screen */
            <div className="flex h-full flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl shadow-emerald-500/30 animate-pulse-slow">
                <Zap className="h-10 w-10 fill-current" />
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent mb-3">
                What can Afridi-GPT help with today?
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8 max-w-lg">
                Powered by Google Gemini 3.5 Flash & Real-Time Multi-Engine Web Search. Ask anything, write code, or search live web facts!
              </p>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="flex flex-col items-start p-4 rounded-2xl border border-slate-200/80 dark:border-chat-border-dark bg-white dark:bg-chat-card-dark hover:border-chat-accent/60 transition-all shadow-sm group hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-chat-accent">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                    <span className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages Feed */
            <div className="w-full">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Live Streaming Message Chunk */}
              {isStreaming && streamingText && (
                <ChatMessage
                  message={{
                    id: "streaming-chunk",
                    chatId: activeChatId || "",
                    role: "assistant",
                    content: streamingText,
                    createdAt: new Date().toISOString(),
                  }}
                  isStreaming={true}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Bar */}
        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStopStreaming}
          isStreaming={isStreaming}
          disabled={false}
        />
      </div>
    </div>
  );
};
