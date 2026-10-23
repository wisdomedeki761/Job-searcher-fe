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

/**
 * Chip variant class for a work mode, matching the export's status tints:
 * remote → success green, hybrid → warning amber, onsite → danger rose.
 * Returns extra classes to layer on top of the base `chip` class.
 */
export function workModeTint(mode: string): string {
  switch (mode) {
    case "remote":
      return "chip-success";
    case "hybrid":
      return "chip-warning";
    case "onsite":
      return "chip-danger";
    default:
      return "";
  }
}
