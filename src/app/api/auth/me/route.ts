import { NextResponse } from "next/server";
import {
  DATABASE_ENV_ERROR,
  getUserById,
  isDatabaseConfigured,
} from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      profileEmoji: user.profile_emoji,
    },
  });
}
