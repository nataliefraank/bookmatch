import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import {
  DATABASE_ENV_ERROR,
  getAllMatchesForUser,
  getFavoriteBooksForUser,
  getUserById,
  isDatabaseConfigured,
} from "@/lib/db";
import { getSession } from "@/lib/session";
import ClearBookDataButton from "./ClearBookDataButton";
import ProfileActions from "./ProfileActions";
import ProfileFavorites from "./ProfileFavorites";
import ProfileMatches from "./ProfileMatches";

export default async function ProfilePage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 font-sans gap-4 max-w-lg mx-auto text-center">
        <p className="text-neutral-700 dark:text-neutral-300">{DATABASE_ENV_ERROR}</p>
        <Link href="/pages/login" className="underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const session = await getSession();
  if (!session) {
    redirect("/pages/login");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    redirect("/pages/login");
  }

  const favorites = await getFavoriteBooksForUser(session.userId);
  const matches = await getAllMatchesForUser(session.userId);

  const first = user.first_name?.trim() || user.username;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#fff8f5] via-white to-[#fff0eb] font-[family-name:var(--font-geist-sans)]">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sky-200/90 text-4xl shadow-[inset_0_0_0_2px_rgba(56,189,248,0.55)] ring-2 ring-sky-300/80"
            aria-hidden
          >
            {user.profile_emoji ?? "📚"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Hey, {first}!
          </h1>
          <p className="mt-2 text-neutral-600 text-sm">
            Manage your favorites and matches below.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Your favorite books
          </h2>
          <ProfileFavorites initial={favorites} />
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Books you&apos;re interested in
          </h2>
          <ProfileMatches initial={matches} />
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10 max-w-md mx-auto">
          <ClearBookDataButton />
        </div>

        <ProfileActions />
      </main>
      <Footer />
    </div>
  );
}
