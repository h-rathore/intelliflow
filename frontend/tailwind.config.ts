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
        canvas: {
          DEFAULT: "#f3ece1",
          subtle: "#e9e0d3",
        },
        cream: {
          DEFAULT: "#faf6ef",
          muted: "#cfc6b8",
        },
        well: "#241f1a",
        ink: {
          DEFAULT: "#1c1814",
          muted: "#6b6358",
          faint: "#8f877c",
        },
        signal: {
          DEFAULT: "#c6452a",
          hover: "#a83822",
          subtle: "rgba(198, 69, 42, 0.12)",
        },
        rule: {
          DEFAULT: "rgba(28, 24, 20, 0.16)",
          strong: "rgba(28, 24, 20, 0.28)",
          ink: "rgba(250, 246, 239, 0.14)",
        },
        role: {
          planner: "#2f5d8c",
          researcher: "#c4841d",
          analyst: "#2f7a5b",
          writer: "#6b4c9a",
          reviewer: "#a33d6b",
        },
        panel: {
          DEFAULT: "#faf6ef",
          elevated: "#e9e0d3",
          hover: "#e9e0d3",
          border: "rgba(28, 24, 20, 0.16)",
          "border-subtle": "rgba(28, 24, 20, 0.10)",
        },
        accent: {
          DEFAULT: "#c6452a",
          hover: "#a83822",
          subtle: "rgba(198, 69, 42, 0.12)",
          border: "#c6452a",
        },
        brand: {
          50: "#faf6ef",
          100: "#f3ece1",
          200: "#e9e0d3",
          300: "#cfc6b8",
          400: "#8f877c",
          500: "#c6452a",
          600: "#a83822",
          700: "#6b6358",
          800: "#3a332c",
          900: "#1c1814",
          950: "#14110e",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "IBM Plex Sans",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Bricolage Grotesque",
          "Georgia",
          "serif",
        ],
        mono: [
          "var(--font-mono)",
          "IBM Plex Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "2px",
        md: "3px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
      },
      boxShadow: {
        none: "none",
        stamp: "3px 3px 0 0 var(--ink)",
      },
      transitionTimingFunction: {
        studio: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
