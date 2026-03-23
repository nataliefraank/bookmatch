import { NextResponse } from "next/server";
import {
  DATABASE_ENV_ERROR,
  getFavoriteBooksForUser,
  isDatabaseConfigured,
  replaceFavoriteBooks,
} from "@/lib/db";
import { MAX_FAVORITE_BOOKS } from "@/lib/favorite-constants";
import { getSession } from "@/lib/session";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const books = await getFavoriteBooksForUser(session.userId);
    return NextResponse.json({ books });
  } catch (e) {
    console.error("GET /api/favorite-books:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

type BookPayload = { title: string; author: string; coverUrl: string | null };

export async function PUT(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const raw = body.books;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "books array required" }, { status: 400 });
    }
    const books: BookPayload[] = raw.slice(0, MAX_FAVORITE_BOOKS).map((b: unknown) => {
      const o = b as Record<string, unknown>;
      return {
        title: typeof o.title === "string" ? o.title.slice(0, 512) : "",
        author: typeof o.author === "string" ? o.author.slice(0, 512) : "",
        coverUrl:
          typeof o.coverUrl === "string" && o.coverUrl.length > 0
            ? o.coverUrl.slice(0, 2048)
            : null,
      };
    });
    const valid = books.filter((b) => b.title.length > 0 && b.author.length > 0);
    await replaceFavoriteBooks(session.userId, valid);
    return NextResponse.json({ ok: true, count: valid.length });
  } catch (e) {
    console.error("PUT /api/favorite-books:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
