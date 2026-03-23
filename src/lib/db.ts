import { Pool, type PoolClient } from "pg";
import { MAX_FAVORITE_BOOKS } from "./favorite-constants";
import type { SwipeDecision } from "./swipe-decisions";

let pool: Pool | null = null;
let schemaInit: Promise<void> | null = null;

/** Shown when DB_* env vars are missing (copy .env.example → .env.local). */
export const DATABASE_ENV_ERROR =
  "Database not configured. Add DB_HOST, DB_NAME, and DB_USER to .env.local in the project root (see .env.example). Use a leading dot: .env.local — then restart the dev server.";

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.DB_HOST &&
    process.env.DB_NAME &&
    process.env.DB_USER,
  );
}

export type UserRow = {
  id: number;
  username: string;
  first_name: string | null;
  profile_emoji: string | null;
  created_at: Date;
  has_seen_welcome: boolean;
};

export type FavoriteBookRow = {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  sort_order: number;
};

const PROFILE_EMOJIS = [
  "🎧",
  "☕️",
  "🕯️",
  "📖",
  "🗝",
  "🕰",
  "📜",
  "🎞",
  "🖋️",
] as const;

export function pickProfileEmoji(): string {
  return PROFILE_EMOJIS[Math.floor(Math.random() * PROFILE_EMOJIS.length)]!;
}

function getPool(): Pool {
  if (pool) return pool;
  if (!isDatabaseConfigured()) {
    throw new Error(DATABASE_ENV_ERROR);
  }
  const host = process.env.DB_HOST!;
  pool = new Pool({
    host,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWD ?? "",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    ssl:
      process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
  });
  return pool;
}

async function ensureSchema(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(64) NOT NULL,
      first_name VARCHAR(255),
      profile_emoji VARCHAR(16),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
    ON users (LOWER(username));
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
  `);

  await client.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN NOT NULL DEFAULT TRUE;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_favorite_books (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(512) NOT NULL,
      author VARCHAR(512) NOT NULL,
      cover_url TEXT,
      sort_order SMALLINT NOT NULL CHECK (sort_order >= 0 AND sort_order < ${MAX_FAVORITE_BOOKS}),
      UNIQUE (user_id, sort_order)
    );
  `);

  await client.query(
    `ALTER TABLE user_favorite_books DROP CONSTRAINT IF EXISTS user_favorite_books_sort_order_check;`,
  );
  await client.query(
    `ALTER TABLE user_favorite_books ADD CONSTRAINT user_favorite_books_sort_order_check CHECK (sort_order >= 0 AND sort_order < ${MAX_FAVORITE_BOOKS});`,
  );

  await client.query(`
    CREATE TABLE IF NOT EXISTS recommendation_swipes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(512) NOT NULL,
      author VARCHAR(512) NOT NULL,
      cover_url TEXT,
      decision VARCHAR(32) NOT NULL CHECK (decision IN (
        'interested',
        'not_interested',
        'read_liked',
        'read_disliked'
      )),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_recommendation_swipes_user_id
    ON recommendation_swipes (user_id);
  `);
}

async function ensureSchemaOnce(): Promise<void> {
  if (schemaInit) return schemaInit;
  schemaInit = (async () => {
    const client = await getPool().connect();
    try {
      await ensureSchema(client);
    } finally {
      client.release();
    }
  })();
  return schemaInit;
}

