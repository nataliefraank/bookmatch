import Link from "next/link";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import MatchBooksHeader from "./MatchBooksHeader";
import MatchesSwipeDeck from "./MatchesSwipeDeck";

export default function MatchesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#fff8f5] via-white to-[#fff0eb] font-[family-name:var(--font-geist-sans)]">
      <Header />
      <main className="flex-1 flex flex-col px-4 sm:px-6 py-8 max-w-lg mx-auto w-full">
        <MatchBooksHeader />

        <MatchesSwipeDeck />

        <Link
          href="/pages/home"
          className="mt-10 mx-auto inline-block rounded-full px-6 py-3 font-semibold text-white uppercase tracking-wide text-sm shadow-md bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-95 transition-opacity text-center"
        >
          Back to picking books
        </Link>
      </main>
      <Footer />
    </div>
  );
}
