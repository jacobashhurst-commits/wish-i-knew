import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "wik-navy": "#0D1B2A",
        "wik-deep-ocean": "#145C72",
        "wik-ocean": "#1D809F",
        "wik-aqua": "#4EC6C1",
        "wik-sky": "#DDF6FF",
        "wik-cream": "#FFF6E6",
        "wik-sand": "#F4D6A0",
        "wik-coral": "#FF6B6B",
        "wik-sun": "#FFC857",
        "wik-gum": "#6FAF8E",
        "wik-jacaranda": "#A78BFA",
        "wik-ink": "#172033",
        "wik-muted": "#697386",
      },
    },
  },
  plugins: [],
};

export default config;
