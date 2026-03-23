import { NextResponse } from "next/server";
import {
  DATABASE_ENV_ERROR,
  findUserByUsername,
  isDatabaseConfigured,
} from "@/lib/db";
import { setSessionCookie, signSession } from "@/lib/session";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/;

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
    }

    const body = await request.json();
    const raw = typeof body.username === "string" ? body.username.trim() : "";
    if (!USERNAME_RE.test(raw)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3–32 characters: letters, numbers, underscores, or hyphens.",
        },
        { status: 400 },
      );
    }

    const username = raw.toLowerCase();
    const user = await findUserByUsername(username);

    if (user) {
      let token: string;
      try {
        token = signSession({ userId: user.id, username: user.username });
      } catch {
        return NextResponse.json(
          { error: "Server misconfiguration (SESSION_SECRET)." },
          { status: 500 },
        );
      }
      await setSessionCookie(token);
      const redirect = user.has_seen_welcome
        ? "/pages/home"
        : "/pages/welcome";
      return NextResponse.json({
        ok: true,
        needsOnboarding: false,
        redirect,
      });
    }

    return NextResponse.json({
      ok: true,
      needsOnboarding: true,
      username,
    });
  } catch (e) {
    console.error("auth/lookup:", e);
    const message = e instanceof Error ? e.message : "";
    if (message === DATABASE_ENV_ERROR || message.includes("Database not configured")) {
      return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 },
    );
  }
}
