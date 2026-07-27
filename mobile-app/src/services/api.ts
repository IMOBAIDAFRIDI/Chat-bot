import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "https://ai-chatbot-backend-ea2h.onrender.com/api";

export interface MobileMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  imageUri?: string;
  createdAt: string;
}

export interface MobileChat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = (await AsyncStorage.getItem("token")) || "guest-token";
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMobileChatsApi(): Promise<MobileChat[]> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/chats`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch chats");
  return data.chats;
}

export async function createMobileChatApi(title?: string): Promise<MobileChat> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create chat");
  return data.chat;
}

export async function fetchMobileMessagesApi(chatId: string): Promise<MobileMessage[]> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch messages");
  return data.messages;
}

export async function streamMobileMessageApi(
  chatId: string,
  content: string,
  attachments: any[] | undefined,
  persona: string,
  onUserMessage: (msg: MobileMessage) => void,
  onChunk: (chunk: string) => void,
  onDone: (msg: MobileMessage) => void,
  onError: (err: string) => void,
  onTitleUpdate?: (title: string) => void
) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/chats/${chatId}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ content, attachments, persona }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || "Streaming request failed");
    }

    const text = await res.text();
    const lines = text.split("\n\n");

    let fullChunkText = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const jsonStr = trimmed.substring(6);
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === "user_msg") {
            onUserMessage(event.data);
            if (event.chatTitle && onTitleUpdate) onTitleUpdate(event.chatTitle);
          } else if (event.type === "chunk") {
            fullChunkText += event.content;
            onChunk(event.content);
          } else if (event.type === "done") {
            onDone(event.data);
          } else if (event.type === "error") {
            onError(event.error);
          }
        } catch (e) {
          // ignore keepalives
        }
      }
    }
  } catch (err: any) {
    onError(err.message || "An unexpected error occurred during mobile streaming");
  }
}
