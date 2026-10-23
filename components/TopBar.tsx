"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import {
  IconArrowLeft,
  IconGauge,
  IconLogout,
  IconSparkles,
  IconUser,
  IconUsers,
} from "./icons";
import { getStoredAdmin, logout, type Admin } from "@/lib/api";

/**
 * The pill top bar from the desktop exports: accent logo tile + QX wordmark
 * on the left, centered page title, and a right-side action cluster that
 * adapts to the signed-in account (Admin pill for config managers, email
 * chip + Users on admin pages, theme toggle everywhere).
 */
export default function TopBar({
  title,
  backHref,
}: {
  /** Centered page title (hidden on small screens). */
  title?: string;
  /** When set, the accent tile becomes a back arrow linking here. */
  backHref?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Admin | null>(null);

  useEffect(() => {
    setMe(getStoredAdmin());
  }, [pathname]);

  const onAdmin = pathname.startsWith("/admin");

  function doLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="topbar">
      {/* Brand / back */}
      <div className="flex items-center gap-3">
        {backHref ? (
          <Link href={backHref} className="logo-tile" aria-label="Back">
            <IconArrowLeft />
          </Link>
        ) : (
          <Link href="/" className="logo-tile" aria-label="QX Scraper home">
            <IconSparkles />
          </Link>
        )}
        <span className="text-3xl font-bold text-accent">QX</span>
      </div>

      {/* Centered page title */}
      {title && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-3xl font-semibold text-accent lg:block">
          {title}
        </span>
      )}

      {/* Right action cluster */}
      <div className="ml-auto flex items-center gap-2">
        {/* Admin pill — feed pages for config managers */}
        {me?.can_manage_configs && !onAdmin && (
          <Link href="/admin" className="btn-ghost gap-1.5 px-3.5">
            <IconGauge className="h-4 w-4 text-accent" />
            Admin
          </Link>
        )}

        {/* Email chip — admin pages */}
        {onAdmin && me && (
          <span className="chip hidden max-w-48 truncate md:inline-flex">
            {me.email}
          </span>
        )}

        {/* Users — super admin */}
        {onAdmin && me?.role === "super_admin" && (
          <Link href="/admin/users" className="icon-btn" aria-label="Users">
            <IconUsers />
          </Link>
        )}

        <Link href="/admin/profile" className="icon-btn" aria-label="Account">
          <IconUser />
        </Link>
        <ThemeToggle />
        {onAdmin && (
          <button
            type="button"
            onClick={doLogout}
            className="icon-btn"
            aria-label="Log out"
          >
            <IconLogout />
          </button>
        )}
      </div>
    </header>
  );
}
