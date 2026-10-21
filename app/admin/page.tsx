"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import {
  IconBriefcase,
  IconGauge,
  IconLogout,
  IconPlay,
  IconPlus,
  IconSparkles,
  IconTrash,
} from "@/components/icons";
import {
  admin,
  fetchMe,
  getToken,
  logout,
  type Admin,
  type SearchConfig,
  type SearchRun,
} from "@/lib/api";
import { timeAgo } from "@/lib/format";

function StatusDot({ cfg }: { cfg: SearchConfig }) {
  const color = cfg.running
    ? "bg-peach animate-pulse"
    : cfg.enabled
      ? "bg-mint"
      : "bg-muted/50";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<Admin | null>(null);
  const [configs, setConfigs] = useState<SearchConfig[]>([]);
  const [runs, setRuns] = useState<SearchRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const refresh = useCallback(async () => {
    try {
      const [me, cfgs, allRuns] = await Promise.all([
        fetchMe(),
        admin.listConfigs(),
        admin.allRuns(),
      ]);
      setAdminUser(me);
      setConfigs(cfgs);
      setRuns(allRuns);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    refresh();
  }, [router, refresh]);

  async function guard<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (e) {
      // Token expired / unauthorized → back to login.
      const msg = e instanceof Error ? e.message : "Request failed";
      if (/401|credentials|unauthor/i.test(msg)) {
        logout();
        router.replace("/admin/login");
        return null;
      }
      showToast(msg);
      return null;
    }
  }

  async function toggle(cfg: SearchConfig) {
    setBusyId(cfg.id);
    const fn = cfg.enabled ? admin.disableConfig : admin.enableConfig;
    await guard(() => fn(cfg.id));
    await refresh();
    setBusyId(null);
  }

  async function runNow(cfg: SearchConfig) {
    setBusyId(cfg.id);
    const res = await guard(() => admin.runConfig(cfg.id));
    if (res) showToast(`Run started for “${cfg.job_type}”`);
    setTimeout(refresh, 1500);
    setBusyId(null);
  }

  async function remove(cfg: SearchConfig) {
    if (!confirm(`Delete search config “${cfg.job_type}”?`)) return;
    setBusyId(cfg.id);
    await guard(() => admin.deleteConfig(cfg.id));
    await refresh();
    setBusyId(null);
  }

  function doLogout() {
    logout();
    router.replace("/admin/login");
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-32 pt-6 md:max-w-4xl md:px-6 lg:max-w-none lg:px-8 lg:pb-14 xl:max-w-6xl">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Dashboard
          </p>
          <h1 className="text-2xl font-bold">Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          {adminUser && (
            <span className="glass-chip hidden max-w-40 truncate sm:inline-flex">
              {adminUser.email}
            </span>
          )}
          <ThemeToggle />
          <button type="button" onClick={doLogout} className="btn-circle" aria-label="Log out">
            <IconLogout />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
        </div>
      ) : error ? (
        <div className="glass p-6 text-center">
          <p className="font-medium text-rose">Couldn’t load dashboard</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <button type="button" onClick={refresh} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search configs */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Search configs
              </h2>
              <Link href="/admin/configs/new" className="btn-ghost">
                <IconPlus className="h-4 w-4" /> New
              </Link>
            </div>

            {configs.length === 0 ? (
              <div className="glass flex flex-col items-center gap-3 p-8 text-center">
                <span className="btn-circle h-14 w-14 animate-float text-accent">
                  <IconSparkles className="h-6 w-6" />
                </span>
                <p className="font-semibold">No search configs yet</p>
                <p className="text-sm text-muted">
                  Create one and the AI will fill in keywords, locations and schedule.
                </p>
                <Link href="/admin/configs/new" className="btn-primary">
                  <IconPlus /> Create search
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {configs.map((cfg) => (
                  <div key={cfg.id} className="glass min-w-0 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/admin/configs/${cfg.id}`}
                        className="min-w-0 flex-1"
                      >
                        <h3 className="flex items-center gap-2 font-semibold">
                          <StatusDot cfg={cfg} />
                          <span className="min-w-0 truncate">{cfg.job_type}</span>
                        </h3>
                        <p className="mt-0.5 text-xs text-muted">
                          {cfg.cron_expression} · every {cfg.lookback_hours}h lookback
                        </p>
                      </Link>
                      {cfg.ai_generated && (
                        <span className="glass-chip shrink-0 text-accent">
                          <IconSparkles className="h-3.5 w-3.5" /> AI
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {cfg.keywords.slice(0, 4).map((k) => (
                        <span key={k} className="glass-chip">
                          {k}
                        </span>
                      ))}
                      {cfg.keywords.length > 4 && (
                        <span className="glass-chip">+{cfg.keywords.length - 4}</span>
                      )}
                    </div>

                    {/* Buttons wrap instead of overflowing narrow phones */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => runNow(cfg)}
                        disabled={busyId === cfg.id}
                        className="btn-ghost min-w-32 flex-1 disabled:opacity-60"
                      >
                        <IconPlay /> Run now
                      </button>
                      <button
                        type="button"
                        onClick={() => toggle(cfg)}
                        disabled={busyId === cfg.id}
                        className={`btn-ghost min-w-24 disabled:opacity-60 ${cfg.enabled ? "text-mint" : ""}`}
                      >
                        {cfg.enabled ? "Enabled" : "Disabled"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(cfg)}
                        disabled={busyId === cfg.id}
                        className="btn-circle h-10 w-10 text-rose disabled:opacity-60"
                        aria-label="Delete config"
                      >
                        <IconTrash />
                      </button>
                    </div>

                    {cfg.last_run_at && (
                      <p className="mt-2 text-[11px] text-muted">
                        Last run {timeAgo(cfg.last_run_at)}
                        {cfg.next_run_at ? ` · next ${timeAgo(cfg.next_run_at)}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent runs */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Recent runs
            </h2>
            {runs.length === 0 ? (
              <div className="glass p-5 text-center text-sm text-muted">
                No runs recorded yet.
              </div>
            ) : (
              <div className="glass divide-y divide-white/60 p-1 dark:divide-white/10">
                {runs.slice(0, 12).map((run) => (
                  <div key={run.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                        run.status === "success"
                          ? "bg-mint"
                          : run.status === "failed"
                            ? "bg-rose"
                            : "bg-peach"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium capitalize">
                        {run.source} · {run.status}
                      </p>
                      <p className="text-[11px] text-muted">
                        {timeAgo(run.started_at)} · {run.raw_count} raw → {run.new_jobs_count} new
                      </p>
                    </div>
                    {run.error && (
                      <span className="glass-chip max-w-28 truncate text-rose">
                        {run.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 lg:bottom-8">
          <div className="glass px-5 py-3 text-sm font-medium text-ink shadow-glow">
            {toast}
          </div>
        </div>
      )}

      <BottomNav
        items={[
          { href: "/", label: "Jobs", icon: <IconBriefcase /> },
          { href: "/admin", label: "Admin", icon: <IconGauge />, active: true },
        ]}
      />
    </div>
  );
}
