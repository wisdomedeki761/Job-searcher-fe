import type { Config } from "tailwindcss";

/**
 * QX Scraper global theme — every color code from the Figma desktop exports.
 * Light values live on `:root`, dark values on `.dark` (see globals.css);
 * flipping that one class re-themes the whole app.
 *
 * Triplet tokens (ink, muted, accent, …) keep the `<alpha-value>` placeholder
 * so `text-ink/60` style modifiers work. Raw `var()` tokens (surface, field)
 * carry baked-in opacity from the design and don't support modifiers.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Set by next/font as --font-inter / --font-plex-mono on <html>.
        inter: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        // IBM Plex Mono carries cron expressions and other machine text.
        mono: [
          "var(--font-plex-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        /* text & brand */
        ink: "rgb(var(--c-ink) / <alpha-value>)", // #20243F / #F0F0FF
        muted: "rgb(var(--c-muted) / <alpha-value>)", // #72778F / #A6AEC9
        placeholder: "rgb(var(--c-placeholder) / <alpha-value>)", // #979DB1
        accent: "rgb(var(--c-accent) / <alpha-value>)", // #6253E8
        "accent-soft": "rgb(var(--c-accent-soft) / <alpha-value>)", // #EBE8FF
        line: "rgb(var(--c-line) / <alpha-value>)", // #DDE1EF / #3A405D

        /* status */
        success: "rgb(var(--c-success) / <alpha-value>)", // #27765D
        "success-bg": "rgb(var(--c-success-bg) / <alpha-value>)", // #DDF4E9
        "success-line": "rgb(var(--c-success-line) / <alpha-value>)", // #ADDAC5
        warning: "rgb(var(--c-warning) / <alpha-value>)", // #A66B3F
        "warning-bg": "rgb(var(--c-warning-bg) / <alpha-value>)", // #FBEBDD
        danger: "rgb(var(--c-danger) / <alpha-value>)", // #B64D70
        "danger-bg": "rgb(var(--c-danger-bg) / <alpha-value>)", // #FBE6ED

        /* fixed-opacity surfaces (no alpha modifiers) */
        surface: "var(--surface)", // glass card
        field: "var(--field)", // input / neutral chip well
      },
      boxShadow: {
        card: "var(--card-shadow)", // 0 12px 36px rgba(52,54,90,0.04)
        accent: "var(--accent-shadow)", // 0 10px 24px rgba(96,84,211,0.18)
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        "slide-up": "slide-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
