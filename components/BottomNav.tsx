import Link from "next/link";

/**
 * Floating mobile navigation, kept only for small screens until the mobile
 * designs arrive — on desktop the pill TopBar takes over. Items are passed
 * in so each page tailors the destinations.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

export default function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="card pointer-events-auto flex w-full max-w-md items-center justify-around gap-1 px-2 py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[11px] font-medium transition ${
              item.active
                ? "text-accent"
                : "text-muted hover:text-ink"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                item.active ? "bg-accent-soft" : ""
              }`}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
