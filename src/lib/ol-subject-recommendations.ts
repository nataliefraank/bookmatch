import type { BrowseBook } from "@/lib/book-types";
import { bookKey } from "@/lib/book-keys";
import { normalizeOlAuthor, normalizeOlTitle } from "@/lib/open-library";
import { resolveBookFromTitleAuthor } from "@/lib/open-library-resolve";

type FavoriteInput = { title: string; author: string };

const TARGET = 10;
const OL_DELAY_MS = 100;
/** Open Library subject pages list popular works first—same author can dominate. */
const MAX_BOOKS_PER_AUTHOR = 1;

/** Normalize author so "L. Frank Baum" and "L Frank Baum" count as one. */
function authorKey(author: string): string {
  return author
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
}

function slugifySubject(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Order subject slugs by how often they appear across the user's books (genre-agnostic).
 */
function rankSubjectSlugsByFrequency(subjectLabels: string[]): string[] {
  const counts = new Map<string, number>();
  for (const raw of subjectLabels) {
    const slug = slugifySubject(raw);
    if (slug.length < 2) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([slug]) => slug);
}

/**
 * Pull subject tags from Open Library search hits for the user's favorites.
 * @see https://openlibrary.org/dev/docs/api/subjects
 */
async function collectSubjectsFromFavorites(
  favorites: FavoriteInput[],
): Promise<string[]> {
  const out: string[] = [];
  const maxQueries = Math.min(6, favorites.length);
  for (let i = 0; i < maxQueries; i++) {
    const f = favorites[i]!;
    const q = `${f.title} ${f.author}`.trim();
    if (!q) continue;
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=subject,title,author_name`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as {
      docs?: Array<{ subject?: unknown }>;
    };
    for (const d of data.docs ?? []) {
      const sub = d.subject;
      if (Array.isArray(sub)) {
        for (const s of sub) {
          if (typeof s === "string" && s.trim()) out.push(s.trim());
        }
      } else if (typeof sub === "string" && sub.trim()) {
        out.push(sub.trim());
      }
    }
    await new Promise((r) => setTimeout(r, OL_DELAY_MS));
  }
  return out;
}

type SubjectWorksResponse = {
  works?: Array<{
    title?: string;
    authors?: Array<{ name?: string }>;
  }>;
};

async function fetchWorksForSubjectSlug(
  slug: string,
  limit: number,
  offset: number,
): Promise<NonNullable<SubjectWorksResponse["works"]>> {
  const url = `https://openlibrary.org/subjects/${encodeURIComponent(slug)}.json?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as SubjectWorksResponse;
  const works = data.works ?? [];
  shuffleInPlace(works);
  return works;
}

/** Broad defaults when OL returns no subject tags (any genre). */
const DEFAULT_SUBJECT_SLUGS = [
  "fiction",
  "mystery",
  "fantasy",
  "science_fiction",
  "romance",
  "history",
  "biography",
  "young_adult_fiction",
  "literary_fiction",
  "poetry",
];

/**
 * Free, quota-free recommendations: derive subject tags from favorites, then
 * load works from the Subjects API and resolve covers via search.
 * Enforces author diversity so one prolific author cannot fill the deck.
 */
export async function fetchRecommendationsFromOpenLibrarySubjects(
  favorites: FavoriteInput[],
  extraExclude: FavoriteInput[] = [],
): Promise<BrowseBook[]> {
  const exclude = new Set(
    [...favorites, ...extraExclude].map((f) =>
      bookKey(f.title, f.author),
    ),
  );

  const subjectCandidates = await collectSubjectsFromFavorites(favorites);
  let slugList = rankSubjectSlugsByFrequency(subjectCandidates);
  if (slugList.length === 0) {
    slugList = [...DEFAULT_SUBJECT_SLUGS];
    shuffleInPlace(slugList);
  }

  const books: BrowseBook[] = [];
  const seenTitles = new Set<string>();
  const authorsUsed = new Map<string, number>();

  function canUseAuthor(author: string): boolean {
    const k = authorKey(author);
    return (authorsUsed.get(k) ?? 0) < MAX_BOOKS_PER_AUTHOR;
  }

  function recordAuthor(author: string): void {
    const k = authorKey(author);
    authorsUsed.set(k, (authorsUsed.get(k) ?? 0) + 1);
  }

  const offsetJitter = Math.floor(Math.random() * 180);

  outer: for (let si = 0; si < slugList.length && books.length < TARGET; si++) {
    const slug = slugList[si]!;
    const offset = (offsetJitter + si * 37) % 200;
    const works = await fetchWorksForSubjectSlug(slug, 50, offset);
    await new Promise((r) => setTimeout(r, OL_DELAY_MS));

    let addedFromThisSlug = 0;
    const maxPerSlugBeforeRotate = 4;

    for (const w of works) {
      if (books.length >= TARGET) break outer;
      if (addedFromThisSlug >= maxPerSlugBeforeRotate) break;

      const title = typeof w.title === "string" ? w.title.trim() : "";
      const author =
        typeof w.authors?.[0]?.name === "string"
          ? w.authors[0]!.name!.trim()
          : "";
      if (!title || !author) continue;
      if (!canUseAuthor(author)) continue;

      const k = bookKey(title, author);
      if (exclude.has(k) || seenTitles.has(k)) continue;

      const resolved = await resolveBookFromTitleAuthor(title, author);
      await new Promise((r) => setTimeout(r, OL_DELAY_MS));
      if (!resolved) continue;

      if (!canUseAuthor(resolved.author)) continue;
      const rk = bookKey(resolved.title, resolved.author);
      if (exclude.has(rk) || seenTitles.has(rk)) continue;

      seenTitles.add(rk);
      recordAuthor(resolved.author);
      books.push(resolved);
      addedFromThisSlug++;
    }
  }

  if (books.length < TARGET) {
    const page = 1 + Math.floor(Math.random() * 8);
    const fallbackQueries = [
      "fiction",
      "novel",
      "mystery",
      "fantasy",
      "science fiction",
      "biography",
    ];
    const qq =
      fallbackQueries[Math.floor(Math.random() * fallbackQueries.length)]!;
    const q = `https://openlibrary.org/search.json?q=${encodeURIComponent(qq)}&limit=50&fields=title,author_name,cover_i&page=${page}`;
    const res = await fetch(q, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        docs?: Array<{
          title?: unknown;
          author_name?: string[];
          cover_i?: number;
        }>;
      };
      const docs = [...(data.docs ?? [])];
      shuffleInPlace(docs);
      for (const d of docs) {
        if (books.length >= TARGET) break;
        const t = normalizeOlTitle(d.title);
        if (!t) continue;
        const a = normalizeOlAuthor(d.author_name);
        if (!canUseAuthor(a)) continue;
        const k = bookKey(t, a);
        if (exclude.has(k) || seenTitles.has(k)) continue;
        seenTitles.add(k);
        recordAuthor(a);
        const coverUrl =
          typeof d.cover_i === "number"
            ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
            : null;
        books.push({ title: t, author: a, coverUrl });
      }
    }
  }

  return books.slice(0, TARGET);
}
