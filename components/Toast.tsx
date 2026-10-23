import { IconAlertCircle, IconCheck, IconInfo } from "@/components/icons";

export type ToastTone = "success" | "accent" | "danger";

/**
 * Short-lived feedback banner from the companion states: tinted pill with a
 * 16px icon and a one-line message (Search deleted. / Config access updated.).
 * Rendered fixed above the bottom nav on small screens.
 */
export default function Toast({
  tone = "success",
  children,
}: {
  tone?: ToastTone;
  children: React.ReactNode;
}) {
  const tint =
    tone === "success"
      ? "bg-success-bg text-success"
      : tone === "accent"
        ? "bg-accent-soft text-accent"
        : "bg-danger-bg text-danger";
  const Icon = tone === "success" ? IconCheck : tone === "accent" ? IconInfo : IconAlertCircle;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8"
    >
      <div className={`alert ${tint} w-fit max-w-md shadow-card`}>
        <Icon className="mt-px h-4 w-4 shrink-0" />
        <span>{children}</span>
      </div>
    </div>
  );
}
