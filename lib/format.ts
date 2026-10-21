/** Small formatting helpers shared across pages. */

export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Map backend enum values to display labels. */
export function labelize(v: string): string {
  if (!v) return "—";
  return v
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Color hint for work mode chips. */
export function workModeTint(mode: string): string {
  switch (mode) {
    case "remote":
      return "text-mint border-mint/30 bg-mint/10";
    case "hybrid":
      return "text-peach border-peach/30 bg-peach/10";
    case "onsite":
      return "text-rose border-rose/30 bg-rose/10";
    default:
      return "text-muted border-white/60 bg-white/40 dark:border-white/10 dark:bg-white/[0.06]";
  }
}
