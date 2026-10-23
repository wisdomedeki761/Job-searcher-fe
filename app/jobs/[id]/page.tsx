"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconClock,
  IconExternal,
  IconGlobe,
  IconMapPin,
  IconSparkles,
} from "@/components/icons";
import PageShell from "@/components/PageShell";
import TopBar from "@/components/TopBar";
import { fetchJob, getToken, logout, type Job } from "@/lib/api";
import { timeAgo, labelize, workModeTint } from "@/lib/format";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  // Next 14 passes params as a plain object (Promise params are Next 15+).
  const { id } = params;
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Private app: no token → login.
  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    fetchJob(id)
      .then((data) => {
        if (!cancelled) setJob(data);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load";
        if (/401|expired token|unauthor/i.test(msg)) {
          logout();
          router.replace("/login");
          return;
        }
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return (
    <PageShell>
      <TopBar backHref="/" />

      {loading ? (
        /* JOB DETAILS · LOADING — the summary retains its shape */
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          <div className="card flex flex-col items-start gap-5 p-6">
            <div className="card flex h-[120px] w-full flex-col items-start gap-3.5 p-5">
              <div className="skeleton h-4 w-full shrink-0 rounded-[5px]" />
              <div className="skeleton h-3 w-[140px] shrink-0 rounded-[5px]" />
              <div className="skeleton h-3 w-[100px] shrink-0 rounded-[5px]" />
            </div>
            <div className="card flex h-28 w-full flex-col items-start gap-3.5 p-5">
              <div className="skeleton h-4 w-full shrink-0 rounded-[5px]" />
              <div className="skeleton h-3 w-[140px] shrink-0 rounded-[5px]" />
              <div className="skeleton h-3 w-[100px] shrink-0 rounded-[5px]" />
            </div>
            <button type="button" disabled className="btn-primary w-full">
              Apply
            </button>
          </div>
          <div className="card space-y-3 p-8">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-2/3" />
          </div>
        </div>
      ) : error || !job ? (
        /* JOB DETAILS · ERROR — the job may have expired or been removed */
        <div className="card flex flex-col items-start gap-5 p-8">
          <p className="text-2xl font-semibold text-danger">Job not found</p>
          <p className="text-sm text-muted">
            This opportunity is no longer available. There are more good roles
            in your feed.
          </p>
          <Link href="/" className="btn-ghost">
            <IconArrowLeft className="h-4 w-4 text-accent" /> Back to job feed
          </Link>
        </div>
      ) : (
        /* Desktop: sticky 2/5 summary beside the 3/5 description, so the apply
           button stays in view while reading. Stacks on small screens. */
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
          <div className="card flex flex-col gap-6 p-8 lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-ink text-[27px] font-bold text-white">
                {(job.company_name || "?").trim().charAt(0).toUpperCase()}
              </span>
              <span className="chip capitalize">{job.source}</span>
            </div>

            <div>
              <h1 className="text-[34px] font-semibold leading-tight text-ink">
                {job.job_title}
              </h1>
              <p className="mt-1.5 text-[17px] text-muted">
                {job.company_name || "Unknown company"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {job.work_mode && (
                <span
                  className={`chip capitalize ${workModeTint(job.work_mode)}`}
                >
                  {labelize(job.work_mode)}
                </span>
              )}
              {job.employment_type && job.employment_type !== "any" && (
                <span className="chip capitalize">
                  {labelize(job.employment_type)}
                </span>
              )}
              {typeof job.ai_confidence === "number" && (
                <span className="chip chip-accent">
                  <IconSparkles className="h-3 w-3" />
                  AI match {Math.round(job.ai_confidence * 100)}%
                </span>
              )}
            </div>

            <div className="divider" />

            <div className="flex flex-col gap-2.5 text-sm text-ink">
              {job.location && (
                <p className="flex items-center gap-2.5">
                  <IconMapPin className="h-4 w-4 text-muted" />
                  {job.location}
                </p>
              )}
              {(job.posted_at || job.first_seen_at) && (
                <p className="flex items-center gap-2.5">
                  <IconClock className="h-4 w-4 text-muted" />
                  Posted {timeAgo(job.posted_at || job.first_seen_at)}
                </p>
              )}
            </div>

            {/* Apply opens application_url; View source falls back to source_url */}
            {job.application_url ? (
              <div className="flex flex-col gap-2">
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full"
                >
                  Apply on {job.source}
                  <IconExternal />
                </a>
                <p className="text-center text-[11px] text-muted">
                  Continue on the employer&apos;s application page.
                </p>
              </div>
            ) : job.source_url ? (
              <div className="flex flex-col gap-2">
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full"
                >
                  <IconGlobe className="h-4 w-4" />
                  View source
                </a>
                <p className="text-center text-[11px] text-muted">
                  No application link — continue on the source page.
                </p>
              </div>
            ) : null}
          </div>

          <div className="card flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-ink">About the role</h2>
              <span className="chip capitalize">
                {job.employment_type && job.employment_type !== "any"
                  ? labelize(job.employment_type)
                  : job.source}
              </span>
            </div>

            {job.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                {job.description}
              </p>
            ) : (
              <p className="text-sm text-muted">
                No description provided by the source.
              </p>
            )}

            <div className="divider" />
            <p className="text-[11px] text-muted">
              Description provided by the original source. QX Scraper does not
              handle applications.
            </p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
