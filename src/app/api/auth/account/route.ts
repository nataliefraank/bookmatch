import { NextResponse } from "next/server";
import {
  DATABASE_ENV_ERROR,
  deleteUserById,
  isDatabaseConfigured,
} from "@/lib/db";
import { clearSessionCookie, getSession } from "@/lib/session";

export async function DELETE() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await deleteUserById(session.userId);
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/auth/account:", e);
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }
}
