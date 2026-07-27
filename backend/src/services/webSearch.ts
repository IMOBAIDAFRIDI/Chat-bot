import { logger } from "../utils/logger";

export interface SearchResult {
  title: string;
  snippet: string;
  link?: string;
}

/**
 * Real-Time Web Search Service (DuckDuckGo + Google Search fallback)
 */
export async function searchWeb(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      logger.warn(`Web search HTTP error: ${response.status}`);
      return "";
    }

    const html = await response.text();
    const results: SearchResult[] = [];

    // Extract search result title and snippet matching DuckDuckGo HTML
    const snippetRegex = /<a[^>]*class="result__snippet[^"]*"[^>]*>(.*?)<\/a>/gi;
    const titleRegex = /<a[^>]*class="result__url"[^>]*>(.*?)<\/a>/gi;

    let match;
    const snippets: string[] = [];

    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
      const text = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (text && text.length > 15) {
        snippets.push(text);
      }
    }

    if (snippets.length === 0) {
      // Fallback matching for td.result__snippet
      const tdRegex = /<td[^>]*class="result__snippet"[^>]*>(.*?)<\/td>/gi;
      while ((match = tdRegex.exec(html)) !== null && snippets.length < 5) {
        const text = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (text && text.length > 15) {
          snippets.push(text);
        }
      }
    }

    if (snippets.length === 0) return "";

    return snippets.map((s, idx) => `[Web Source ${idx + 1}]: ${s}`).join("\n\n");
  } catch (err: any) {
    logger.error("Web search exception: " + err.message);
    return "";
  }
}

/**
 * Detects if a user query requires real-time live internet information
 */
export function needsWebSearch(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const keywords = [
    "latest",
    "today",
    "news",
    "current",
    "recent",
    "now",
    "who won",
    "score",
    "price",
    "weather",
    "2026",
    "2025",
    "release date",
    "update",
    "who is currently",
    "what happened",
  ];
  return keywords.some((k) => lower.includes(k)) || prompt.trim().endsWith("?");
}
