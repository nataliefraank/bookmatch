"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WelcomeContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onStart = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/welcome-complete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not continue");
        return;
      }
      router.push(data.redirect || "/pages/home");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      title: "Add your favorite books.",
      sub:
        "We want your guilty pleasures, the ones you can't help but reread, the ones that keep you up late at night.",
    },
    {
      title: "We match you with new favorite books.",
    },
    {
      title: "You tell us if you've read them before.",
      sub: "We want to know if you like them or don't––it helps us improve.",
    },
    {
      title: "Find your next great read.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-[family-name:var(--font-geist-sans)]">
      <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-8 max-w-lg mx-auto w-full">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/header/bookmatch.svg"
            alt="Bookmatch"
            width={200}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-center text-neutral-900">
          Welcome to Bookmatch.
        </h1>
        <p className="mt-2 text-center text-neutral-600 text-base sm:text-lg">
          Make yourself at home.
        </p>

        <ul className="mt-10 w-full space-y-6 text-left">
          {items.map((item) => (
            <li key={item.title} className="flex gap-3">
              <span
                className="text-pink-500 shrink-0 mt-0.5 select-none"
                aria-hidden
              >
                ♥︎
              </span>
              <div>
                <p className="font-semibold text-neutral-900 leading-snug">
                  {item.title}
                </p>
                {item.sub ? (
                  <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">
                    {item.sub}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {error ? (
          <p className="mt-6 text-sm text-red-600 text-center" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="px-6 pb-10 pt-2 max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="w-full rounded-full py-4 px-6 font-semibold text-white uppercase tracking-wide text-sm shadow-lg disabled:opacity-60 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-95 transition-opacity"
        >
          {loading ? "Loading…" : "Start matching"}
        </button>
      </div>
    </div>
  );
}