export async function findUserByUsername(
  username: string,
): Promise<UserRow | null> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<UserRow>(
      `SELECT id, username, first_name, profile_emoji, created_at, has_seen_welcome
       FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1;`,
      [username.trim()],
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function getUserById(id: number): Promise<UserRow | null> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<UserRow>(
      `SELECT id, username, first_name, profile_emoji, created_at, has_seen_welcome
       FROM users WHERE id = $1 LIMIT 1;`,
      [id],
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function createUser(input: {
  username: string;
  firstName: string;
}): Promise<UserRow> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  const emoji = pickProfileEmoji();
  try {
    const result = await client.query<UserRow>(
      `INSERT INTO users (username, first_name, profile_emoji, has_seen_welcome)
       VALUES ($1, $2, $3, false)
       RETURNING id, username, first_name, profile_emoji, created_at, has_seen_welcome;`,
      [input.username.trim().toLowerCase(), input.firstName.trim(), emoji],
    );
    return result.rows[0]!;
  } finally {
    client.release();
  }
}

export async function countMatchesForUser(userId: number): Promise<number> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM matches WHERE user_id = $1;`,
      [userId],
    );
    return parseInt(result.rows[0]?.c ?? "0", 10);
  } finally {
    client.release();
  }
}

export async function addMatch(
  userId: number,
  title: string,
  author: string,
): Promise<{ id: number; title: string; author: string }> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<{
      id: number;
      title: string;
      author: string;
    }>(
      `INSERT INTO matches (user_id, title, author) VALUES ($1, $2, $3)
       RETURNING id, title, author;`,
      [userId, title, author],
    );
    return result.rows[0]!;
  } finally {
    client.release();
  }
}

export async function removeMatch(
  userId: number,
  title: string,
): Promise<{ title: string } | null> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<{ title: string }>(
      `DELETE FROM matches WHERE user_id = $1 AND title = $2 RETURNING title;`,
      [userId, title],
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function removeMatchById(
  userId: number,
  matchId: number,
): Promise<{ id: number } | null> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<{ id: number }>(
      `DELETE FROM matches WHERE user_id = $1 AND id = $2 RETURNING id;`,
      [userId, matchId],
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function getAllMatchesForUser(
  userId: number,
): Promise<Array<{ id: number; title: string; author: string }>> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<{
      id: number;
      title: string;
      author: string;
    }>(
      `SELECT id, title, author FROM matches
       WHERE user_id = $1 ORDER BY created_at DESC;`,
      [userId],
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function findMatchForUser(
  userId: number,
  title: string,
): Promise<{ id: number; title: string; author: string } | null> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<{
      id: number;
      title: string;
      author: string;
    }>(
      `SELECT id, title, author FROM matches
       WHERE user_id = $1 AND title ILIKE $2 LIMIT 1;`,
      [userId, `%${title}%`],
    );
    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function markWelcomeSeen(userId: number): Promise<void> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    await client.query(
      `UPDATE users SET has_seen_welcome = true WHERE id = $1;`,
      [userId],
    );
  } finally {
    client.release();
  }
}

export async function getFavoriteBooksForUser(
  userId: number,
): Promise<FavoriteBookRow[]> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<FavoriteBookRow>(
      `SELECT id, title, author, cover_url, sort_order
       FROM user_favorite_books WHERE user_id = $1 ORDER BY sort_order ASC;`,
      [userId],
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function replaceFavoriteBooks(
  userId: number,
  books: Array<{ title: string; author: string; coverUrl: string | null }>,
): Promise<void> {
  await ensureSchemaOnce();
  const slice = books.slice(0, MAX_FAVORITE_BOOKS);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM user_favorite_books WHERE user_id = $1;`, [
      userId,
    ]);
    for (let i = 0; i < slice.length; i++) {
      const b = slice[i]!;
      await client.query(
        `INSERT INTO user_favorite_books (user_id, title, author, cover_url, sort_order)
         VALUES ($1, $2, $3, $4, $5);`,
        [userId, b.title, b.author, b.coverUrl, i],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteUserById(userId: number): Promise<void> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    await client.query(`DELETE FROM users WHERE id = $1;`, [userId]);
  } finally {
    client.release();
  }
}

export async function insertRecommendationSwipe(
  userId: number,
  book: { title: string; author: string; coverUrl: string | null },
  decision: SwipeDecision,
): Promise<void> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    await client.query(
      `INSERT INTO recommendation_swipes (user_id, title, author, cover_url, decision)
       VALUES ($1, $2, $3, $4, $5);`,
      [userId, book.title, book.author, book.coverUrl, decision],
    );
  } finally {
    client.release();
  }
}

/** Books already shown in the swipe deck (any decision)—exclude from new batches. */
export async function getSwipedBooksForRecommendations(
  userId: number,
): Promise<Array<{ title: string; author: string }>> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<{ title: string; author: string }>(
      `SELECT DISTINCT title, author FROM recommendation_swipes WHERE user_id = $1;`,
      [userId],
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function matchExistsForUser(
  userId: number,
  title: string,
): Promise<boolean> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    const result = await client.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM matches
       WHERE user_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2));`,
      [userId, title],
    );
    return parseInt(result.rows[0]?.c ?? "0", 10) > 0;
  } finally {
    client.release();
  }
}

/** Clears favorites, matches, and recommendation swipe history (keeps the account). */
export async function clearUserBookData(userId: number): Promise<void> {
  await ensureSchemaOnce();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM recommendation_swipes WHERE user_id = $1;`, [
      userId,
    ]);
    await client.query(`DELETE FROM user_favorite_books WHERE user_id = $1;`, [
      userId,
    ]);
    await client.query(`DELETE FROM matches WHERE user_id = $1;`, [userId]);
    await client.query("COMMIT");
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}
