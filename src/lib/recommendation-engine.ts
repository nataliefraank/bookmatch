/** Shared server-side checks for Groq vs Open Library recommendation paths. */

export function truthyEnv(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

/** True when the server will call Groq first (flag + API key). */
export function useGroqRecommendations(): boolean {
  return (
    truthyEnv(process.env.RECOMMENDATIONS_USE_GROQ) &&
    Boolean(process.env.GROQ_API_KEY?.trim())
  );
}

/** Shown in UI/API when Groq is expected but the key is missing. */
export function groqSetupHint(): string | null {
  const want = truthyEnv(process.env.RECOMMENDATIONS_USE_GROQ);
  const hasKey = Boolean(process.env.GROQ_API_KEY?.trim());
  if (want && !hasKey) {
    return "RECOMMENDATIONS_USE_GROQ is enabled but GROQ_API_KEY is missing. Add it to .env.local and restart the dev server.";
  }
  return null;
}
