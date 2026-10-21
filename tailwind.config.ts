import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft neumorphic palette, driven by CSS variables so dark mode is a
        // single `.dark` class flip (see globals.css). The <alpha-value>
        // placeholder keeps utilities like `bg-accent/15` working.
        base: "rgb(var(--c-base) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        accentSoft: "rgb(var(--c-accent-soft) / <alpha-value>)",
        mint: "rgb(var(--c-mint) / <alpha-value>)",
        peach: "rgb(var(--c-peach) / <alpha-value>)",
        rose: "rgb(var(--c-rose) / <alpha-value>)",
      },
      boxShadow: {
        // Neumorphism shadows swap their light/dark stops per theme via vars.
        neu: "var(--neu-raised)",
        "neu-sm": "var(--neu-sm)",
        "neu-inset": "var(--neu-inset)",
        "neu-press": "var(--neu-press)",
        // Glass card
        glass: "var(--shadow-glass)",
        glow: "var(--shadow-glow)",
      },
      backdropBlur: { xs: "2px" },
      borderRadius: { "4xl": "2rem" },
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
        "slide-up": "slide-up 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
