/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14201C",
          muted: "#4A5752",
          soft: "#6B756F",
        },
        paper: "#F4EFE6",
        cream: "#FAF7F1",
        sand: "#E4D6C3",
        copper: {
          DEFAULT: "#B86A3D",
          dark: "#8F4E2B",
          light: "#D4A07A",
        },
        pine: {
          DEFAULT: "#1F4E46",
          light: "#2E6B60",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 40px -24px rgba(20, 32, 28, 0.35)",
      },
    },
  },
  plugins: [],
};
