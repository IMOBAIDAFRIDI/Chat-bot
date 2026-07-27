export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Attachment {
  name: string;
  type: string; // e.g. "image/png", "application/pdf", "text/plain"
  data: string; // base64 string or raw content
  url?: string; // preview URL
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
