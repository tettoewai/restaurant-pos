import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    keyframes: {
      shimmer: {
        "100%": {
          transform: "translateX(100%)",
        },
      },
    },
  },
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: "#ffffff",
            foreground: "#000000",
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
        dark: {
          colors: {
            background: "#1f2937",
            foreground: "#ffffff",
            primary: "#ef4444",
            secondary: "#000000",
          },
        },
      },
    }),
  ],
};

export default config;
