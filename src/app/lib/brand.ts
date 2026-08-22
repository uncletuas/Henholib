// Brand tokens for use in inline styles (this codebase styles via inline
// `style={}` props). Mirrors the CSS custom properties in styles/theme.css so
// JS and CSS stay in lockstep. Import these instead of hardcoding hex values.

export const colors = {
  // ── Neutral foundation (dark) ──────────────────────────────────────────
  // The site reads dark now. These are picked as a ladder rather than by eye:
  // each surface is a measured step up from the ground so panels separate
  // without borders doing the work, and the type steps down in the same way.
  //
  // Not pure black — #000 against bright brand colour vibrates, and a slight
  // blue cast keeps the blue→green gradient sitting in the same family as its
  // background instead of floating on top of it.
  bg: "#0A0B0F",          // page ground
  surface: "#121419",     // cards and panels
  surfaceMuted: "#1A1D24", // insets, chips, code blocks
  surfaceRaised: "#22262F", // hover states, the step above a card

  heading: "#F4F5F7",
  text: "#E6E8EC",
  textSecondary: "#A2A9B8",
  textTertiary: "#767E8E",

  hairline: "rgba(255,255,255,0.08)",
  hairlineStrong: "rgba(255,255,255,0.14)",

  // ── Brand ──────────────────────────────────────────────────────────────
  // Lifted from the light-theme values. #2563EB is a fine blue on white and
  // muddy on near-black; these clear 4.5:1 against `bg` so a link or a label
  // is readable rather than merely visible.
  blue: "#4F8CFF",
  cyan: "#38BDF8",
  green: "#34D399",
  ink: "#06080F",

  // Kept for the rare panel that stays light on purpose.
  lightSurface: "#FFFFFF",
  onLight: "#0D0D1A",
} as const;

// Signature blue→green gradient, the single brand accent. Use sparingly.
export const gradientBrand =
  "linear-gradient(120deg, #2563EB 0%, #0EA5E9 45%, #10B981 100%)";
export const gradientBrandSoft =
  "linear-gradient(120deg, rgba(37,99,235,0.12) 0%, rgba(14,165,233,0.10) 45%, rgba(16,185,129,0.12) 100%)";

// Per-product accents, harmonized within the blue-green family.
export const productAccent = {
  stack62: "#6D6AF0",
  sart34: "#0EA5E9",
  hms7: "#14B58A",
  henholib: "#F97316",
  fms13: "#0891B2",
  edm73: "#A61E36",
} as const;

// Soft, low-contrast elevation used across cards and panels.
// Shadows carry almost nothing on a dark ground — depth comes from the surface
// ladder above. These stay for layering large panels off the page background.
export const shadow = {
  sm: "0 8px 24px rgba(0,0,0,0.35)",
  md: "0 20px 60px rgba(0,0,0,0.45)",
  lg: "0 40px 90px rgba(0,0,0,0.55)",
} as const;
