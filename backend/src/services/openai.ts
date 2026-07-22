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
   * Fast Low-Latency OpenAI Streaming Chat Completion
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
        // gpt-4o-mini offers ultra-fast response initiation (< 1s) with GPT-4 class intelligence
        stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        });
      } catch (firstErr: any) {
        logger.warn("Primary fast model attempt: " + firstErr.message);
        try {
          stream = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
          });
        } catch (secondErr: any) {
          stream = await openai.chat.completions.create({
            model: "gpt-5.4-mini",
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
    const responseText = `Hello! You asked: "${lastUserMsg}". Real-time high-speed streaming active.`;
    const chunks = responseText.match(/.{1,4}/g) || [responseText];
    let fullText = "";

    for (const chunk of chunks) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      fullText += chunk;
      onChunk(chunk);
    }

    onComplete(fullText);
  }
}
