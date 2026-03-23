import { NextResponse } from "next/server";
import {
  DATABASE_ENV_ERROR,
  isDatabaseConfigured,
  markWelcomeSeen,
} from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await markWelcomeSeen(session.userId);
    return NextResponse.json({ ok: true, redirect: "/pages/home" });
  } catch (e) {
    console.error("welcome-complete:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
