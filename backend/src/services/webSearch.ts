import { logger } from "../utils/logger";

/**
 * Ultra-Fast Parallel Multi-Engine Web Search with Strict 600ms Timeout
 */
export async function searchWeb(query: string, fallbackSubject?: string): Promise<string> {
  let searchQuery = query.trim();

  if (/^search(\s+the\s+web|\s+web|\s+internet)?$/i.test(searchQuery)) {
    searchQuery = fallbackSubject || "latest technology and world news";
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600); // Strict 600ms max search budget!

    const fetchOpts = {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    };

    // Run Google News RSS & Wikipedia API concurrently in PARALLEL
    const results = await Promise.allSettled([
      // 1. Google News RSS
      fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`, fetchOpts)
        .then((r) => r.text())
        .then((xml) => {
          const items: string[] = [];
          const regex = /<title>(.*?)<\/title>/gi;
          let m;
          while ((m = regex.exec(xml)) !== null && items.length < 3) {
            const clean = m[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, "$1").replace(/<[^>]+>/g, "").trim();
            if (clean && !clean.toLowerCase().includes("google news")) {
              items.push(`- Breaking News: ${clean}`);
            }
          }
          return items;
        }),

      // 2. Wikipedia Search API
      fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json`, fetchOpts)
        .then((r) => r.json())
        .then((data: any) => {
          const items: string[] = [];
          const list = data?.query?.search || [];
          for (const item of list.slice(0, 2)) {
            const clean = item.snippet.replace(/<[^>]+>/g, "").replace(/&#039;/g, "'").trim();
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
    logger.warn("Web search parallel timeout / error: " + err.message);
    return "";
  }
}

/**
 * Smart detection: Only run web search when query specifically asks for latest/real-time web info
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
    "search",
  ];
  return keywords.some((k) => lower.includes(k));
}
