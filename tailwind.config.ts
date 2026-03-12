import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 24% 88%)",
        input: "hsl(214 24% 88%)",
        ring: "hsl(204 84% 45%)",
        background: "hsl(45 40% 98%)",
        foreground: "hsl(215 28% 17%)",
        primary: {
          DEFAULT: "hsl(213 78% 43%)",
          foreground: "hsl(210 40% 98%)",
        },
        secondary: {
          DEFAULT: "hsl(200 20% 95%)",
          foreground: "hsl(215 25% 27%)",
        },
        muted: {
          DEFAULT: "hsl(48 33% 96%)",
          foreground: "hsl(215 16% 47%)",
        },
        accent: {
          DEFAULT: "hsl(24 100% 94%)",
          foreground: "hsl(20 88% 26%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(215 28% 17%)",
        },
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 24px 60px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
} satisfies Config;
