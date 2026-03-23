import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 px-4 py-4 text-sm text-neutral-600 dark:text-neutral-400">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <p className="text-neutral-700 dark:text-neutral-300">
          Created by Natalie Frank.
        </p>
        <Link
          href="/pages/attributions"
          className="text-neutral-600 dark:text-neutral-400 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100 sm:text-right"
        >
          Attributions
        </Link>
      </div>
    </footer>
  );
}
