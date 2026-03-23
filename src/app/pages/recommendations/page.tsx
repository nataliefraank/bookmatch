import Link from "next/link";
// import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";

export default function RecommendationsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#fff8f5] via-white to-[#fff0eb] font-[family-name:var(--font-geist-sans)]">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">
          Recommendations
        </h1>
        <p className="mt-4 text-neutral-600">Coming soon.</p>
        <Link
          href="/pages/home"
          className="mt-8 inline-block rounded-full px-6 py-3 font-medium text-white bg-gradient-to-r from-orange-500 to-pink-500"
        >
          Back to picking books
        </Link>
      </main>
      {/* <Footer /> */}
    </div>
  );
}
