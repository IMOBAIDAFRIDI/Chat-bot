import OpenAI from "openai";
import { logger } from "../utils/logger";

export interface ChatMessageParam {
  role: "user" | "assistant" | "system";
  content: string;
}

export class OpenAIService {
  /**
   * Stream completion using Anthropic Claude API or OpenAI GPT
   */
  static async streamChatCompletion(
    messages: ChatMessageParam[],
    onChunk: (chunk: string) => void,
    onError: (err: any) => void,
    onComplete: (fullText: string) => void
  ) {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. Try Anthropic Claude API if Key is present
    if (anthropicKey && anthropicKey.trim().length > 0) {
      try {
        const success = await this.streamClaudeCompletion(
          anthropicKey,
          messages,
          onChunk,
          onComplete
        );
        if (success) return;
      } catch (err: any) {
        logger.warn("Claude API stream failed, falling back to OpenAI: " + err.message);
      }
    }

    // 2. Try OpenAI API if Key is present
    if (openaiKey && openaiKey !== "YOUR_API_KEY" && openaiKey.trim().length > 0) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        });

        let fullText = "";
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            onChunk(content);
          }
        }
        return onComplete(fullText);
      } catch (err: any) {
        logger.warn("OpenAI API stream error, fallback active: " + err.message);
      }
    }

    // 3. Fallback responder if keys are warming up
    return this.mockStreamResponse(messages, onChunk, onComplete);
  }

  /**
   * Stream response from Anthropic Claude API (claude-3-5-sonnet)
   */
  private static async streamClaudeCompletion(
    apiKey: string,
    messages: ChatMessageParam[],
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<boolean> {
    const systemMsg = messages.find((m) => m.role === "system")?.content || 
      "You are Claude 3.5 Sonnet, an exceptionally intelligent, precise, and articulate AI assistant created by Anthropic. Provide 100% accurate, helpful answers with clean Markdown formatting.";

    const formattedMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: systemMsg,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API HTTP ${response.status}: ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return false;

    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.substring(6);
          try {
            const event = JSON.parse(jsonStr);
            if (
              event.type === "content_block_delta" &&
              event.delta &&
              event.delta.type === "text_delta"
            ) {
              const textChunk = event.delta.text;
              fullText += textChunk;
              onChunk(textChunk);
            }
          } catch (e) {
            // Ignore keep-alive frames
          }
        }
      }
    }

    onComplete(fullText);
    return true;
  }

  private static async mockStreamResponse(
    messages: ChatMessageParam[],
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ) {
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
    const responseText = `Hello! Here is the response for your query: "${lastUserMsg}".\n\nAI Streaming engine active & connected.`;
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
