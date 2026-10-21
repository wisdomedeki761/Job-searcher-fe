"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconClock,
  IconExternal,
  IconMapPin,
  IconSparkles,
} from "@/components/icons";
import ThemeToggle from "@/components/ThemeToggle";
import { fetchJob, type Job } from "@/lib/api";
import { timeAgo, labelize, workModeTint } from "@/lib/format";

export default function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Next 14 passes params as a plain object (Promise params are Next 15+).
  const { id } = params;
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchJob(id)
      .then((data) => {
        if (!cancelled) setJob(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-28 pt-6 md:max-w-2xl lg:max-w-4xl lg:pb-14 lg:px-8">
      <header className="mb-5 flex items-center gap-3">
        <Link href="/" className="btn-circle" aria-label="Back to feed">
          <IconArrowLeft />
        </Link>
        <p className="text-sm font-semibold text-muted">Job details</p>
        <ThemeToggle className="btn-circle ml-auto" />
      </header>

      {loading ? (
        <div className="glass space-y-3 p-6">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-24 w-full" />
        </div>
      ) : error || !job ? (
        <div className="glass p-6 text-center">
          <p className="font-medium text-rose">Job not found</p>
          <p className="mt-1 text-sm text-muted">{error ?? ""}</p>
          <Link href="/" className="btn-primary mt-4">
            Back to feed
          </Link>
        </div>
      ) : (
        /* Mobile: single column. Desktop: sticky summary card beside the
           description so the apply button stays in view while reading. */
        <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
          <div className="space-y-4 lg:col-span-2 lg:sticky lg:top-6">
            <div className="glass p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold leading-tight">{job.job_title}</h1>
                  <p className="mt-1 text-muted">{job.company_name || "Unknown company"}</p>
                </div>
                <span className="glass-chip shrink-0 capitalize">{job.source}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {job.work_mode && (
                  <span className={`glass-chip capitalize ${workModeTint(job.work_mode)}`}>
                    {labelize(job.work_mode)}
                  </span>
                )}
                {job.employment_type && job.employment_type !== "any" && (
                  <span className="glass-chip capitalize">
                    {labelize(job.employment_type)}
                  </span>
                )}
                {typeof job.ai_confidence === "number" && (
                  <span className="glass-chip text-accent">
                    <IconSparkles className="h-3.5 w-3.5" />
                    AI match {Math.round(job.ai_confidence * 100)}%
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-muted">
                {job.location && (
                  <p className="flex items-center gap-2">
                    <IconMapPin className="h-4 w-4" /> {job.location}
                  </p>
                )}
                {job.posted_at && (
                  <p className="flex items-center gap-2">
                    <IconClock className="h-4 w-4" /> Posted {timeAgo(job.posted_at)}
                  </p>
                )}
              </div>
            </div>

            {(job.application_url || job.source_url) && (
              <a
                href={job.application_url || job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full"
              >
                Apply / View source
                <IconExternal />
              </a>
            )}
          </div>

          {job.description && (
            <div className="glass p-5 lg:col-span-3">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                Description
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {job.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
