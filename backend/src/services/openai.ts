import OpenAI from "openai";
import { logger } from "../utils/logger";

export interface ChatMessageParam {
  role: "user" | "assistant" | "system";
  content: string;
}

export class OpenAIService {
  private static getClient(): OpenAI | null {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key === "YOUR_API_KEY" || key.trim().length === 0) {
      return null;
    }
    return new OpenAI({ apiKey: key });
  }

  /**
   * Stream chat completion response using GPT-5.4 Mini or available OpenAI model
   */
  static async streamChatCompletion(
    messages: ChatMessageParam[],
    onChunk: (chunk: string) => void,
    onError: (err: any) => void,
    onComplete: (fullText: string) => void
  ) {
    const openai = this.getClient();
    let fullText = "";

    if (!openai) {
      logger.info("OpenAI API key not set. Using fallback mock stream.");
      return this.mockStreamResponse(messages, onChunk, onComplete);
    }

    try {
      let stream;
      try {
        stream = await openai.chat.completions.create({
          model: "gpt-5.4-mini",
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        });
      } catch (firstErr: any) {
        logger.warn("gpt-5.4-mini request failed, trying gpt-4o-mini fallback: " + firstErr.message);
        try {
          stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          });
        } catch (secondErr: any) {
          logger.warn("gpt-4o-mini request failed, trying gpt-3.5-turbo fallback: " + secondErr.message);
          stream = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          });
        }
      }

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullText += content;
          onChunk(content);
        }
      }

      onComplete(fullText);
    } catch (error: any) {
      logger.error("OpenAI API streaming error:", error);
      onError(error);
    }
  }

  private static async mockStreamResponse(
    messages: ChatMessageParam[],
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ) {
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
    const responseText = `Hello! You asked: "${lastUserMsg}". Real-time streaming response active.`;
    const chunks = responseText.match(/.{1,5}/g) || [responseText];
    let fullText = "";

    for (const chunk of chunks) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      fullText += chunk;
      onChunk(chunk);
    }

    onComplete(fullText);
  }
}
