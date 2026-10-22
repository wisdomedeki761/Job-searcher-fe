"use client";

import { IconMoon, IconSun } from "./icons";

/**
 * Light/dark switch. The current theme is pure CSS (`.dark` on <html>, set
 * before paint by the inline script in app/layout.tsx), so the visible icon
 * is driven by the class too — no hydration mismatch, no flash.
 */
export default function ThemeToggle({ className = "btn-circle" }: { className?: string }) {
  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("qx_theme", next ? "dark" : "light");
    } catch {
      /* private mode — theme just won't persist */
    }
  }

  return (
    <button type="button" onClick={toggle} className={className} aria-label="Toggle dark mode">
      {/* Moon while light (click to go dark), sun while dark */}
      <span className="flex dark:hidden">
        <IconMoon />
      </span>
      <span className="hidden dark:flex">
        <IconSun />
      </span>
    </button>
  );
}
