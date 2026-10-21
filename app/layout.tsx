import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AJ Scraper — Job Feed",
  description: "AI-assisted job scraping dashboard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1118" },
  ],
};

/**
 * Applies the saved (or system) theme before first paint so dark mode never
 * flashes white. Runs synchronously at the top of <body>, ahead of any UI.
 */
const themeBootstrap = `(function(){try{var s=localStorage.getItem("aj_theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <Sidebar />
        {/* Content clears the fixed sidebar only on desktop */}
        <div className="lg:pl-64">{children}</div>
      </body>
    </html>
  );
}
