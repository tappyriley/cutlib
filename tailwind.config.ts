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
          DEFAULT: "#E6253A",
          hover: "#C81F30",
          soft: "#FFF0F2",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#F6F4F9",
        },
        ink: {
          DEFAULT: "#18181F",
          muted: "#64647A",
          faint: "#9898B2",
        },
        border: "#E4E1ED",
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
