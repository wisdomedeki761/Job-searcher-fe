import Link from "next/link";
import { IconMapPin, IconClock, IconSparkles } from "./icons";
import { timeAgo, labelize, workModeTint } from "@/lib/format";
import type { Job } from "@/lib/api";

/** First letter of the company, used for the avatar tile. */
function initial(name?: string): string {
  return (name || "?").trim().charAt(0).toUpperCase();
}

/**
 * Job card from the feed export: avatar tile + company + source chip, title,
 * work-mode/employment chips, then location and age.
 */
export default function JobCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="card animate-slide-up flex min-h-[210px] min-w-0 flex-col gap-[18px] p-[22px] transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-2">
        <span className="avatar h-7 w-7">{initial(job.company_name)}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted">
          {job.company_name || "Unknown company"}
        </span>
        <span className="chip shrink-0 capitalize">{job.source}</span>
      </div>

      <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-ink">
        {job.job_title || "Untitled role"}
      </h3>

      <div className="flex flex-wrap items-center gap-1.5">
        {job.work_mode && (
          <span className={`chip capitalize ${workModeTint(job.work_mode)}`}>
            {labelize(job.work_mode)}
          </span>
        )}
        {job.employment_type && job.employment_type !== "any" && (
          <span className="chip capitalize">{labelize(job.employment_type)}</span>
        )}
        {typeof job.ai_confidence === "number" && (
          <span className="chip chip-accent">
            <IconSparkles className="h-3 w-3" />
            AI match {Math.round(job.ai_confidence * 100)}%
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-[7px] text-[11px] text-muted">
        <IconMapPin className="h-[13px] w-[13px]" />
        <span className="min-w-0 flex-1 truncate">
          {job.location || "Anywhere"}
        </span>
        <IconClock className="h-[13px] w-[13px]" />
        <span className="shrink-0">{timeAgo(job.posted_at || job.first_seen_at)}</span>
      </div>
    </Link>
  );
}
