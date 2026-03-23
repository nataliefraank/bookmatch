# Bookmatch

Bookmatch is a **Next.js** app where users pick favorite books, get **recommendations** (Groq LLM and/or **Open Library**), swipe on suggestions, and keep an “interested” list on their profile. Covers and metadata come from Open Library.

## Stack

- **Next.js 15** (App Router), React, TypeScript, Tailwind CSS  
- **PostgreSQL** via `pg` (schema is created on first use)  
- **Cookie session** signed with `SESSION_SECRET`  
- **Optional Groq** for suggested titles; **Open Library** for subjects, search, and covers  

## Configure

1. **Clone** the repo and install dependencies:

   ```bash
   npm install
   ```

2. **Environment** — copy the example env file to `.env.local` in the project root (note the leading dot) and fill in values:

   ```bash
   cp .env.example .env.local
   ```

3. **Required for full app behavior**

   | Variable | Purpose |
   |----------|---------|
   | `DB_HOST`, `DB_NAME`, `DB_USER` | PostgreSQL connection |
   | `DB_PORT` | Optional; default `5432` |
   | `DB_PASSWD` | If your DB role uses a password |
   | `DB_SSL` | Set `true` only if the server requires SSL |
   | `SESSION_SECRET` | Long random string for signing the session cookie |

4. **Recommendations (optional)**

   | Variable | Purpose |
   |----------|---------|
   | `RECOMMENDATIONS_USE_GROQ` | `true` to try Groq first, then fall back to Open Library |
   | `GROQ_API_KEY` | From [Groq](https://console.groq.com/) |
   | `GROQ_MODEL` | Optional; e.g. `llama-3.3-70b-versatile` |
   | `GROQ_DEBUG_LOG` | `true` for server logs of prompts/responses (also on in development) |

   If Groq is off or fails, the app uses **Open Library** subject search from the user’s favorites (no API key).

5. **Run**

   ```bash
   npm run dev
   ```

   Open the URL shown in the terminal (usually `http://localhost:3000`).

## Scripts

- `npm run dev` — development server  
- `npm run build` / `npm run start` — production build and start  

## License / attributions

Book data and covers are attributed on the in-app **Attributions** page (Open Library; Groq when enabled).
