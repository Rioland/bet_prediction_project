/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#16A34A",
          50: "#ECFDF3",
          100: "#D1FADF",
          400: "#34D399",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D"
        },
        ink: {
          DEFAULT: "#0B1220",
          800: "#131C2E",
          700: "#1C2740",
          600: "#2A3550"
        }
      }
    }
  },
  plugins: []
};
