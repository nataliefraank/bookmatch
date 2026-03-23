"use client";

import { useEffect, useState } from "react";

export default function MatchBooksHeader() {
  const [ready, setReady] = useState(false);
  const [useGroq, setUseGroq] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/recommendations/engine");
        const j = (await res.json()) as {
          engine?: "groq" | "openlibrary";
          setupHint?: string | null;
        };
        if (cancelled) return;
        setUseGroq(j.engine === "groq");
        setHint(j.setupHint ?? null);
      } catch {
        if (!cancelled) {
          setUseGroq(false);
          setHint(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">
        Match books
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Swipe on each suggestion. Your choices are saved.
      </p>
      {ready ? (
        <p className="mt-3 text-xs text-neutral-500">
          {useGroq
            ? "Suggestions use Groq for titles, then Open Library for covers."
            : "Suggestions use Open Library subject search from your favorites, then covers from Open Library."}
        </p>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">
          Loading recommendation source…
        </p>
      )}
      {hint ? (
        <p
          className="mt-2 text-xs text-amber-800 dark:text-amber-200"
          role="status"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
