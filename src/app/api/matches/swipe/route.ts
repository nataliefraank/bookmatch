import { NextResponse } from "next/server";
import {
  addMatch,
  DATABASE_ENV_ERROR,
  insertRecommendationSwipe,
  isDatabaseConfigured,
  matchExistsForUser,
} from "@/lib/db";
import { isSwipeDecision } from "@/lib/swipe-decisions";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const author = typeof o.author === "string" ? o.author.trim() : "";
  const coverUrl =
    typeof o.coverUrl === "string" && o.coverUrl.length > 0
      ? o.coverUrl.slice(0, 2048)
      : null;
  const decisionRaw = o.decision;
  const decision =
    typeof decisionRaw === "string" ? decisionRaw.trim() : "";

  if (!title || !author || !isSwipeDecision(decision)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await insertRecommendationSwipe(
    session.userId,
    { title, author, coverUrl },
    decision,
  );

  if (decision === "interested") {
    const exists = await matchExistsForUser(session.userId, title);
    if (!exists) {
      await addMatch(
        session.userId,
        title.slice(0, 255),
        author.slice(0, 255),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
