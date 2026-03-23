"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useSwipeable,
  type SwipeDirections,
  LEFT,
  RIGHT,
  UP,
  DOWN,
} from "react-swipeable";
import type { BrowseBook } from "@/lib/book-types";
import {
  directionToDecision,
  SWIPE_DIRECTION_LABELS,
} from "@/lib/swipe-decisions";
import PickBookCard from "../home/PickBookCard";

const noop = () => {};

type BatchJson = {
  books?: BrowseBook[];
  error?: string;
};

export default function MatchesSwipeDeck() {
  const [deck, setDeck] = useState<BrowseBook[]>([]);
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [lastSwipe, setLastSwipe] = useState<SwipeDirections | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingInitial(true);
      setBatchError(null);
      try {
        const res = await fetch("/api/recommendations/batch", { method: "POST" });
        const j = (await res.json()) as BatchJson;
        if (cancelled) return;
        if (res.ok && j.books && j.books.length > 0) {
          setDeck(j.books);
          setIndex(0);
        } else {
          setDeck([]);
          setBatchError(j.error || "Could not load recommendations.");
        }
      } catch {
        if (!cancelled) {
          setBatchError("Network error loading recommendations.");
          setDeck([]);
        }
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completeSwipe = useCallback(
    async (dir: SwipeDirections) => {
      const book = deck[index];
      if (!book) return;

      const decision = directionToDecision(dir);
      setLastSwipe(dir);
      setDrag({ x: 0, y: 0 });

      try {
        await fetch("/api/matches/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            decision,
          }),
        });
      } catch {
        /* still advance UI */
      }

      const isLastInBatch = index >= deck.length - 1;

      if (isLastInBatch) {
        setLoadingMore(true);
        try {
          const res = await fetch("/api/recommendations/batch", {
            method: "POST",
          });
          const j = (await res.json()) as BatchJson;
          if (res.ok && j.books && j.books.length > 0) {
            setDeck(j.books);
            setIndex(0);
            setBatchError(null);
          } else {
            setDeck([]);
            setIndex(0);
            setBatchError(j.error || "No more recommendations right now.");
          }
        } catch {
          setDeck([]);
          setIndex(0);
          setBatchError("Could not load more recommendations.");
        } finally {
          setLoadingMore(false);
        }
      } else {
        setIndex((i) => i + 1);
      }
    },
    [deck, index],
  );

  const handlers = useSwipeable({
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 40,
    onSwiping: (e) => {
      setDrag({ x: e.deltaX, y: e.deltaY });
    },
    onSwipedLeft: () => void completeSwipe(LEFT),
    onSwipedRight: () => void completeSwipe(RIGHT),
    onSwipedUp: () => void completeSwipe(UP),
    onSwipedDown: () => void completeSwipe(DOWN),
    onSwiped: () => {
      setDrag({ x: 0, y: 0 });
    },
  });

  const remaining = deck.length > index ? deck.length - index : 0;
  const current = deck[index];

  return (
    <div className="w-full max-w-md mx-auto relative">
      {loadingMore ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] px-6"
          role="alertdialog"
          aria-busy="true"
          aria-label="Loading more recommendations"
        >
          <div className="rounded-2xl bg-white dark:bg-neutral-900 px-8 py-6 shadow-xl text-center max-w-sm border border-black/10 dark:border-white/10">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Loading more recommendations…
            </p>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
              Fetching the next batch of recommendations.
            </p>
            <div className="mt-4 flex justify-center">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
            </div>
          </div>
        </div>
      ) : null}

      {loadingInitial ? (
        <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 dark:border-white/15 dark:bg-neutral-900/40">
          <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading your first recommendations…
          </p>
        </div>
      ) : batchError && deck.length === 0 ? (
        <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/90 p-6 text-center dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            {batchError}
          </p>
        </div>
      ) : current ? (
        <div className="relative mx-auto w-full max-w-[min(18rem,88vw)]">
          {[2, 1].map((behind) => {
            const cardIndex = index + behind;
            if (cardIndex >= deck.length) return null;
            const book = deck[cardIndex]!;
            return (
              <div
                key={`${book.title}-${book.author}-${cardIndex}-back`}
                className="absolute left-0 right-0 top-0 z-[1] w-full pointer-events-none"
                style={{
                  transform: `translateY(${behind * 8}px) scale(${1 - behind * 0.028})`,
                  zIndex: behind,
                }}
                aria-hidden
              >
                <PickBookCard
                  book={book}
                  selected={false}
                  onToggle={noop}
                  swipeDisplay
                />
              </div>
            );
          })}
          <div
            {...handlers}
            className="relative z-[5] w-full cursor-grab active:cursor-grabbing"
            style={{
              transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.04}deg)`,
              transition:
                drag.x === 0 && drag.y === 0
                  ? "transform 0.2s ease-out"
                  : "none",
            }}
            role="group"
            aria-label="Swipeable recommendation"
          >
            <PickBookCard
              book={current}
              selected={false}
              onToggle={noop}
              swipeDisplay
            />
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-center text-xs text-neutral-600 dark:text-neutral-400 sm:grid-cols-4">
        <p>
          <span className="font-semibold text-rose-600">←</span>{" "}
          {SWIPE_DIRECTION_LABELS[LEFT]}
        </p>
        <p>
          <span className="font-semibold text-emerald-600">→</span>{" "}
          {SWIPE_DIRECTION_LABELS[RIGHT]}
        </p>
        <p>
          <span className="font-semibold text-sky-600">↑</span>{" "}
          {SWIPE_DIRECTION_LABELS[UP]}
        </p>
        <p>
          <span className="font-semibold text-amber-700">↓</span>{" "}
          {SWIPE_DIRECTION_LABELS[DOWN]}
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-500">
        {!loadingInitial && deck.length > 0
          ? `${remaining} left in this batch`
          : null}
        {lastSwipe ? (
          <span className="ml-2 text-neutral-700 dark:text-neutral-300">
            Last: {SWIPE_DIRECTION_LABELS[lastSwipe]}
          </span>
        ) : null}
      </p>
    </div>
  );
}
