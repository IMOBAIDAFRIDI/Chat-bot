/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        chat: {
          bg: {
            light: "#F9FAFB",
            dark: "#131316",
          },
          sidebar: {
            light: "#F3F4F6",
            dark: "#09090B",
          },
          card: {
            light: "#FFFFFF",
            dark: "#1C1C21",
          },
          border: {
            light: "#E5E7EB",
            dark: "#27272A",
          },
          accent: "#10A37F", // OpenAI Emerald
          accentHover: "#0E8E6F",
        },
      },
    },
  },
  plugins: [],
};
