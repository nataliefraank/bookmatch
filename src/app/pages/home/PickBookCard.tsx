"use client";

import Image from "next/image";

export type PickBook = {
  title: string;
  author: string;
  coverUrl: string | null;
};

type Props = {
  book: PickBook;
  selected: boolean;
  onToggle: () => void;
  compact?: boolean;
  /** Read-only card for swipe deck (no button / heart; parent handles gestures). */
  swipeDisplay?: boolean;
};

export default function PickBookCard({
  book,
  selected,
  onToggle,
  compact = false,
  swipeDisplay = false,
}: Props) {
  const hasCover = Boolean(book.coverUrl && book.coverUrl.length > 0);

  const shellClass = swipeDisplay
    ? "relative z-0 mx-auto w-full max-w-[min(18rem,88vw)] pointer-events-none select-none text-left rounded-xl overflow-hidden border border-neutral-200/90 shadow-lg ring-1 ring-black/5 dark:border-white/15 dark:ring-white/10"
    : `relative z-0 mx-auto w-full max-w-[10.75rem] sm:max-w-[11.25rem] cursor-pointer text-left rounded-xl overflow-hidden border-2 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
        selected
          ? "border-pink-500 shadow-md shadow-pink-500/15"
          : "border-transparent ring-1 ring-black/5 dark:ring-white/10"
      }`;

  const inner = (
    <>
      <div className="relative aspect-[2/3] w-full bg-[#fff5f0]">
        {hasCover ? (
          <Image
            src={book.coverUrl!}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, 140px"
            className="object-cover pointer-events-none select-none"
            draggable={false}
            unoptimized
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-pink-200 via-rose-100 to-pink-50 dark:from-pink-900/40 dark:via-rose-900/30 dark:to-pink-950/50"
            aria-hidden
          />
        )}
        {!swipeDisplay ? (
          <>
            <div
              className="absolute inset-0 bg-gradient-to-t from-pink-600/25 via-pink-400/10 to-transparent mix-blend-multiply pointer-events-none"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-pink-500/10 pointer-events-none"
              aria-hidden
            />
          </>
        ) : null}
        {!swipeDisplay ? (
          <span
            className={`pointer-events-none absolute top-1 right-1 z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-md transition-colors ${
              selected
                ? "bg-pink-500 text-white"
                : "bg-white/90 text-pink-400/80"
            }`}
            aria-hidden
          >
            ♥︎
          </span>
        ) : null}
      </div>
      <div
        className={`${swipeDisplay ? "bg-white dark:bg-neutral-900" : "bg-white/95 dark:bg-neutral-900/95"} ${compact ? "p-2" : "p-3"}`}
      >
        <p
          className={`font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 ${compact ? "text-[11px] leading-snug" : "text-sm"}`}
        >
          {book.title}
        </p>
        <p
          className={`text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-1 ${compact ? "text-[10px]" : "text-xs"}`}
        >
          {book.author}
        </p>
      </div>
    </>
  );

  if (swipeDisplay) {
    return (
      <div className={shellClass} aria-hidden>
        {inner}
      </div>
    );
  }

  return (
    <button type="button" onClick={() => onToggle()} className={shellClass}>
      {inner}
    </button>
  );
}
