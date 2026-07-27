import { logger } from "../utils/logger";

/**
 * Multi-Engine Real-Time Live Web Search Service (Google News + Wikipedia + DuckDuckGo)
 */
export async function searchWeb(query: string, fallbackSubject?: string): Promise<string> {
  let searchQuery = query.trim();

  // Handle vague search commands
  if (/^search(\s+the\s+web|\s+web|\s+internet)?$/i.test(searchQuery)) {
    searchQuery = fallbackSubject || "latest technology and world news";
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s budget for real-time web retrieval

    const fetchOpts = {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    };

    const results = await Promise.allSettled([
      // 1. Google News RSS for live breaking headlines
      fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`, fetchOpts)
        .then((r) => r.text())
        .then((xml) => {
          const items: string[] = [];
          const regex = /<title>(.*?)<\/title>/gi;
          let m;
          while ((m = regex.exec(xml)) !== null && items.length < 4) {
            const clean = m[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").replace(/<[^>]+>/g, "").trim();
            if (clean && !clean.toLowerCase().includes("google news")) {
              items.push(`- News: ${clean}`);
            }
          }
          return items;
        }),

      // 2. Wikipedia Search API for factual encyclopedic information
      fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json`, fetchOpts)
        .then((r) => r.json())
        .then((data: any) => {
          const items: string[] = [];
          const list = data?.query?.search || [];
          for (const item of list.slice(0, 3)) {
            const clean = item.snippet
              .replace(/<[^>]+>/g, "")
              .replace(/&#039;/g, "'")
              .replace(/&quot;/g, '"')
              .trim();
            if (clean) items.push(`- Fact (${item.title}): ${clean}`);
          }
          return items;
        }),
    ]);

    clearTimeout(timeoutId);

    const snippets: string[] = [];
    results.forEach((res) => {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        snippets.push(...res.value);
      }
    });

    return snippets.join("\n");
  } catch (err: any) {
    logger.warn("Web search error: " + err.message);
    return "";
  }
}

export function needsWebSearch(prompt: string): boolean {
  return true; // Always enable real-time internet search context for 100% up-to-date answers!
}
