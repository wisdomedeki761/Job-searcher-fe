"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { IconBriefcase, IconGauge } from "./icons";

/**
 * Fixed glass sidebar, shown on desktop (lg+). On smaller screens the
 * BottomNav pill takes over. Active state follows the current route.
 */
const NAV = [
  { href: "/", label: "Jobs", Icon: IconBriefcase },
  { href: "/admin", label: "Admin", Icon: IconGauge },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 p-4 lg:flex" aria-label="Main navigation">
      <div className="glass flex w-full flex-col p-4">
        <div className="mb-6 px-2 pt-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
            Job Feed
          </p>
          <p className="text-lg font-bold">QX Scraper</p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent/15 text-accent shadow-glow"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center justify-between px-2 pb-1">
          <span className="text-[11px] font-medium text-muted">Dark mode</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
