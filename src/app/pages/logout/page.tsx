"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearUserCache } from "@/lib/user-cache";

export default function LogoutPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (!res.ok) throw new Error("Logout failed");
        clearUserCache();
        if (!cancelled) router.replace("/");
        router.refresh();
      } catch {
        if (!cancelled) setErr("Could not sign out. Try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-600">{err}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 text-neutral-600">
      Signing out…
    </div>
  );
}
