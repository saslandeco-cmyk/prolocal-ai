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
        background: "var(--background)",
        foreground: "var(--foreground)",
        landes: {
          pine: "#1A3A2A",
          forest: "#2D5A3D",
          sage: "#4A7C5E",
          moss: "#7BAE8A",
          sand: "#E8D5A3",
          dune: "#C9A96E",
          ocean: "#1E5B8A",
          sky: "#3A8FBF",
          amber: "#D4860A",
          cream: "#FAF7F0",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "landes-hero": "linear-gradient(135deg, #1A3A2A 0%, #2D5A3D 50%, #1E5B8A 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
