import { NextResponse } from "next/server";
import {
  DATABASE_ENV_ERROR,
  createUser,
  findUserByUsername,
  isDatabaseConfigured,
} from "@/lib/db";
import { setSessionCookie, signSession } from "@/lib/session";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/;

function validFirstName(s: string): boolean {
  const t = s.trim();
  return t.length >= 1 && t.length <= 80;
}

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
    }

    const body = await request.json();
    const rawUser =
      typeof body.username === "string" ? body.username.trim() : "";
    const firstName =
      typeof body.firstName === "string" ? body.firstName : "";

    if (!USERNAME_RE.test(rawUser)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3–32 characters: letters, numbers, underscores, or hyphens.",
        },
        { status: 400 },
      );
    }

    if (!validFirstName(firstName)) {
      return NextResponse.json(
        { error: "Please enter a first name (1–80 characters)." },
        { status: 400 },
      );
    }

    const username = rawUser.toLowerCase();

    const existing = await findUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { error: "That username was just taken. Try another." },
        { status: 409 },
      );
    }

    const user = await createUser({ username, firstName });
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

    return NextResponse.json({
      ok: true,
      redirect: "/pages/welcome",
      user: {
        username: user.username,
        firstName: user.first_name,
        profileEmoji: user.profile_emoji,
      },
    });
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "That username is already registered." },
        { status: 409 },
      );
    }
    const message = err.message ?? "";
    if (message === DATABASE_ENV_ERROR || message.includes("Database not configured")) {
      return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
    }
    console.error("auth/register:", e);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 },
    );
  }
}
