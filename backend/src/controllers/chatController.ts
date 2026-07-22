import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { OpenAIService, ChatMessageParam } from "../services/openai";
import { AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../utils/logger";

const createChatSchema = z.object({
  title: z.string().optional(),
});

const renameChatSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

async function ensureUserExists(userId: string, email: string) {
  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      await prisma.user.create({
        data: {
          id: userId,
          email,
          name: "User",
          isVerified: true,
        },
      });
    }
  } catch (e) {
    // Ignore duplicate constraint during concurrent guest requests
  }
}

export async function createChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const email = req.user!.email;
    await ensureUserExists(userId, email);

    const { title } = createChatSchema.parse(req.body);

    const chat = await prisma.chat.create({
      data: {
        title: title || "New Chat",
        userId,
      },
    });

    res.status(201).json({ chat });
  } catch (error) {
    next(error);
  }
}

export async function getChats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const email = req.user!.email;
    await ensureUserExists(userId, email);

    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ chats });
  } catch (error) {
    next(error);
  }
}

export async function getChatMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { chatId } = req.params;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    res.json({ chat, messages: chat.messages });
  } catch (error) {
    next(error);
  }
}

export async function renameChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { chatId } = req.params;
    const { title } = renameChatSchema.parse(req.body);

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: { title },
    });

    res.json({ chat: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { chatId } = req.params;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    await prisma.chat.delete({
      where: { id: chatId },
    });

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function streamMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const email = req.user!.email;
    await ensureUserExists(userId, email);

    const { chatId } = req.params;
    const { content } = sendMessageSchema.parse(req.body);

    // Fast Chat lookup or dynamic creation
    let chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          id: chatId.startsWith("local-chat-") ? undefined : chatId,
          title: content.slice(0, 25),
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    // Save user message asynchronously
    const userMsg = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "user",
        content,
      },
    });

    // Expert System Prompt for ChatGPT level 100% accuracy & reasoning
    const messageHistory: ChatMessageParam[] = [
      {
        role: "system",
        content: `You are GPT-5.4 Mini, an advanced, highly intelligent, precise, and articulate AI assistant created by OpenAI.
You provide exceptionally detailed, accurate, step-by-step, and correct answers.
You excel at software engineering, programming, math, logic, complex reasoning, science, writing, and general knowledge.
Always format code using clean, syntax-highlighted Markdown code blocks with exact language labels.
Ensure 100% factual accuracy, clarity, and helpfulness matching or exceeding ChatGPT.`,
      },
      ...chat.messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      { role: "user", content },
    ];

    // Set Ultra-Fast Streaming & Anti-Proxy-Buffering Headers for Render/Cloudflare/Nginx
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable proxy buffering for instant <1s token delivery!

    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }

    // Immediate confirmation frame
    res.write(`data: ${JSON.stringify({ type: "user_msg", data: userMsg })}\n\n`);

    // Stream completion chunks immediately
    await OpenAIService.streamChatCompletion(
      messageHistory,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
        if (typeof (res as any).flush === "function") {
          (res as any).flush();
        }
      },
      (err) => {
        logger.error("Streaming error in controller:", err);
        res.write(`data: ${JSON.stringify({ type: "error", error: "Streaming failed: " + err.message })}\n\n`);
        res.end();
      },
      async (fullText) => {
        // Save assistant response to DB
        const assistantMsg = await prisma.message.create({
          data: {
            chatId: chat.id,
            role: "assistant",
            content: fullText,
          },
        });

        res.write(`data: ${JSON.stringify({ type: "done", data: assistantMsg })}\n\n`);
        res.end();
      }
    );
  } catch (error) {
    next(error);
  }
}
