// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#DC2626",
          hover: "#B91C1C",
          ruby: "#E11D48",
        },
        surface: {
          DEFAULT: "#FFF1F2",
          card: "#FFE4E6",
        },
        medical: {
          teal: "#059669",
          emerald: "#0D9488",
        },
        ink: {
          heading: "#0F172A",
          body: "#334155",
        },
      },
      keyframes: {
        drip: {
          "0%": { transform: "translateY(-20px) scale(0.8)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(25px) scale(1)", opacity: "0" },
        },
      },
      animation: {
        drip: "drip 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;