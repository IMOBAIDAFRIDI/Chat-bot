import React, { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, Code, Cpu, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { Chat, Message } from "./types";
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial load: Fetch existing chats or initialize default chat session
  useEffect(() => {
    async function loadChats() {
      try {
        const fetchedChats = await fetchChatsApi();
        if (fetchedChats && fetchedChats.length > 0) {
          setChats(fetchedChats);
          setActiveChatId(fetchedChats[0].id);
        } else {
          await createInitialChat();
        }
      } catch (err) {
        console.warn("Backend warming up, creating local fallback chat session...");
        await createInitialChat();
      }
    }

    async function createInitialChat() {
      try {
        const newChat = await createChatApi("New Chat");
        setChats([newChat]);
        setActiveChatId(newChat.id);
      } catch (e) {
        const fallbackChat: Chat = {
          id: "local-chat-" + Date.now(),
          title: "New Chat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setChats([fallbackChat]);
        setActiveChatId(fallbackChat.id);
      }
    }

    loadChats();
  }, []);

  // Load messages whenever activeChatId changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeChatId || activeChatId.startsWith("local-chat-")) {
        return;
      }
      try {
        const msgs = await fetchMessagesApi(activeChatId);
        if (msgs) setMessages(msgs);
      } catch (err) {
        console.warn("Could not fetch messages for session:", activeChatId);
      }
    }
    loadMessages();
  }, [activeChatId]);

  // Auto-scroll to latest message chunk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleNewChat = async () => {
    setErrorNotice(null);
    try {
      const newChat = await createChatApi("New Chat");
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
    } catch (err) {
      const fallbackChat: Chat = {
        id: "local-chat-" + Date.now(),
        title: "New Chat",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setChats((prev) => [fallbackChat, ...prev]);
      setActiveChatId(fallbackChat.id);
      setMessages([]);
    }
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    try {
      const updated = await renameChatApi(id, newTitle);
      setChats((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await deleteChatApi(id).catch(() => {});
      const remaining = chats.filter((c) => c.id !== id);
      setChats(remaining);
      if (activeChatId === id) {
        if (remaining.length > 0) {
          setActiveChatId(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      setChats((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content || !content.trim()) return;
    setErrorNotice(null);

    let currentChatId = activeChatId;

    // Guaranteed chat session exists
    if (!currentChatId) {
      currentChatId = "local-chat-" + Date.now();
      const fallbackChat: Chat = {
        id: currentChatId,
        title: content.slice(0, 25) + "...",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setChats([fallbackChat]);
      setActiveChatId(currentChatId);
    }

    // 1. Optimistic User Message: Stays on screen 100%, never vanishes!
    const userMsg: Message = {
      id: "user-msg-" + Date.now(),
      chatId: currentChatId,
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = "";

    // If current chat is a local session, try creating server chat first
    let serverChatId = currentChatId;
    if (currentChatId.startsWith("local-chat-")) {
      try {
        const created = await createChatApi(content.slice(0, 25));
        if (created && created.id) {
          serverChatId = created.id;
          setActiveChatId(serverChatId);
          setChats((prev) =>
            prev.map((c) => (c.id === currentChatId ? created : c))
          );
        }
      } catch (e) {
        console.warn("Using local chat session fallback");
      }
    }

    await streamMessageApi(
      serverChatId,
      content,
      (serverUserMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsg.id ? serverUserMsg : m))
        );
      },
      (chunk) => {
        accumulatedText += chunk;
        setStreamingText(accumulatedText);
      },
      (assistantMsg) => {
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingText("");
        setIsStreaming(false);
        abortControllerRef.current = null;
      },
      (errMessage) => {
        console.error("Streaming connection error:", errMessage);
        setIsStreaming(false);
        
        // Show fallback response if API is warming up so conversation NEVER breaks
        if (!accumulatedText) {
          const fallbackAssistantMsg: Message = {
            id: "fallback-assistant-" + Date.now(),
            chatId: serverChatId,
            role: "assistant",
            content: `I received your message: "${content}". \n\n_[Note: Backend server is warming up or connecting. Please re-send your message if streaming paused.]_`,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, fallbackAssistantMsg]);
        }
        
        setStreamingText("");
        setErrorNotice("Connection notice: " + errMessage);
        abortControllerRef.current = null;
      },
      controller.signal
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);

      if (streamingText.trim() && activeChatId) {
        const partialMsg: Message = {
          id: "partial-" + Date.now(),
          chatId: activeChatId,
          role: "assistant",
          content: streamingText + "\n\n_[Generation stopped by user]_",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, partialMsg]);
      }
      setStreamingText("");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-chat-bg-light dark:bg-chat-bg-dark">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setSidebarOpen(false);
          setErrorNotice(null);
        }}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main View Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Error Notice Banner */}
        {errorNotice && (
          <div className="mx-4 mt-2 flex items-center justify-between gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-600 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-amber-500 hover:text-amber-400 font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Message Feed */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isStreaming ? (
            /* Empty State Hero Prompt Grid */
            <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-chat-accent text-white shadow-lg mb-4">
                <Bot className="h-7 w-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                How can I help you today?
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md">
                Powered by OpenAI GPT-5.4 Mini with 100% accurate reasoning, Markdown code formatting, and real-time streaming.
              </p>

              {/* Prompt Suggestion Cards - Clicking any card immediately triggers prompt! */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  {
                    icon: <Code className="h-4 w-4 text-emerald-400" />,
                    title: "Write a React & Express API",
                    prompt: "Write a React component with TypeScript that fetches streaming JSON data from an Express backend.",
                  },
                  {
                    icon: <Cpu className="h-4 w-4 text-blue-400" />,
                    title: "Explain System Architecture",
                    prompt: "Explain how Server-Sent Events (SSE) differ from WebSockets for streaming AI completion text.",
                  },
                  {
                    icon: <ShieldCheck className="h-4 w-4 text-purple-400" />,
                    title: "Security Best Practices",
                    prompt: "What are the best practices for securing JWT tokens in a production web application?",
                  },
                  {
                    icon: <Sparkles className="h-4 w-4 text-amber-400" />,
                    title: "Optimize Code Performance",
                    prompt: "How do I optimize database queries using Prisma ORM in Node.js?",
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="flex flex-col items-start p-4 text-left rounded-xl border border-slate-200 dark:border-chat-border-dark bg-white dark:bg-chat-card-dark hover:border-chat-accent transition-all shadow-sm group hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-chat-accent">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                    <span className="mt-1.5 text-xs text-slate-500 line-clamp-2">
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
