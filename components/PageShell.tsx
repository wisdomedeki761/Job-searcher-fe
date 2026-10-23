import { IconHeart } from "./icons";

/**
 * Gradient page canvas + decorative blobs + 1280px content column, straight
 * from the desktop exports. Every page wraps its content in this; the light
 * and dark gradients/blobs come from CSS vars so `.dark` swaps them.
 */
export default function PageShell({
  children,
  footer = true,
}: {
  children: React.ReactNode;
  /** "Made with love by Qx dev" strip (hidden on the login screen). */
  footer?: boolean;
}) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden">
      {/* Decorative blobs (violet top-right, mint bottom-left) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[187px] -top-[180px] h-[640px] w-[936px] rounded-full opacity-70 dark:h-[454px] dark:w-[699px] dark:opacity-100"
        style={{ background: "var(--blob-a)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[104px] -left-[180px] h-[600px] w-[600px] rounded-full dark:hidden"
        style={{ background: "var(--blob-b)" }}
      />

      {/* Content column: 1280px max, generous desktop gutters */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-5 py-6 md:px-10 lg:gap-8 lg:px-20 lg:py-10">
        {children}
      </div>

      {footer && (
        <div className="relative z-10 flex items-center justify-center gap-1.5 pb-6 pt-2 text-[11px] text-muted lg:pb-8">
          <IconHeart className="h-3.5 w-3.5 text-danger" />
          Made with love by Qx dev
        </div>
      )}
    </div>
  );
}
