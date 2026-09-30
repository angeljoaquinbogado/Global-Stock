/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        apex: {
          crimson: "#8F0000",
          light: "#F5F5F7",
          ink: "#1D1D1F",
          dark: "#1C1C1E"
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        glass: "0 24px 80px rgba(0,0,0,.16)",
        crimson: "0 16px 50px rgba(143,0,0,.28)"
      }
    }
  },
  plugins: []
};
