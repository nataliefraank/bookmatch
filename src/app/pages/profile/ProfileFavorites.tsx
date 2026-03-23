"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import PickBookCard, { type PickBook } from "../home/PickBookCard";
import { writeUserCache } from "@/lib/user-cache";

function keyOf(b: PickBook) {
  return `${b.title}::${b.author}`;
}

export type ProfileFavoriteRow = {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
};

type Props = {
  initial: ProfileFavoriteRow[];
};

export default function ProfileFavorites({ initial }: Props) {
  const [books, setBooks] = useState<PickBook[]>(() =>
    initial.map((f) => ({
      title: f.title,
      author: f.author,
      coverUrl: f.cover_url,
    })),
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">(
    "idle",
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirst = useRef(true);

  const persist = useCallback(async (next: PickBook[]) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/favorite-books", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          books: next.map((b) => ({
            title: b.title,
            author: b.author,
            coverUrl: b.coverUrl,
          })),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("idle");
      writeUserCache({
        favorites: next.map((b) => ({
          title: b.title,
          author: b.author,
          coverUrl: b.coverUrl,
        })),
      });
    } catch {
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(books);
    }, 450);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [books, persist]);

  const toggle = useCallback((book: PickBook) => {
    const k = keyOf(book);
    setBooks((prev) => prev.filter((p) => keyOf(p) !== k));
  }, []);

  if (books.length === 0) {
    return (
      <p className="text-neutral-600 text-sm">
        None yet.{" "}
        <Link
          href="/pages/home"
          className="text-orange-600 font-medium underline"
        >
          Add favorites on the home page
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <p className="text-neutral-600 text-sm mb-4">
        Tap a card to remove it from your favorites (same as on the home page).
      </p>
      {saveStatus === "saving" ? (
        <p className="text-xs text-orange-600 mb-2">Saving…</p>
      ) : null}
      {saveStatus === "error" ? (
        <p className="text-xs text-red-600 mb-2">
          Could not save. Try again.
        </p>
      ) : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {books.map((b, idx) => (
          <PickBookCard
            key={`${keyOf(b)}-${idx}`}
            book={b}
            selected
            onToggle={() => toggle(b)}
            compact
          />
        ))}
      </div>
    </>
  );
}
