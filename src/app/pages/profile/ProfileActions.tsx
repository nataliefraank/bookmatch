"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearUserCache } from "@/lib/user-cache";

export default function ProfileActions() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (
      !window.confirm(
        "Delete your account permanently? This cannot be undone. Your favorites and matches will be removed.",
      )
    ) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not delete account");
        return;
      }
      clearUserCache();
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-10 max-w-md mx-auto">
      <a
        href="/pages/logout"
        className="inline-flex justify-center rounded-full px-6 py-3 font-medium border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
      >
        Log out
      </a>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="inline-flex justify-center rounded-full px-6 py-3 font-medium text-red-700 dark:text-red-400 border border-red-300/80 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete your account"}
      </button>
      {error ? (
        <p className="text-sm text-red-600 text-center w-full">{error}</p>
      ) : null}
    </div>
  );
}
