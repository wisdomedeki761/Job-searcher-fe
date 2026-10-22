"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconSparkles } from "@/components/icons";
import { login } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If already logged in, bounce to the dashboard.
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("qx_token")) {
      router.replace("/admin");
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="btn-circle mb-6" aria-label="Back">
        <IconArrowLeft />
      </Link>

      <div className="glass p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="btn-circle h-12 w-12 animate-float text-accent">
            <IconSparkles />
          </span>
          <div>
            <h1 className="text-xl font-bold">Admin login</h1>
            <p className="text-sm text-muted">Super admin access</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label-soft">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-neu"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="label-soft">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-neu"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-rose/10 px-4 py-3 text-sm text-rose">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
