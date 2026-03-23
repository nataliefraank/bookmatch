/** Open Library search docs often use string or string[] for `title`. */
export function normalizeOlTitle(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) {
    const s = raw.find((x) => typeof x === "string") as string | undefined;
    return s ? s.trim() : "";
  }
  return "";
}

export function normalizeOlAuthor(authorName: string[] | undefined): string {
  const a = authorName?.[0];
  return typeof a === "string" && a.trim() ? a.trim() : "Unknown Author";
}
