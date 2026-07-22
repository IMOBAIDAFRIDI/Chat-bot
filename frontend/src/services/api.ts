import { Chat, Message, User } from "../types";

const rawBase = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = rawBase ? `${rawBase.replace(/\/$/, "")}/api` : "/api";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginApi(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function signupApi(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");
  return data;
}

export async function getProfileApi(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load user profile");
  return data.user;
}

export async function fetchChatsApi(): Promise<Chat[]> {
  const res = await fetch(`${API_BASE}/chats`, {
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch chats");
  return data.chats;
}

export async function createChatApi(title?: string): Promise<Chat> {
  const res = await fetch(`${API_BASE}/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create chat");
  return data.chat;
}

export async function renameChatApi(chatId: string, title: string): Promise<Chat> {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to rename chat");
  return data.chat;
}

export async function deleteChatApi(chatId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete chat");
}

export async function fetchMessagesApi(chatId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch messages");
  return data.messages;
}

/**
 * Stream completion chunks via Server-Sent Events / ReadableStream
 */
export async function streamMessageApi(
  chatId: string,
  content: string,
  onUserMessage: (msg: Message) => void,
  onChunk: (chunk: string) => void,
  onDone: (msg: Message) => void,
  onError: (err: string) => void,
  signal?: AbortSignal
) {
  try {
    const res = await fetch(`${API_BASE}/chats/${chatId}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ content }),
      signal,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || "Streaming request failed");
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No readable stream received from server");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.substring(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "user_msg") {
              onUserMessage(event.data);
            } else if (event.type === "chunk") {
              onChunk(event.content);
            } else if (event.type === "done") {
              onDone(event.data);
            } else if (event.type === "error") {
              onError(event.error);
            }
          } catch (err) {
            console.error("Failed to parse SSE payload:", jsonStr);
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name !== "AbortError") {
      onError(err.message || "An unexpected error occurred during streaming");
    }
  }
}
