import { NextRequest } from "next/server";
import {
  DATABASE_ENV_ERROR,
  addMatch,
  findMatchForUser,
  getAllMatchesForUser,
  isDatabaseConfigured,
  removeMatch,
  removeMatchById,
} from "@/lib/db";
import { getSession } from "@/lib/session";

async function requireUser() {
  const session = await getSession();
  if (!session) return null;
  return session;
}

function dbUnavailable() {
  return new Response(JSON.stringify({ error: DATABASE_ENV_ERROR }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return dbUnavailable();
  }
  const session = await requireUser();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");

  try {
    if (title) {
      const matchFound = await findMatchForUser(session.userId, title);
      return new Response(JSON.stringify(matchFound), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const matches = await getAllMatchesForUser(session.userId);
    return new Response(JSON.stringify(matches), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET /api/matches:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return dbUnavailable();
  }
  const session = await requireUser();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { title, author } = body;
    if (typeof title !== "string" || typeof author !== "string") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const row = await addMatch(session.userId, title, author);
    return new Response(JSON.stringify(row), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("POST /api/matches:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) {
    return dbUnavailable();
  }
  const session = await requireUser();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const idRaw = body.id;
    const id =
      typeof idRaw === "number"
        ? idRaw
        : typeof idRaw === "string"
          ? parseInt(idRaw, 10)
          : NaN;
    const title =
      typeof body.title === "string" ? body.title.trim() : null;

    if (Number.isInteger(id) && id > 0) {
      const removed = await removeMatchById(session.userId, id);
      return new Response(JSON.stringify(removed ?? { id: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (title) {
      const removed = await removeMatch(session.userId, title);
      return new Response(JSON.stringify(removed ?? { title: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "id or title required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("DELETE /api/matches:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
