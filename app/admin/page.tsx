"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageShell from "@/components/PageShell";
import Toast from "@/components/Toast";
import TopBar from "@/components/TopBar";
import {
  IconBriefcase,
  IconGauge,
  IconPause,
  IconPencil,
  IconPlay,
  IconPlus,
  IconRefresh,
  IconSparkles,
  IconTrash,
  IconUser,
} from "@/components/icons";
import {
  admin,
  fetchMe,
  getStoredAdmin,
  getToken,
  logout,
  type SearchConfig,
  type SearchRun,
} from "@/lib/api";
import { timeAgo } from "@/lib/format";

/** Dot colors from the export: enabled green, disabled grey, running amber. */
function StatusDot({ cfg }: { cfg: SearchConfig }) {
  const color = cfg.running
    ? "bg-warning animate-pulse"
    : cfg.enabled
      ? "bg-success"
      : "bg-placeholder/50";
  return <span className={`inline-block h-[7px] w-[7px] rounded-full ${color}`} />;
}

/** Hours/minutes until an ISO timestamp, e.g. "4h" / "35m". */
function until(iso?: string): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return "—";
  if (ms <= 0) return "now";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.round(mins / 60)}h`;
}

function RunStatusChip({ run }: { run: SearchRun }) {
  if (run.status === "success") {
    return <span className="chip chip-success shrink-0 capitalize">Completed</span>;
  }
  if (run.status === "failed") {
    return <span className="chip chip-danger shrink-0 capitalize">Failed</span>;
  }
  return <span className="chip chip-accent shrink-0 capitalize">{run.status}</span>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<SearchConfig[]>([]);
  const [runs, setRuns] = useState<SearchRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "accent" | "danger"; msg: string } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<SearchConfig | null>(null);

  const showToast = (msg: string, tone: "success" | "accent" | "danger" = "success") => {
    setToast({ tone, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const refresh = useCallback(async () => {
    try {
      const [, cfgs, allRuns] = await Promise.all([
        fetchMe(),
        admin.listConfigs(),
        admin.allRuns(),
      ]);
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
      router.replace("/login");
      return;
    }
    // View-only accounts have no business here — send them to the feed.
    const cached = getStoredAdmin();
    if (cached && !cached.can_manage_configs) {
      router.replace("/");
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
        router.replace("/login");
        return null;
      }
      showToast(msg, "danger");
      return null;
    }
  }

  async function toggle(cfg: SearchConfig) {
    setBusyId(cfg.id);
    const fn = cfg.enabled ? admin.disableConfig : admin.enableConfig;
    const res = await guard(() => fn(cfg.id));
    if (res) showToast(cfg.enabled ? "Search disabled." : "Search enabled.", cfg.enabled ? "accent" : "success");
    await refresh();
    setBusyId(null);
  }

  async function runNow(cfg: SearchConfig) {
    setBusyId(cfg.id);
    // guard() already surfaces API errors as a danger toast.
    const res = await guard(() => admin.runConfig(cfg.id));
    if (res) showToast("Search started. New jobs will appear in your feed.");
    setTimeout(refresh, 1500);
    setBusyId(null);
  }

  async function remove(cfg: SearchConfig) {
    setConfirmTarget(cfg);
  }

  async function confirmRemove() {
    if (!confirmTarget) return;
    setBusyId(confirmTarget.id);
    await guard(() => admin.deleteConfig(confirmTarget.id));
    showToast("Search deleted.");
    setConfirmTarget(null);
    await refresh();
    setBusyId(null);
  }

  /* Dashboard stats — computed from configs + today's runs. */
  const activeCount = configs.filter((c) => c.enabled).length;
  const pausedCount = configs.length - activeCount;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const runsToday = runs.filter(
    (r) => new Date(r.started_at).getTime() >= startOfDay.getTime(),
  );
  const jobsToday = runsToday.reduce((sum, r) => sum + (r.new_jobs_count || 0), 0);
  const sourcesToday = new Set(runsToday.map((r) => r.source)).size;
  const nextRun = configs
    .filter((c) => c.enabled && c.next_run_at)
    .map((c) => ({ cfg: c, at: new Date(c.next_run_at!).getTime() }))
    .filter((x) => !Number.isNaN(x.at) && x.at > Date.now())
    .sort((a, b) => a.at - b.at)[0];

  return (
    <PageShell>
      <TopBar title="Admin" backHref="/" />

      {loading ? (
        /* DASHBOARD · LOADING — two 112px skeletons hold the config grid */
        <div className="flex flex-1 flex-col gap-5">
          <p className="eyebrow">Dashboard</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card h-28" />
            <div className="card h-28" />
            <div className="card h-28" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card flex h-28 flex-col items-start gap-3.5 p-5">
              <div className="skeleton h-4 w-full shrink-0 rounded-[5px]" />
              <div className="skeleton h-3 w-[140px] shrink-0 rounded-[5px]" />
              <div className="skeleton h-3 w-[100px] shrink-0 rounded-[5px]" />
            </div>
            <div className="card flex h-28 flex-col items-start gap-3.5 p-5">
              <div className="skeleton h-4 w-full shrink-0 rounded-[5px]" />
              <div className="skeleton h-3 w-[140px] shrink-0 rounded-[5px]" />
              <div className="skeleton h-3 w-[100px] shrink-0 rounded-[5px]" />
            </div>
          </div>
        </div>
      ) : error ? (
        /* DASHBOARD · ERROR */
        <div className="card flex flex-col items-start gap-5 p-8">
          <p className="text-[22px] font-semibold text-danger">
            Couldn&apos;t load your dashboard
          </p>
          <p className="text-sm text-muted">
            Search configurations are temporarily unavailable. Your saved
            searches haven&apos;t changed.
          </p>
          <button type="button" onClick={refresh} className="btn-ghost">
            <IconRefresh className="h-4 w-4 text-accent" /> Retry
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-5">
          {/* Eyebrow */}
          <p className="eyebrow">Dashboard</p>

          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card flex flex-col gap-2 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Active searches
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-[32px] font-semibold text-ink">
                  {activeCount}
                </span>
                <span className="text-xs text-muted">
                  {pausedCount === 0
                    ? "All searches running"
                    : `${pausedCount} search${pausedCount === 1 ? "" : "es"} paused`}
                </span>
              </div>
            </div>
            <div className="card flex flex-col gap-2 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                New jobs today
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-[32px] font-semibold text-ink">{jobsToday}</span>
                <span className="text-xs text-muted">
                  {sourcesToday === 0
                    ? "No runs yet today"
                    : `Across ${sourcesToday} registered source${sourcesToday === 1 ? "" : "s"}`}
                </span>
              </div>
            </div>
            <div className="card flex flex-col gap-2 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Next scheduled run
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-[32px] font-semibold text-ink">
                  {nextRun ? until(new Date(nextRun.at).toISOString()) : "—"}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted">
                  {nextRun ? nextRun.cfg.job_type : "No enabled searches"}
                </span>
              </div>
            </div>
          </div>

          {/* Search configs */}
          <section className="flex flex-col gap-[18px]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[22px] font-semibold text-ink">Search configs</h2>
              <Link href="/admin/configs/new" className="btn-ghost">
                <IconPlus className="h-4 w-4" /> New search
              </Link>
            </div>

            {configs.length === 0 ? (
              /* DASHBOARD · EMPTY — circular icon + create call to action */
              <div className="card flex flex-col items-center gap-4 p-8 text-center">
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-white/90 bg-white shadow-accent dark:border-line dark:bg-surface">
                  <IconSparkles className="h-[30px] w-[30px] text-accent" />
                </span>
                <p className="text-2xl font-semibold text-ink">
                  No search configs yet
                </p>
                <p className="max-w-sm text-sm text-muted">
                  Create your first search and let the right roles come to you.
                </p>
                <Link href="/admin/configs/new" className="btn-primary">
                  Create search
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {configs.map((cfg) => (
                  <div key={cfg.id} className="card flex min-w-0 flex-col gap-4 p-6">
                    <div className="flex items-start gap-3">
                      <StatusDot cfg={cfg} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[17px] font-semibold text-ink">
                          {cfg.job_type}
                        </h3>
                        <p className="mt-1 font-mono text-xs text-muted">
                          {cfg.cron_expression}
                        </p>
                      </div>
                      {cfg.ai_generated && (
                        <span className="chip chip-accent shrink-0">
                          <IconSparkles className="h-3 w-3" /> AI
                        </span>
                      )}
                      <Link
                        href={`/admin/configs/${cfg.id}/edit`}
                        className="icon-btn"
                        aria-label="Edit search"
                      >
                        <IconPencil />
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {cfg.keywords.slice(0, 4).map((k) => (
                        <span key={k} className="chip">
                          {k}
                        </span>
                      ))}
                      {cfg.keywords.length > 4 && (
                        <span className="chip chip-accent">
                          +{cfg.keywords.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => runNow(cfg)}
                        disabled={busyId === cfg.id}
                        className="btn-ghost min-w-32 flex-1 gap-1.5 disabled:opacity-60"
                      >
                        <IconPlay className="h-4 w-4 text-accent" /> Run now
                      </button>
                      <button
                        type="button"
                        onClick={() => toggle(cfg)}
                        disabled={busyId === cfg.id}
                        className={`min-w-32 flex-1 disabled:opacity-60 ${
                          cfg.enabled ? "btn-success gap-1.5" : "btn-ghost"
                        }`}
                      >
                        {cfg.enabled ? (
                          <>
                            <IconPause className="h-4 w-4" /> Enabled
                          </>
                        ) : (
                          "Disabled"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(cfg)}
                        disabled={busyId === cfg.id}
                        className="icon-btn-danger"
                        aria-label="Delete config"
                      >
                        <IconTrash />
                      </button>
                    </div>

                    <p className="text-[11px] text-muted">
                      {cfg.last_run_at ? `Last run ${timeAgo(cfg.last_run_at)}` : "Never run"}
                      {cfg.next_run_at ? ` · next run in ${until(cfg.next_run_at)}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent runs */}
          <section className="flex flex-col gap-[18px]">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[22px] font-semibold text-ink">Recent runs</h2>
              <span className="text-xs text-muted">Latest activity</span>
            </div>
            {runs.length === 0 ? (
              <div className="card p-6 text-center text-sm text-muted">
                No runs recorded yet.
              </div>
            ) : (
              <div className="card divide-y divide-line/60 p-2">
                {runs.slice(0, 12).map((run) => (
                  <div key={run.id} className="flex items-center gap-3.5 px-4 py-4">
                    <span
                      className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full ${
                        run.status === "success"
                          ? "bg-success"
                          : run.status === "failed"
                            ? "bg-danger"
                            : "bg-warning"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium capitalize text-ink">
                        {run.source} · {run.status.replace("_", " ")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {timeAgo(run.started_at)} · {run.raw_count} raw →{" "}
                        {run.new_jobs_count} new
                      </p>
                    </div>
                    <RunStatusChip run={run} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Action toasts — short-lived feedback */}
      {toast && (
        <Toast tone={toast.tone}>{toast.msg}</Toast>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmTarget !== null}
        tone="danger"
        icon={<IconTrash className="h-6 w-6" />}
        title="Delete this search?"
        body={`“${confirmTarget?.job_type ?? ""}” will stop running and its saved results stay in the feed. This action cannot be undone.`}
        confirmLabel="Delete search"
        busy={busyId !== null}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmTarget(null)}
      />

      <BottomNav
        items={[
          { href: "/", label: "Jobs", icon: <IconBriefcase /> },
          { href: "/admin", label: "Admin", icon: <IconGauge />, active: true },
          { href: "/admin/profile", label: "Account", icon: <IconUser /> },
        ]}
      />
    </PageShell>
  );
}
