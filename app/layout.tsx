import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// IBM Plex Mono carries cron expressions and other machine-readable text,
// matching the `font-iBMPlexMono` used across the Figma exports.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QX Scraper — Job Feed",
  description: "AI-assisted job scraping dashboard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1F2FD" },
    { media: "(prefers-color-scheme: dark)", color: "#141220" },
  ],
};

/**
 * Applies the saved (or system) theme before first paint so dark mode never
 * flashes white. Runs synchronously at the top of <body>, ahead of any UI.
 * The choice is persisted in localStorage("qx_theme") by ThemeToggle and
 * survives reloads until the user switches it again.
 */
const themeBootstrap = `(function(){try{var s=localStorage.getItem("qx_theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-inter">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        {children}
      </body>
    </html>
  );
}
