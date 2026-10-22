"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import JobCard from "@/components/JobCard";
import JobSkeleton from "@/components/JobSkeleton";
import ThemeToggle from "@/components/ThemeToggle";
import { IconBriefcase, IconGauge, IconSearch, IconSliders } from "@/components/icons";
import { fetchJobs, type Job } from "@/lib/api";

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
      className={`glass-chip capitalize transition ${active ? "glass-chip-active" : ""}`}
    >
      {children}
    </button>
  );
}

export default function HomePage() {
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
  const [total, setTotal] = useState<number | null>(null);

  // Abort in-flight requests when filters change rapidly.
  const abortRef = useRef<AbortController | null>(null);

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

        setTotal(null);
        setJobs((prev) => (reset ? data : [...prev, ...data]));
        setHasMore(data.length === LIMIT);
        setOffset(start + data.length);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load jobs");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [q, workMode, employment, offset],
  );

  // Debounced reload on filter changes.
  useEffect(() => {
    const t = setTimeout(() => load(true), q ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, workMode, employment]);

  const activeFilters = (workMode ? 1 : 0) + (employment ? 1 : 0);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-32 pt-6 md:max-w-4xl md:px-6 lg:max-w-none lg:px-8 lg:pb-14 xl:max-w-6xl">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Job Feed
          </p>
          <h1 className="text-2xl font-bold">QX Scraper</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="btn-circle" />
          <Link href="/admin" className="btn-circle" aria-label="Dashboard">
            <IconGauge />
          </Link>
        </div>
      </header>

      {/* Search + filter toggle */}
      <div className="mb-4 flex items-center gap-3">
        <div className="neu-inset flex flex-1 items-center gap-2 px-4 py-3">
          <IconSearch className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, company, keyword…"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
            aria-label="Search jobs"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="text-muted hover:text-ink"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="btn-circle relative"
          aria-label="Toggle filters"
          aria-expanded={showFilters}
        >
          <IconSliders />
          {activeFilters > 0 && (
            <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-glow">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filter rails */}
      {showFilters && (
        <div className="glass mb-4 space-y-3 p-4">
          <div>
            <p className="label-soft">Work mode</p>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {WORK_MODES.map((m) => (
                <Chip key={m || "any"} active={workMode === m} onClick={() => setWorkMode(m)}>
                  {m || "Any"}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="label-soft">Employment</p>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
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
      <div className="space-y-3">
        {loading ? (
          <>
            <JobSkeleton />
            <JobSkeleton />
            <JobSkeleton />
          </>
        ) : error ? (
          <div className="glass p-6 text-center">
            <p className="font-medium text-rose">Couldn’t load jobs</p>
            <p className="mt-1 text-sm text-muted">{error}</p>
            <button type="button" onClick={() => load(true)} className="btn-primary mt-4">
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="glass flex flex-col items-center gap-3 p-8 text-center">
            <span className="btn-circle animate-float h-14 w-14 text-accent">
              <IconBriefcase className="h-6 w-6" />
            </span>
            <p className="font-semibold">No jobs found</p>
            <p className="text-sm text-muted">
              Try different keywords or clear your filters. Jobs appear here once a
              search config has run.
            </p>
          </div>
        ) : (
          <>
            {/* 1 column on mobile, 2 on tablet/desktop, 3 on wide screens */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {hasMore ? (
              <button
                type="button"
                onClick={() => load(false)}
                disabled={loadingMore}
                className="btn-ghost w-full disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : (
              <p className="pt-2 text-center text-xs text-muted">
                {jobs.length} job{jobs.length === 1 ? "" : "s"} shown — end of results
              </p>
            )}
          </>
        )}
      </div>

      <BottomNav
        items={[
          { href: "/", label: "Jobs", icon: <IconBriefcase />, active: true },
          { href: "/admin", label: "Admin", icon: <IconGauge /> },
        ]}
      />
    </div>
  );
}
