import { NextResponse } from "next/server";
import {
  clearUserBookData,
  DATABASE_ENV_ERROR,
  isDatabaseConfigured,
} from "@/lib/db";
import { getSession } from "@/lib/session";

export async function DELETE() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DATABASE_ENV_ERROR }, { status: 503 });
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await clearUserBookData(session.userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/user/book-data:", e);
    return NextResponse.json({ error: "Could not clear data" }, { status: 500 });
  }
}
