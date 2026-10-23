"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import JobCard from "@/components/JobCard";
import JobSkeleton from "@/components/JobSkeleton";
import PageShell from "@/components/PageShell";
import TopBar from "@/components/TopBar";
import {
  IconBriefcase,
  IconGauge,
  IconSearch,
  IconRefresh,
  IconSliders,
  IconSparkles,
  IconUser,
  IconX,
} from "@/components/icons";
import {
  fetchJobs,
  fetchMe,
  getStoredAdmin,
  getToken,
  logout,
  type Admin,
  type Job,
} from "@/lib/api";

const WORK_MODES = ["", "remote", "hybrid", "onsite"] as const;
const EMPLOYMENT = ["", "full_time", "part_time", "contract", "internship"] as const;
const LIMIT = 20;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip capitalize transition ${active ? "chip-accent" : "hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Admin | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [employment, setEmployment] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Abort in-flight requests when filters change rapidly.
  const abortRef = useRef<AbortController | null>(null);

  // The feed is private: no token → straight to login. Refresh cached
  // permissions so the Admin button only shows for allowed accounts.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setMe(getStoredAdmin());
    fetchMe()
      .then(setMe)
      .catch(() => {
        /* keep cached copy; 401 is handled by load() */
      });
  }, [router]);

  const load = useCallback(
    async (reset: boolean) => {
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const start = reset ? 0 : offset;
        const data = await fetchJobs({
          q: q.trim() || undefined,
          work_mode: workMode || undefined,
          employment_type: employment || undefined,
          limit: LIMIT,
          offset: start,
        });
        if (controller.signal.aborted) return;

        setJobs((prev) => (reset ? data : [...prev, ...data]));
        setHasMore(data.length === LIMIT);
        setOffset(start + data.length);
      } catch (e) {
        if (controller.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Failed to load jobs";
        // Expired/invalid session → back to login.
        if (/401|expired token|unauthor/i.test(msg)) {
          logout();
          router.replace("/login");
          return;
        }
        setError(msg);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [q, workMode, employment, offset, router],
  );

  // Debounced reload on filter changes.
  useEffect(() => {
    const t = setTimeout(() => load(true), q ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, workMode, employment]);

  const activeFilters = (workMode ? 1 : 0) + (employment ? 1 : 0);

  return (
    <PageShell>
      <TopBar />

      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-ink">
            Fresh roles, without the noise.
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Your next move starts with a better signal.
          </p>
        </div>
        <span className="chip chip-accent">
          <IconSparkles className="h-3 w-3" />
          AI-curated opportunities
        </span>
      </div>

      {/* Search + filter toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, company, keyword…"
            className="search-field pl-11 pr-10"
            aria-label="Search jobs"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent transition active:scale-[0.98]"
          aria-label="Toggle filters"
          aria-expanded={showFilters}
        >
          <IconSliders className="h-5 w-5" />
          {activeFilters > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-accent">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card flex flex-col gap-3.5 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-24 shrink-0 text-xs font-semibold text-ink">
              Work mode
            </span>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {WORK_MODES.map((m) => (
                <Chip key={m || "any"} active={workMode === m} onClick={() => setWorkMode(m)}>
                  {m || "Any"}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-24 shrink-0 text-xs font-semibold text-ink">
              Employment
            </span>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {EMPLOYMENT.map((m) => (
                <Chip key={m || "any"} active={employment === m} onClick={() => setEmployment(m)}>
                  {m ? m.replace("_", " ") : "Any"}
                </Chip>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setWorkMode("");
                setEmployment("");
              }}
              className="btn-ghost w-full"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="flex flex-1 flex-col gap-4">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <JobSkeleton />
            <JobSkeleton />
            <JobSkeleton />
          </div>
        ) : error ? (
          /* JOB FEED · ERROR — title, copy, ghost retry */
          <div className="card flex flex-col items-start gap-5 p-8">
            <p className="text-[21px] font-semibold text-danger">
              Couldn&apos;t load jobs
            </p>
            <p className="text-sm text-muted">
              We couldn&apos;t reach the job feed. Please try again in a moment.
            </p>
            <button type="button" onClick={() => load(true)} className="btn-ghost">
              <IconRefresh className="h-4 w-4 text-accent" /> Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          /* JOB FEED · EMPTY — circular icon, centered copy, clear filters */
          <div className="card flex flex-col items-center gap-4 p-8 text-center">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-white/90 bg-white shadow-accent dark:border-line dark:bg-surface">
              <IconBriefcase className="h-[30px] w-[30px] text-accent" />
            </span>
            <p className="text-[23px] font-semibold text-ink">No jobs found</p>
            <p className="max-w-sm text-sm text-muted">
              Try a broader keyword or clear your filters to see more
              opportunities.
            </p>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setWorkMode("");
                setEmployment("");
              }}
              className="btn-ghost"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[22px] font-semibold text-ink">
                {jobs.length} matching opportunit{jobs.length === 1 ? "y" : "ies"}
              </h2>
              <span className="text-xs text-muted">Newest first</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {hasMore ? (
              /* PAGINATION · LOADING — disabled ghost button while fetching */
              <button
                type="button"
                onClick={() => load(false)}
                disabled={loadingMore}
                className="btn-ghost w-full"
              >
                <IconRefresh className={`h-4 w-4 text-accent ${loadingMore ? "animate-spin" : ""}`} />
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              /* PAGINATION · END OF RESULTS */
              <p className="text-center text-xs text-muted">
                {jobs.length} jobs shown — end of results
              </p>
            )}
          </>
        )}
      </div>

      <BottomNav
        items={[
          { href: "/", label: "Jobs", icon: <IconBriefcase />, active: true },
          ...(me?.can_manage_configs
            ? [{ href: "/admin", label: "Admin", icon: <IconGauge /> }]
            : []),
          { href: "/admin/profile", label: "Account", icon: <IconUser /> },
        ]}
      />
    </PageShell>
  );
}
