-- Bookmatch: users and per-user book matches (PostgreSQL)
-- Run once against your local database, e.g.:
--   psql -U postgres -d bookmatch -f sql/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  first_name VARCHAR(255),
  profile_emoji VARCHAR(16),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
  ON users (LOWER(username));

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS user_favorite_books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(512) NOT NULL,
  author VARCHAR(512) NOT NULL,
  cover_url TEXT,
  sort_order SMALLINT NOT NULL CHECK (sort_order >= 0 AND sort_order < 15),
  UNIQUE (user_id, sort_order)
);

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

CREATE INDEX IF NOT EXISTS idx_recommendation_swipes_user_id
  ON recommendation_swipes (user_id);

-- Example queries (also used by the app via node-pg):

-- Find user by username (case-insensitive)
-- SELECT id, username, first_name, profile_emoji, created_at
-- FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1;

-- Create user after onboarding
-- INSERT INTO users (username, first_name, profile_emoji)
-- VALUES ($1, $2, $3)
-- RETURNING id, username, first_name, profile_emoji, created_at;

-- Count books (matches) for a user
-- SELECT COUNT(*)::int FROM matches WHERE user_id = $1;

-- List matches for the signed-in user
-- SELECT id, title, author FROM matches WHERE user_id = $1 ORDER BY created_at DESC;

-- Add a matched book for the current user
-- INSERT INTO matches (user_id, title, author) VALUES ($1, $2, $3) RETURNING id, title, author;
