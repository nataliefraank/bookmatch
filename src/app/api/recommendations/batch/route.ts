import { NextResponse } from "next/server";
import { bookKey } from "@/lib/book-keys";
import {
  DATABASE_ENV_ERROR,
  getFavoriteBooksForUser,
  getSwipedBooksForRecommendations,
  isDatabaseConfigured,
} from "@/lib/db";
import { fetchSimilarBookTitles } from "@/lib/groq-recommendations";
import type { BrowseBook } from "@/lib/book-types";
import { fetchRecommendationsFromOpenLibrarySubjects } from "@/lib/ol-subject-recommendations";
import {
  groqSetupHint,
  useGroqRecommendations,
} from "@/lib/recommendation-engine";
import { resolveBookFromTitleAuthor } from "@/lib/open-library-resolve";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function isLikelyQuotaError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /429|quota|Too Many Requests|rate_limit|free_tier/i.test(msg);
}

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await getFavoriteBooksForUser(session.userId);
  if (favorites.length === 0) {
    return NextResponse.json(
      {
        error: "Add favorite books on the home page first.",
        books: [] as BrowseBook[],
      },
      { status: 400 },
    );
  }

  const favPayload = favorites.map((f) => ({
    title: f.title,
    author: f.author,
  }));

  const swiped = await getSwipedBooksForRecommendations(session.userId);
  const excludeSet = new Set<string>();
  for (const f of favPayload) excludeSet.add(bookKey(f.title, f.author));
  for (const s of swiped) excludeSet.add(bookKey(s.title, s.author));

  const hint = groqSetupHint();
  const groqOn = useGroqRecommendations();

  if (groqOn) {
    try {
      const suggestions = await fetchSimilarBookTitles(favPayload);
      const filtered = suggestions.filter(
        (s) => !excludeSet.has(bookKey(s.title, s.author)),
      );
      const books: BrowseBook[] = [];
      for (const s of filtered) {
        const b = await resolveBookFromTitleAuthor(s.title, s.author);
        if (b && !excludeSet.has(bookKey(b.title, b.author))) {
          books.push(b);
        }
        await new Promise((r) => setTimeout(r, 120));
      }
      if (books.length > 0) {
        return NextResponse.json({
          books,
          source: "groq" as const,
          groqFallback: false,
          setupHint: hint,
        });
      }
      console.warn(
        "Groq returned no resolvable books; falling back to Open Library.",
      );
    } catch (e) {
      const quota = isLikelyQuotaError(e);
      console.warn(
        quota
          ? "Groq quota or error; falling back to Open Library subjects."
          : "Groq failed; falling back to Open Library subjects.",
        e,
      );
    }
  }

  try {
    const books = await fetchRecommendationsFromOpenLibrarySubjects(
      favPayload,
      swiped,
    );
    if (books.length === 0) {
      return NextResponse.json(
        {
          error: "Could not build recommendations from Open Library. Try again.",
          books: [] as BrowseBook[],
          source: "openlibrary" as const,
          groqFallback: groqOn,
          setupHint: hint,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({
      books,
      source: "openlibrary" as const,
      groqFallback: groqOn,
      setupHint: hint,
    });
  } catch (e) {
    console.error("POST /api/recommendations/batch (Open Library):", e);
    const msg = e instanceof Error ? e.message : "Recommendations failed";
    return NextResponse.json(
      {
        error: msg,
        books: [] as BrowseBook[],
        source: "openlibrary" as const,
        groqFallback: groqOn,
        setupHint: hint,
      },
      { status: 503 },
    );
  }
}
