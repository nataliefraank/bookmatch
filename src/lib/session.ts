import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

export { SESSION_COOKIE_NAME };

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET must be set to a random string (at least 16 characters)",
    );
  }
  return s;
}

export function signSession(payload: {
  userId: number;
  username: string;
}): string {
  const exp = Date.now() + MAX_AGE_MS;
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp }),
  ).toString("base64url");
  const sig = createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(
  token: string,
): { userId: number; username: string } | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = createHmac("sha256", secret)
      .update(body)
      .digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      userId: number;
      username: string;
      exp: number;
    };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    if (typeof data.userId !== "number" || typeof data.username !== "string")
      return null;
    return { userId: data.userId, username: data.username };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{
  userId: number;
  username: string;
} | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(MAX_AGE_MS / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
