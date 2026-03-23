"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
// import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import Content from "@/components/Content/Content";
import BookGrid from "@/components/BookGrid/BookGrid";
import { fetchMatches } from "@/utils/matchUtils";

export default function BookmatchClient({ username }: { username: string }) {
  const [books, setBooks] = useState<Map<string, string>>(
    new Map<string, string>(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const matches = await fetchMatches();
        setBooks(matches);
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const empty = !isLoading && books.size === 0;

  const info1 = isLoading
    ? "Loading your books…"
    : empty
      ? "No books yet! Start matching."
      : "Here are some of your favorite books lately.";
  const info2 = isLoading
    ? "One moment…"
    : empty
      ? "Your list is ready for new reads. 📚"
      : "Check it out. 👀";

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Header />
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full">
        <div className="w-full max-w-4xl mx-auto">
          <Content
            Title={`${username}'s Bookmatch`}
            Information1={info1}
            Information2={info2}
          />
        </div>
        {empty ? (
          <Link
            href="/pages/search_like"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] px-6 py-3 font-medium text-sm sm:text-base transition-colors hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]"
          >
            Start matching
          </Link>
        ) : (
          <BookGrid books={books} isLoading={isLoading} />
        )}
      </main>
      {/* <Footer /> */}
    </div>
  );
}
