import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#0e1124", panel: "#161a33", line: "#262b4d", brand: "#7c6cf6", glow: "#fb8a4a" },
    },
  },
  plugins: [],
};
export default config;
