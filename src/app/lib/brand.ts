// Brand tokens for use in inline styles (this codebase styles via inline
// `style={}` props). Mirrors the CSS custom properties in styles/theme.css so
// JS and CSS stay in lockstep. Import these instead of hardcoding hex values.

export const colors = {
  // ── Neutral foundation (light, but not bare) ────────────────────────────
  // The canvas was flat #FBFBFD everywhere, which read as glare rather than as
  // design. These neutrals are *tinted* — a few points of blue mixed into every
  // grey — so the page has a temperature instead of being an absence of colour,
  // and white cards sitting on it actually look like cards.
  bg: "#F2F5FB",           // page ground, cool and soft
  bgWarm: "#FBF6F2",       // the alternate wash, for a section that needs a turn
  surface: "#FFFFFF",      // cards and panels
  surfaceMuted: "#E9EFF9", // insets, chips, table stripes
  surfaceRaised: "#F7FAFF",

  heading: "#0F1729",
  text: "#1B2437",
  textSecondary: "#556074",
  textTertiary: "#646F81",

  hairline: "rgba(15,23,41,0.08)",
  hairlineStrong: "rgba(15,23,41,0.14)",

  // ── Brand ──────────────────────────────────────────────────────────────
  blue: "#2563EB",
  cyan: "#0EA5E9",
  green: "#10B981",
  violet: "#6D5AF0",
  amber: "#F59E0B",
  rose: "#E11D48",
  ink: "#0B1020",

  // Kept so a component on a dark or coloured band can name its own contrast
  // instead of guessing.
  lightSurface: "#FFFFFF",
  onLight: "#0F1729",
  onDark: "#FFFFFF",
} as const;

/**
 * Soft colour washes for section backgrounds.
 *
 * The fix for "too white" is not darkness, it is variation: alternating these
 * down the page gives each band its own temperature, so sections separate
 * without borders and the eye has somewhere to travel.
 */
export const wash = {
  sky: "linear-gradient(180deg, #EEF4FF 0%, #F5F9FF 100%)",
  mint: "linear-gradient(180deg, #ECFBF4 0%, #F4FCF8 100%)",
  violet: "linear-gradient(180deg, #F1EEFE 0%, #F7F5FF 100%)",
  peach: "linear-gradient(180deg, #FFF2EA 0%, #FFF8F4 100%)",
  plain: "#FFFFFF",
} as const;

/** A 10%-ish tint of any accent, for chips and card headers. */
export const tint = (hex: string, alpha = 0.12) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

// Signature blue→green gradient, the single brand accent. Use sparingly.
export const gradientBrand =
  "linear-gradient(120deg, #2563EB 0%, #0EA5E9 45%, #10B981 100%)";
export const gradientBrandSoft =
  "linear-gradient(120deg, rgba(37,99,235,0.12) 0%, rgba(14,165,233,0.10) 45%, rgba(16,185,129,0.12) 100%)";

// Per-product accents, harmonized within the blue-green family.
export const productAccent = {
  stack62: "#6D5AF0",
  hms7: "#0D9F79",
  henholib: "#F97316",
  fms13: "#0891B2",
  edm73: "#D6294E",
} as const;

// Soft, low-contrast elevation used across cards and panels.
// Shadows carry almost nothing on a dark ground — depth comes from the surface
// ladder above. These stay for layering large panels off the page background.
// Cool-tinted shadows rather than neutral black: a grey shadow on a tinted
// canvas looks like dirt, a blue-tinted one looks like depth.
export const shadow = {
  sm: "0 6px 18px rgba(15,23,41,0.06)",
  md: "0 18px 44px rgba(15,23,41,0.09)",
  lg: "0 36px 80px rgba(15,23,41,0.13)",
} as const;
