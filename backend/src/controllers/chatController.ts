import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { OpenAIService, ChatMessageParam, AttachmentParam } from "../services/openai";
import { AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../utils/logger";

const createChatSchema = z.object({
  title: z.string().optional(),
});

const renameChatSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

const attachmentSchema = z.object({
  name: z.string().optional(),
  type: z.string(),
  data: z.string(),
});

const sendMessageSchema = z.object({
  content: z.string().optional().default(""),
  attachments: z.array(attachmentSchema).optional(),
  persona: z.string().optional(),
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
  } catch (err: any) {
    logger.warn("ensureUserExists warning: " + err.message);
  }
}

export async function fetchChats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const email = req.user!.email;
    await ensureUserExists(userId, email);

    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ chats });
  } catch (error) {
    next(error);
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
        userId,
        title: title || "New Chat",
      },
    });

    res.status(201).json({ chat });
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

export async function fetchMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

    res.json({ messages: chat.messages });
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
    const { content, attachments, persona } = sendMessageSchema.parse(req.body);

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
      const topicTitle = await OpenAIService.generateTopicTitle(content);
      chat = await prisma.chat.create({
        data: {
          id: chatId.startsWith("local-chat-") ? undefined : chatId,
          title: topicTitle,
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    } else if (chat.title === "New Chat" || !chat.title) {
      const topicTitle = await OpenAIService.generateTopicTitle(content);
      chat = await prisma.chat.update({
        where: { id: chat.id },
        data: { title: topicTitle },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    // Save user message
    const userMsg = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "user",
        content,
      },
    });

    // Build message history — system prompt & persona are handled inside OpenAIService
    const messageHistory: ChatMessageParam[] = [
      ...chat.messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      {
        role: "user",
        content: content || (attachments && attachments.length > 0 ? "Please analyze and process this image." : ""),
      },
    ];

    // Prepare SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Emit initial user_msg event with title update
    res.write(
      `data: ${JSON.stringify({
        type: "user_msg",
        data: userMsg,
        chatTitle: chat.title,
      })}\n\n`
    );

    let assistantFullText = "";

    await OpenAIService.streamChatCompletion(
      messageHistory,
      attachments as AttachmentParam[] | undefined,
      persona,
      (chunk: string) => {
        assistantFullText += chunk;
        res.write(
          `data: ${JSON.stringify({
            type: "chunk",
            content: chunk,
          })}\n\n`
        );
      },
      (err: any) => {
        logger.error("SSE Streaming Error: " + (err.message || err));
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            error: err.message || "Streaming failed",
          })}\n\n`
        );
        res.end();
      },
      async (completedText: string) => {
        try {
          const assistantMsg = await prisma.message.create({
            data: {
              chatId: chat.id,
              role: "assistant",
              content: completedText || assistantFullText,
            },
          });

          await prisma.chat.update({
            where: { id: chat.id },
            data: { updatedAt: new Date() },
          });

          res.write(
            `data: ${JSON.stringify({
              type: "done",
              data: assistantMsg,
            })}\n\n`
          );
        } catch (dbErr: any) {
          logger.error("Failed to save assistant message: " + dbErr.message);
        } finally {
          res.end();
        }
      }
    );
  } catch (error) {
    next(error);
  }
}
