import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F4F1FF",
          100: "#E9E2FF",
          200: "#D6C8FF",
          300: "#BBA3FF",
          400: "#9C7AFB",
          500: "#7B5CF4",
          600: "#6C4CF1",
          700: "#5634D6",
          800: "#4329A9",
          900: "#31206F"
        }
      },
      boxShadow: {
        soft: "0 18px 55px rgba(42, 33, 89, 0.11)",
        card: "0 10px 30px rgba(24, 20, 50, 0.09)"
      }
    }
  },
  plugins: []
};

export default config;
