import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          soft: "rgb(var(--ink-soft-rgb) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--paper-rgb) / <alpha-value>)",
          raised: "rgb(var(--paper-raised-rgb) / <alpha-value>)",
        },
        redline: {
          DEFAULT: "rgb(var(--redline-rgb) / <alpha-value>)",
          deep: "rgb(var(--redline-deep-rgb) / <alpha-value>)",
        },
        chrome: {
          DEFAULT: "rgb(var(--chrome-rgb) / <alpha-value>)",
          dark: "rgb(var(--chrome-dark-rgb) / <alpha-value>)",
        },
        asphalt: "rgb(var(--asphalt-rgb) / <alpha-value>)",
        racing: "rgb(var(--racing-rgb) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        lot: "0 1px 2px rgba(14,17,22,0.04), 0 12px 30px -18px rgba(14,17,22,0.35)",
        "lot-hover": "0 2px 4px rgba(14,17,22,0.06), 0 22px 48px -20px rgba(14,17,22,0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
