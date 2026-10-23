/**
 * Confirmation dialog from the companion states (delete user / new password).
 * Soft scrim over the page, glass card with a colored icon, title, explanatory
 * copy and a Cancel + confirm button row.
 */
export default function ConfirmDialog({
  open,
  tone = "accent",
  icon,
  title,
  body,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  tone?: "accent" | "danger";
  icon?: React.ReactNode;
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/10 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card flex w-full max-w-[480px] flex-col items-start gap-5 p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={tone === "danger" ? "text-danger" : "text-accent"}>
          {icon}
        </span>
        <h2 className="text-[23px] font-semibold text-ink">{title}</h2>
        <p className="text-sm text-muted">{body}</p>
        <div className="flex items-start gap-2.5">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={tone === "danger" ? "btn-danger-soft" : "btn-primary"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
