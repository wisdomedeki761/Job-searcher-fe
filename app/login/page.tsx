"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IconAlertCircle, IconRefresh, IconSparkles } from "@/components/icons";
import PageShell from "@/components/PageShell";
import ThemeToggle from "@/components/ThemeToggle";
import { getToken, login } from "@/lib/api";

/**
 * The whole app is private: every page (job feed included) sits behind this
 * login. Desktop follows the split export — hero image left, violet-washed
 * sign-in card right; on small screens only the card shows.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in → straight to the feed.
  useEffect(() => {
    if (getToken()) router.replace("/");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      if (/401|invalid|credentials/i.test(msg)) {
        setError("Invalid email or password.");
      } else {
        setError(msg);
      }
      setBusy(false);
    }
  }

  return (
    <PageShell footer={false}>
      {/* Top bar: centered QX wordmark + theme toggle */}
      <header className="topbar justify-center">
        <span className="text-3xl font-bold text-accent">QX</span>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center gap-14 py-4">
        {/* Hero image — desktop only */}
        <div className="relative hidden h-[640px] w-[512px] shrink-0 overflow-hidden rounded-[25px] xl:block xl:h-[720px] xl:w-[576px]">
          <Image
            src="/give_me_this_mage_precisely_2K_20261023064136.jpg"
            alt=""
            fill
            sizes="576px"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex w-full max-w-[448px] flex-col gap-7">
          {/* Hero text — replaces the image below xl */}
          <div className="flex flex-col gap-3 xl:hidden">
            <p className="text-sm text-muted">
              Your next move starts with a better signal.
            </p>
            <span className="chip chip-accent w-fit">
              ✦ AI-curated opportunities
            </span>
            <p className="text-3xl font-semibold leading-[1.3] text-ink">
              Fresh roles, without the noise.
            </p>
          </div>

          {/* Sign-in card */}
          <div className="login-card flex w-full flex-col items-start gap-7 p-8 lg:p-10">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-white/90 bg-white/72 shadow-accent">
              <IconSparkles className="h-7 w-7 text-accent" />
            </div>

            <div className="w-full text-center">
              <h1 className="text-[30px] font-semibold text-ink">Sign in</h1>
              <p className="mt-1.5 text-sm text-muted">
                Your next opportunity, a little closer.
              </p>
            </div>

            {/* Inputs dim and disable while signing in (SIGN IN · SUBMITTING) */}
            <form onSubmit={onSubmit} className="flex w-full flex-col gap-5">
              <div className={busy ? "opacity-50" : ""}>
                <label htmlFor="email" className="label mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={busy}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="field"
                />
              </div>

              <div className={busy ? "opacity-50" : ""}>
                <label htmlFor="password" className="label mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  disabled={busy}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="field"
                />
              </div>

              {/* Inline feedback stays inside the glass card (SIGN IN · ERROR) */}
              {error && (
                <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-danger">
                  <IconAlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full"
              >
                {busy && <IconRefresh className="h-4 w-4 animate-spin" />}
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="w-full text-center text-[11px] text-muted">
              Accounts are created by the super admin — contact them if you
              don&apos;t have credentials yet.
            </p>
          </div>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex w-full max-w-[569px] flex-col items-center justify-between gap-1 text-[11px] text-muted sm:flex-row">
        <span>A quieter way to find your next role.</span>
        <span>QX Scraper · Private workspace</span>
      </div>
    </PageShell>
  );
}
