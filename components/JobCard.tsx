import Link from "next/link";
import { IconMapPin, IconClock, IconExternal } from "./icons";
import { timeAgo, labelize, workModeTint } from "@/lib/format";
import type { Job } from "@/lib/api";

/**
 * Job card: glass panel with neumorphic accents. Title/company link to the
 * detail page; the apply/source link opens externally.
 */
export default function JobCard({ job }: { job: Job }) {
  return (
    <article className="glass min-w-0 animate-slide-up p-4 transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold leading-tight text-ink">
            {job.job_title || "Untitled role"}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted">
            {job.company_name || "Unknown company"}
          </p>
        </Link>
        <span className="glass-chip shrink-0 capitalize">{job.source}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
        {job.location && (
          <span className="inline-flex items-center gap-1">
            <IconMapPin className="h-3.5 w-3.5" />
            <span className="max-w-40 truncate">{job.location}</span>
          </span>
        )}
        {job.posted_at && (
          <span className="inline-flex items-center gap-1">
            <IconClock className="h-3.5 w-3.5" />
            {timeAgo(job.posted_at)}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.work_mode && (
          <span className={`glass-chip capitalize ${workModeTint(job.work_mode)}`}>
            {labelize(job.work_mode)}
          </span>
        )}
        {job.employment_type && job.employment_type !== "any" && (
          <span className="glass-chip capitalize">{labelize(job.employment_type)}</span>
        )}
        {typeof job.ai_confidence === "number" && (
          <span className="glass-chip text-accent">
            AI {Math.round(job.ai_confidence * 100)}%
          </span>
        )}
        <span className="flex-1" />
        <Link
          href={`/jobs/${job.id}`}
          className="btn-circle h-9 w-9"
          aria-label="Open job"
        >
          <IconExternal className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
