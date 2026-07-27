import { logger } from "../utils/logger";

/**
 * Multi-Engine Real-Time Live Web Search Service (Google News + Wikipedia + DuckDuckGo)
 */
export async function searchWeb(query: string, fallbackSubject?: string): Promise<string> {
  let searchQuery = query.trim();

  // If query is vague like "search the web" or "search web", use fallback subject
  if (/^search(\s+the\s+web|\s+web|\s+internet)?$/i.test(searchQuery)) {
    searchQuery = fallbackSubject || "latest technology and world news";
  }

  try {
    const results: string[] = [];

    // 1. Google News RSS for live breaking headlines
    try {
      const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`;
      const newsRes = await fetch(newsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (newsRes.ok) {
        const xml = await newsRes.text();
        const titleRegex = /<title>(.*?)<\/title>/gi;
        let match;
        let count = 0;
        while ((match = titleRegex.exec(xml)) !== null && count < 4) {
          const clean = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").replace(/<[^>]+>/g, "").trim();
          if (clean && !clean.toLowerCase().includes("google news")) {
            results.push(`- Breaking News: ${clean}`);
            count++;
          }
        }
      }
    } catch (e: any) {
      logger.warn("Google News RSS search warning: " + e.message);
    }

    // 2. Wikipedia Search API for factual encyclopedic information
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const json: any = await wikiRes.json();
        const items = json?.query?.search || [];
        for (const item of items.slice(0, 3)) {
          const cleanSnippet = item.snippet
            .replace(/<[^>]+>/g, "")
            .replace(/&#039;/g, "'")
            .replace(/&quot;/g, '"')
            .trim();
          if (cleanSnippet) {
            results.push(`- Fact (${item.title}): ${cleanSnippet}`);
          }
        }
      }
    } catch (e: any) {
      logger.warn("Wikipedia API search warning: " + e.message);
    }

    // 3. DuckDuckGo HTML Search for live snippets
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
      const ddgRes = await fetch(ddgUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (ddgRes.ok) {
        const html = await ddgRes.text();
        const snippetRegex = /<a[^>]*class="result__snippet[^"]*"[^>]*>(.*?)<\/a>/gi;
        let match;
        let count = 0;
        while ((match = snippetRegex.exec(html)) !== null && count < 3) {
          const clean = match[1].replace(/<[^>]+>/g, "").trim();
          if (clean && clean.length > 20) {
            results.push(`- Web Snippet: ${clean}`);
            count++;
          }
        }
      }
    } catch (e: any) {
      logger.warn("DuckDuckGo search warning: " + e.message);
    }

    if (results.length === 0) return "";

    return results.join("\n");
  } catch (err: any) {
    logger.error("Web search error: " + err.message);
    return "";
  }
}

export function needsWebSearch(prompt: string): boolean {
  return true; // Always enable real-time internet search context for 100% up-to-date answers!
}
