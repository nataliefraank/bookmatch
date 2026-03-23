export type FavoriteInput = { title: string; author: string };

export type SuggestedBook = { title: string; author: string };

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Per-book cap in the prompt only — keeps input tokens small. */
const MAX_TITLE_IN_PROMPT = 80;
const MAX_AUTHOR_IN_PROMPT = 48;

/** Books per LLM call; swipe loads another batch after the deck. */
const SUGGESTIONS_PER_CALL: number = 5;

function compactFavorites(favorites: FavoriteInput[]): string {
  if (favorites.length === 0) return "";
  return favorites
    .map((f) => {
      const t = f.title.slice(0, MAX_TITLE_IN_PROMPT);
      const a = f.author.slice(0, MAX_AUTHOR_IN_PROMPT);
      return `${t} by ${a}`;
    })
    .join("; ");
}

/**
 * Ask Groq (OpenAI-compatible chat) for book recommendations as JSON.
 * Requires GROQ_API_KEY in the environment.
 */
export async function fetchSimilarBookTitles(
  favorites: FavoriteInput[],
): Promise<SuggestedBook[]> {
  const key = process.env.GROQ_API_KEY;
  if (!key?.trim()) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const model =
    process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

  const data = compactFavorites(favorites);
  const prompt = `Recommend ${SUGGESTIONS_PER_CALL} book${SUGGESTIONS_PER_CALL === 1 ? "" : "s"} based on:\n${data || "—"}\n\nMatch genre, tone, and audience of those books. Do not repeat them. Avoid unrelated genres.\nReply with JSON only in this exact shape: {"r":[{"t":"title","a":"author"}]}`;

  const debugLog =
    process.env.GROQ_DEBUG_LOG === "true" ||
    process.env.NODE_ENV === "development";
  if (debugLog) {
    console.log("[Groq recommendations] PROMPT:\n", prompt);
  }

  const maxTokens = SUGGESTIONS_PER_CALL <= 1 ? 256 : 1024;

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  const rawBody = await res.text();
  if (!res.ok) {
    throw new Error(
      `Groq API ${res.status}: ${rawBody.slice(0, 800)}`,
    );
  }

  let text = "";
  try {
    const parsed = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    text = parsed.choices?.[0]?.message?.content ?? "";
  } catch {
    throw new Error("Groq returned non-JSON body");
  }

  if (debugLog) {
    console.log("[Groq recommendations] RAW RESPONSE TEXT:\n", text);
  }

  const json = extractJsonObject(text) ?? text.trim();
  if (!json) {
    throw new Error("Could not parse Groq response");
  }
  const parsedJson = JSON.parse(json) as Record<string, unknown>;
  let raw: unknown = parsedJson.r ?? parsedJson.recommendations;
  if (!Array.isArray(raw)) {
    const o = parsedJson as Record<string, unknown>;
    const hasPair =
      (typeof o.t === "string" || typeof o.title === "string") &&
      (typeof o.a === "string" || typeof o.author === "string");
    raw = hasPair ? [parsedJson] : null;
  }
  if (!Array.isArray(raw)) {
    throw new Error("Invalid Groq JSON shape");
  }
  const out: SuggestedBook[] = [];
  for (const item of raw) {
    if (out.length >= SUGGESTIONS_PER_CALL) break;
    const o = item as Record<string, unknown>;
    const title =
      (typeof o.t === "string" ? o.t : typeof o.title === "string" ? o.title : "")
        .trim();
    const author =
      (typeof o.a === "string" ? o.a : typeof o.author === "string" ? o.author : "")
        .trim();
    if (title && author) {
      out.push({ title: title.slice(0, 512), author: author.slice(0, 512) });
    }
  }
  if (debugLog) {
    console.log(
      "[Groq recommendations] PARSED SUGGESTIONS (title — author):",
      out.map((b) => `${b.title} — ${b.author}`),
    );
  }
  return out;
}

function extractJsonObject(text: string): string | null {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const candidate = fence ? fence[1]!.trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}
