"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "";

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        return;
      }
      if (data.needsOnboarding) {
        setPendingUsername(data.username ?? username.trim().toLowerCase());
        setNeedsOnboarding(true);
        return;
      }
      const target =
        typeof nextPath === "string" && nextPath.startsWith("/")
          ? nextPath
          : data.redirect;
      router.push(target);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: pendingUsername,
          firstName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        return;
      }
      router.push(data.redirect || "/pages/new-user");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (needsOnboarding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 font-sans">
        <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center max-w-md">
          Username <strong>{pendingUsername}</strong> is new. What should we
          call you?
        </p>
        <form
          onSubmit={submitRegister}
          className="flex flex-col gap-4 w-full max-w-sm"
        >
          <label className="flex flex-col gap-1 text-sm">
            First name
            <input
              type="text"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-background"
              required
              maxLength={80}
            />
          </label>
          {error ? (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-foreground text-background py-3 font-medium disabled:opacity-50"
          >
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 font-sans">
      <h1 className="text-2xl font-semibold mb-2">Sign in with username</h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center max-w-md">
        Enter your Bookmatch username. If you are new, we will ask for your
        first name next.
      </p>
      <form
        onSubmit={submitUsername}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-background"
            required
            minLength={3}
            maxLength={32}
            pattern="[a-zA-Z0-9_-]{3,32}"
            title="3–32 characters: letters, numbers, underscores, or hyphens"
          />
        </label>
        {error ? (
          <p className="text-red-600 text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-foreground text-background py-3 font-medium disabled:opacity-50"
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
