// Brand tokens for use in inline styles (this codebase styles via inline
// `style={}` props). Mirrors the CSS custom properties in styles/theme.css so
// JS and CSS stay in lockstep. Import these instead of hardcoding hex values.

export const colors = {
  // Neutral foundation
  bg: "#FBFBFD",
  surface: "#FFFFFF",
  surfaceMuted: "#F5F5F7",
  heading: "#1D1D1F",
  text: "#0A0A0F",
  textSecondary: "#6E6E73",
  textTertiary: "#86868B",
  hairline: "rgba(0,0,0,0.07)",

  // Brand
  blue: "#2563EB",
  cyan: "#0EA5E9",
  green: "#10B981",
  ink: "#06080F", // deep near-black for the rare dramatic dark beat
} as const;

// Signature blue→green gradient — the single brand accent. Use sparingly.
export const gradientBrand =
  "linear-gradient(120deg, #2563EB 0%, #0EA5E9 45%, #10B981 100%)";
export const gradientBrandSoft =
  "linear-gradient(120deg, rgba(37,99,235,0.12) 0%, rgba(14,165,233,0.10) 45%, rgba(16,185,129,0.12) 100%)";

// Per-product accents — harmonized within the blue–green family.
export const productAccent = {
  stack62: "#6D6AF0",
  sart34: "#0EA5E9",
  hms7: "#10B981",
  fms13: "#0891B2",
} as const;

// Soft, low-contrast elevation used across cards and panels.
export const shadow = {
  sm: "0 8px 24px rgba(0,0,0,0.05)",
  md: "0 20px 60px rgba(0,0,0,0.06)",
  lg: "0 40px 90px rgba(0,0,0,0.10)",
} as const;
