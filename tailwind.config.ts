import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#0BCC99",
          hover: "#09B387",
          soft: "#EDFAF6",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#F7F7F7",
        },
        ink: {
          DEFAULT: "#0F0F0F",
          muted: "#565859",
          faint: "#9A9A9A",
        },
        border: "#E5E5E5",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
