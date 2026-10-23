import { IconAlertCircle, IconCheck } from "@/components/icons";

/**
 * Inline alert box from the companion states: icon + short text, danger or
 * success tint. Used for form feedback (validation, profile saved, SMTP note).
 */
export default function Alert({
  tone = "danger",
  children,
  className = "",
}: {
  tone?: "danger" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const tint =
    tone === "success"
      ? "bg-success-bg text-success"
      : "bg-danger-bg text-danger";
  return (
    <p className={`alert ${tint} ${className}`}>
      {tone === "success" ? (
        <IconCheck className="mt-px h-4 w-4 shrink-0" />
      ) : (
        <IconAlertCircle className="mt-px h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
    </p>
  );
}
