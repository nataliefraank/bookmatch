"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearUserCache } from "@/lib/user-cache";

export default function ClearBookDataButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = async () => {
    setError(null);
    setClearing(true);
    try {
      const res = await fetch("/api/user/book-data", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not clear data");
        return;
      }
      clearUserCache();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex justify-center rounded-full px-6 py-3 font-medium text-neutral-800 dark:text-neutral-200 border border-sky-300/90 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/50"
      >
        Clear book data
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-data-title"
          onClick={() => !clearing && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 shadow-xl px-6 py-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="clear-data-title"
              className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
            >
              Clear your book data?
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              This removes your saved favorites, matched books, and swipe
              history from Bookmatch. Your account stays active. This cannot be
              undone.
            </p>
            {error ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={clearing}
                className="rounded-full px-5 py-2.5 text-sm font-medium border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onConfirm()}
                disabled={clearing}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-600 hover:opacity-95 disabled:opacity-50"
              >
                {clearing ? "Clearing…" : "Yes, clear my book data"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
