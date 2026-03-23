import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DATABASE_ENV_ERROR,
  getUserById,
  isDatabaseConfigured,
} from "@/lib/db";
import { getSession } from "@/lib/session";
import WelcomeContent from "./WelcomeContent";

export default async function WelcomePage() {
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

  if (user.has_seen_welcome) {
    redirect("/pages/home");
  }

  return <WelcomeContent />;
}
