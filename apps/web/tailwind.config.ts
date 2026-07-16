import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF385C",
        secondary: "#0D4F4F",
        sponsored: "#F5A623",
        background: "#FAFAFA",
        textPrimary: "#1A1A1A",
        border: "#EBEBEB",
        "surface": "#fcf9f8",
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#5c3f41",
        "surface-variant": "#e5e2e1",
        "surface-container": "#f0eded",
        "surface-container-low": "#f6f3f2",
        "surface-container-highest": "#e5e2e1",
        "outline-variant": "#e5bdbe",
        "border-light": "#EBEBEB",
        "primary-container": "#e21e4a",
        "secondary-container": "#b0eaea",
        "tertiary-fixed": "#ffddb4",
        "on-secondary-fixed": "#002020",
        "on-secondary-container": "#316b6b",
        "accent-coral": "#FF385C",
        "primary-fixed": "#ffdada"
      },
      borderRadius: {
        card: "16px",
        button: "12px",
      },
      spacing: {
        "xl": "32px",
        "lg": "24px",
        "gutter": "16px",
        "xs": "8px",
        "base": "4px",
        "container-margin": "20px",
        "sm": "12px",
        "md": "16px"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        "price-display": ["Inter", "sans-serif"],
        "label-bold": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"]
      },
      fontSize: {
        "price-display": ["18px", {"lineHeight": "18px", "fontWeight": "700"}],
        "label-bold": ["14px", {"lineHeight": "16px", "fontWeight": "600"}],
        "headline-lg-mobile": ["26px", {"lineHeight": "30px", "letterSpacing": "-0.02em", "fontWeight": "600"}],
        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "headline-md": ["20px", {"lineHeight": "24px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-lg": ["32px", {"lineHeight": "36px", "letterSpacing": "-0.02em", "fontWeight": "600"}]
      },
    },
  },
  plugins: [],
};

export default config;
