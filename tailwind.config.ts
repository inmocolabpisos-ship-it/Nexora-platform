/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          gold: {
            50:  "#fdf9ee",
            100: "#faf0d0",
            200: "#f4dfa0",
            300: "#ecc96a",
            400: "#e4b040",
            500: "#d4952a",
            600: "#b87820",
            700: "#8f5c18",
            800: "#6b4214",
            900: "#4a2d0e",
          },
          cream: {
            50:  "#fefcf7",
            100: "#fdf8ee",
            200: "#faf0d8",
            300: "#f5e4bc",
          },
          charcoal: {
            50:  "#f7f6f4",
            100: "#edecea",
            200: "#d8d6d2",
            300: "#b8b5af",
            400: "#8f8b84",
            500: "#6b6760",
            600: "#524f49",
            700: "#3d3b36",
            800: "#2a2825",
            900: "#1a1916",
          },
        },
        fontFamily: {
          sans: ["'Cormorant Garamond'", "Georgia", "serif"],
          body: ["'Jost'", "system-ui", "sans-serif"],
        },
      },
    },
    plugins: [],
  }