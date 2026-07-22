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

export async function createChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
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
    const { chatId } = req.params;
    const { content } = sendMessageSchema.parse(req.body);

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

    // Save user message
    const userMsg = await prisma.message.create({
      data: {
        chatId,
        role: "user",
        content,
      },
    });

    // Auto-update title if it was default "New Chat"
    if (chat.title === "New Chat" || chat.title.trim() === "") {
      const generatedTitle = content.slice(0, 30) + (content.length > 30 ? "..." : "");
      await prisma.chat.update({
        where: { id: chatId },
        data: { title: generatedTitle },
      });
    } else {
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });
    }

    // Build context history for OpenAI
    const messageHistory: ChatMessageParam[] = [
      {
        role: "system",
        content: "You are a helpful, production-ready AI Assistant powered by GPT-5.4 Mini. Answer concisely, cleanly, and format responses with clean Markdown code blocks.",
      },
      ...chat.messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      { role: "user", content },
    ];

    // Set Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send user message confirmation frame
    res.write(`data: ${JSON.stringify({ type: "user_msg", data: userMsg })}\n\n`);

    // Stream completion chunks
    await OpenAIService.streamChatCompletion(
      messageHistory,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
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
            chatId,
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
