import { NextResponse } from "next/server";
import type { BrowseBook } from "@/lib/book-types";
import { DATABASE_ENV_ERROR, isDatabaseConfigured } from "@/lib/db";
import { normalizeOlAuthor, normalizeOlTitle } from "@/lib/open-library";
import { getSession } from "@/lib/session";

/** Eight popular-ish starting picks (fiction search, deduped). */
const OL =
  "https://openlibrary.org/search.json?q=fiction&limit=24&fields=title,author_name,cover_i";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(OL, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Book catalog temporarily unavailable" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as {
      docs?: Array<{
        title?: unknown;
        author_name?: string[];
        cover_i?: number;
      }>;
    };
    const docs = data.docs ?? [];
    const books: BrowseBook[] = [];
    const seen = new Set<string>();
    for (const d of docs) {
      const title = normalizeOlTitle(d.title);
      if (!title) continue;
      const author = normalizeOlAuthor(d.author_name);
      const key = `${title.toLowerCase()}|${author.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const coverUrl =
        typeof d.cover_i === "number"
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
          : null;
      books.push({ title, author, coverUrl });
      if (books.length >= 8) break;
    }
    return NextResponse.json({ books });
  } catch (e) {
    console.error("GET /api/books/browse:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
