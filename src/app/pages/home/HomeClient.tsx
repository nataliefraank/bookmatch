"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import type { BrowseBook } from "@/lib/book-types";
import { readUserCache, writeUserCache } from "@/lib/user-cache";
import { MAX_FAVORITE_BOOKS } from "@/lib/favorite-constants";
import PickBookCard, { type PickBook } from "./PickBookCard";

function keyOf(b: PickBook) {
  return `${b.title}::${b.author}`;
}

const SEARCH_PREVIEW = 8;

export default function HomeClient() {
  const [fullCatalog, setFullCatalog] = useState<BrowseBook[]>([]);
  const popularCache = useRef<BrowseBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PickBook[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchShowAll, setSearchShowAll] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTouched = useRef(false);
  const loadComplete = useRef(false);
  const prevSelectedCount = useRef(0);
  const [initialReady, setInitialReady] = useState(false);
  const [maxHint, setMaxHint] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setSearchShowAll(false);
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      loadComplete.current = false;
      try {
        const cached = readUserCache();
        const [browseRes, favRes, meRes] = await Promise.all([
          fetch("/api/books/browse"),
          fetch("/api/favorite-books"),
          fetch("/api/auth/me"),
        ]);

        if (meRes.ok) {
          const meJson = (await meRes.json()) as {
            user: {
              username: string;
              firstName: string | null;
            } | null;
          };
          if (meJson.user) {
            writeUserCache({
              user: {
                username: meJson.user.username,
                firstName: meJson.user.firstName,
              },
            });
          }
        }

        if (!browseRes.ok) {
          const j = await browseRes.json().catch(() => ({}));
          throw new Error(j.error || "Could not load books");
        }
        const browseJson = (await browseRes.json()) as { books: BrowseBook[] };
        const list = browseJson.books ?? [];
        popularCache.current = list;
        if (!cancelled) {
          setFullCatalog(list);
        }

        let applied: PickBook[] | null = null;
        if (favRes.ok) {
          const favJson = (await favRes.json()) as {
            books: Array<{
              title: string;
              author: string;
              cover_url: string | null;
            }>;
          };
          const fromApi: PickBook[] = (favJson.books ?? []).map((r) => ({
            title: r.title,
            author: r.author,
            coverUrl: r.cover_url,
          }));
          if (fromApi.length > 0) {
            applied = fromApi;
          }
        }
        if (!applied && cached?.favorites?.length) {
          applied = cached.favorites.map((f) => ({
            title: f.title,
            author: f.author,
            coverUrl: f.coverUrl,
          }));
        }
        if (!cancelled && applied && applied.length > 0) {
          setSelected(applied);
          userTouched.current = true;
          writeUserCache({
            favorites: applied.map((b) => ({
              title: b.title,
              author: b.author,
              coverUrl: b.coverUrl,
            })),
          });
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Load failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          loadComplete.current = true;
          setInitialReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialReady) return;
    if (debouncedSearch.length < 2) {
      setFullCatalog(popularCache.current);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/books/search?q=${encodeURIComponent(debouncedSearch)}`,
        );
        const j = (await res.json()) as { books?: BrowseBook[]; error?: string };
        if (!res.ok) throw new Error(j.error || "Search failed");
        if (!cancelled) {
          setFullCatalog(j.books ?? []);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Search failed");
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, initialReady]);

  const isSearchActive = debouncedSearch.length >= 2;

  const visibleCatalog = useMemo(() => {
    if (!isSearchActive || fullCatalog.length <= SEARCH_PREVIEW || searchShowAll) {
      return fullCatalog;
    }
    return fullCatalog.slice(0, SEARCH_PREVIEW);
  }, [fullCatalog, isSearchActive, searchShowAll]);

  const selectedKeys = useMemo(
    () => new Set(selected.map(keyOf)),
    [selected],
  );

  useEffect(() => {
    if (
      selected.length === MAX_FAVORITE_BOOKS &&
      prevSelectedCount.current < MAX_FAVORITE_BOOKS
    ) {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    }
    prevSelectedCount.current = selected.length;
  }, [selected.length]);

  const toggle = useCallback((book: PickBook) => {
    userTouched.current = true;
    const k = keyOf(book);
    setSelected((prev) => {
      const has = prev.some((p) => keyOf(p) === k);
      if (has) {
        queueMicrotask(() => setMaxHint(false));
        return prev.filter((p) => keyOf(p) !== k);
      }
      if (prev.length >= MAX_FAVORITE_BOOKS) {
        queueMicrotask(() => {
          setMaxHint(true);
          window.setTimeout(() => setMaxHint(false), 2800);
        });
        return prev;
      }
      queueMicrotask(() => setMaxHint(false));
      return [...prev, book];
    });
  }, []);

  const persist = useCallback(async (books: PickBook[]) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/favorite-books", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          books: books.map((b) => ({
            title: b.title,
            author: b.author,
            coverUrl: b.coverUrl,
          })),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      writeUserCache({
        favorites: books.map((b) => ({
          title: b.title,
          author: b.author,
          coverUrl: b.coverUrl,
        })),
      });
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (loading || !loadComplete.current) return;
    if (selected.length === 0 && !userTouched.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(selected);
    }, 450);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [selected, loading, persist]);

  const showSearchMore =
    isSearchActive &&
    fullCatalog.length > SEARCH_PREVIEW &&
    !searchShowAll;

  const showBottomBar = selected.length >= 3;

  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-b from-[#fff8f5] via-white to-[#fff0eb] text-neutral-900 font-[family-name:var(--font-geist-sans)] ${showBottomBar ? "pb-36" : "pb-6"}`}
    >
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-8">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">
            Pick books you love
          </h1>
          <p className="mt-2 text-neutral-600 text-sm sm:text-base">
            Tap the hearts—fast picks, low friction.{" "}
            <Link
              href="/pages/profile"
              className="text-orange-600 font-medium underline-offset-2 hover:underline"
            >
              Your favorites
            </Link>{" "}
            live on your profile anytime.
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {selected.length}/{MAX_FAVORITE_BOOKS} selected — we save as you go.
            Unselecting updates your saved list.
          </p>
          {maxHint ? (
            <p className="mt-2 text-xs font-medium text-pink-600" role="status">
              You already have {MAX_FAVORITE_BOOKS} favorites. Tap a heart to
              remove one before adding another.
            </p>
          ) : null}
          {saveStatus === "saving" ? (
            <p className="mt-2 text-xs text-orange-600">Saving…</p>
          ) : null}
          {saveStatus === "saved" ? (
            <p className="mt-2 text-xs text-green-600">Saved.</p>
          ) : null}
        </div>

        <div className="max-w-xl mx-auto mb-8">
          <label className="sr-only" htmlFor="book-search">
            Search Open Library
          </label>
          <input
            id="book-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search books (Open Library)…"
            className="w-full rounded-full border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900 px-5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            autoComplete="off"
          />
          <p className="mt-2 text-center text-xs text-neutral-500">
            {isSearchActive
              ? "Search results (showing up to eight — see more for the rest)"
              : "Popular picks to start — or search for anything."}
            {searchLoading ? " · Searching…" : null}
          </p>
        </div>

        {loadError ? (
          <p className="text-center text-red-600 text-sm">{loadError}</p>
        ) : null}

        {loading ? (
          <p className="text-center text-neutral-500 py-16">Loading books…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 justify-items-center">
              {visibleCatalog.map((book, idx) => (
                <PickBookCard
                  key={`${isSearchActive ? "s" : "p"}-${idx}-${keyOf(book)}-${book.coverUrl ?? ""}`}
                  book={book}
                  selected={selectedKeys.has(keyOf(book))}
                  onToggle={() => toggle(book)}
                  compact
                />
              ))}
            </div>
            {showSearchMore ? (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={() => setSearchShowAll(true)}
                  className="rounded-full px-6 py-2.5 font-semibold uppercase tracking-wide text-sm border border-orange-300 text-orange-700 bg-white hover:bg-orange-50 dark:bg-neutral-900 dark:text-orange-300 dark:border-orange-700"
                >
                  See more ({fullCatalog.length - SEARCH_PREVIEW} more)
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>

      {showBottomBar ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex flex-col gap-3 items-center text-center">
            {selected.length === MAX_FAVORITE_BOOKS ? (
              <>
                <p
                  id="favorites-banner-title"
                  className="text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                >
                  You picked {MAX_FAVORITE_BOOKS}!
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 -mt-1">
                  View matches on your profile or start swiping on new picks.
                </p>
                <div className="flex flex-col w-full gap-2 sm:flex-row sm:justify-center">
                  <Link
                    href="/pages/profile"
                    className="w-full sm:w-auto rounded-full py-3 px-6 font-semibold text-center text-white uppercase tracking-wide text-sm bg-gradient-to-r from-pink-500 to-orange-500 shadow-md hover:opacity-95 transition-opacity"
                  >
                    See recommendations
                  </Link>
                  <Link
                    href="/pages/matches"
                    className="w-full sm:w-auto rounded-full py-3 px-6 font-semibold text-center uppercase tracking-wide text-sm border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Start swiping
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col w-full gap-2 sm:flex-row sm:justify-center sm:max-w-lg sm:mx-auto">
                <Link
                  href="/pages/profile"
                  className="w-full sm:flex-1 rounded-full py-3.5 px-6 font-semibold text-center text-white uppercase tracking-wide text-sm bg-gradient-to-r from-orange-500 to-pink-500 shadow-md hover:opacity-95 transition-opacity"
                >
                  See recommendations
                </Link>
                <Link
                  href="/pages/matches"
                  className="w-full sm:flex-1 rounded-full py-3.5 px-6 font-semibold text-center uppercase tracking-wide text-sm border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Start swiping
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}
