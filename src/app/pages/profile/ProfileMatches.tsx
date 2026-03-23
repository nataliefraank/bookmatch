"use client";

import { useCallback, useState } from "react";

export type MatchRow = { id: number; title: string; author: string };

type Props = {
  initial: MatchRow[];
};

export default function ProfileMatches({ initial }: Props) {
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<number | null>(null);

  const remove = useCallback(async (match: MatchRow) => {
    setBusyId(match.id);
    try {
      const res = await fetch("/api/matches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: match.id }),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== match.id));
      }
    } finally {
      setBusyId(null);
    }
  }, []);

  if (rows.length === 0) {
    return (
      <p className="text-neutral-600 text-sm">
        Swipe right on recommendations to save books here.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-sm text-neutral-800">
      {rows.map((m) => (
        <li
          key={m.id}
          className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/5 pb-2 last:border-0"
        >
          <span>
            <span className="font-medium">{m.title}</span>
            <span className="text-neutral-600"> — {m.author}</span>
          </span>
          <button
            type="button"
            onClick={() => void remove(m)}
            disabled={busyId === m.id}
            className="shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500 hover:text-red-600 disabled:opacity-50"
          >
            {busyId === m.id ? "Removing…" : "Remove"}
          </button>
        </li>
      ))}
    </ul>
  );
}
