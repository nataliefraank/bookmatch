/**
 * Session-scoped user cache with a 30-minute TTL. SessionStorage is cleared when
 * the tab/window closes; entries also expire after 30 minutes.
 */

const STORAGE_KEY = "bm_user_cache_v1";
const TTL_MS = 30 * 60 * 1000;

export type CachedUser = {
  username: string;
  firstName: string | null;
};

export type CachedFavorite = {
  title: string;
  author: string;
  coverUrl: string | null;
};

type CachePayload = {
  favorites: CachedFavorite[];
  user: CachedUser | null;
  expiresAt: number;
};

function parse(raw: string | null): CachePayload | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as CachePayload;
    if (typeof c.expiresAt !== "number") return null;
    if (Date.now() > c.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return c;
  } catch {
    return null;
  }
}

export function readUserCache(): CachePayload | null {
  if (typeof window === "undefined") return null;
  return parse(sessionStorage.getItem(STORAGE_KEY));
}

export function writeUserCache(partial: {
  favorites?: CachedFavorite[];
  user?: CachedUser | null;
}): void {
  if (typeof window === "undefined") return;
  const prev = parse(sessionStorage.getItem(STORAGE_KEY));
  const next: CachePayload = {
    favorites: partial.favorites ?? prev?.favorites ?? [],
    user: partial.user !== undefined ? partial.user : prev?.user ?? null,
    expiresAt: Date.now() + TTL_MS,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function clearUserCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
