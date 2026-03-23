import type { BrowseBook } from "@/lib/book-types";
import { normalizeOlAuthor, normalizeOlTitle } from "@/lib/open-library";

/**
 * Resolve a title+author to the best Open Library hit (first search result).
 */
export async function resolveBookFromTitleAuthor(
  title: string,
  author: string,
): Promise<BrowseBook | null> {
  const q = `${title} ${author}`.trim();
  if (!q) return null;

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name,cover_i`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    docs?: Array<{
      title?: unknown;
      author_name?: string[];
      cover_i?: number;
    }>;
  };

  const docs = data.docs ?? [];
  for (const d of docs) {
    const t = normalizeOlTitle(d.title);
    if (!t) continue;
    const a = normalizeOlAuthor(d.author_name);
    const coverUrl =
      typeof d.cover_i === "number"
        ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
        : null;
    return { title: t, author: a, coverUrl };
  }
  return null;
}
