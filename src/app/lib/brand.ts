// Brand tokens for use in inline styles (this codebase styles via inline
// `style={}` props). Mirrors the CSS custom properties in styles/theme.css so
// JS and CSS stay in lockstep. Import these instead of hardcoding hex values.

export const colors = {
  // ── Neutral foundation ──────────────────────────────────────────────────
  // White, and genuinely white. The previous palette mixed a few points of blue
  // into every grey on the theory that a tinted canvas has "temperature". In
  // practice a page of faintly blue panels reads as a template. Separation now
  // comes from hairlines and space, which is what it comes from on every site
  // that looks considered.
  bg: "#FFFFFF",           // page ground
  bgSubtle: "#F7F7F8",     // the one step down, for a band that needs to recede
  surface: "#FFFFFF",      // cards and panels
  surfaceMuted: "#F2F2F4", // insets, chips, table stripes
  surfaceRaised: "#FFFFFF",

  // Near-black rather than blue-black, and greys that are actually grey.
  heading: "#0A0A0B",
  text: "#1A1A1C",
  textSecondary: "#5B5D63",
  textTertiary: "#8A8C93",

  hairline: "rgba(10,10,11,0.10)",
  hairlineStrong: "rgba(10,10,11,0.18)",

  // ── Brand ──────────────────────────────────────────────────────────────
  /** The primary. Pal's violet, and what any "brand colour" call site should use. */
  primary: "#6D5AF0",
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
 * Section grounds.
 *
 * These used to be four tinted gradients, alternated down the page so each band
 * had its own colour. That is the tell of a generated site. There are two now:
 * white, and one flat step down for a band that genuinely needs to recede. No
 * gradients. Sections separate by space and by a hairline, not by hue.
 */
export const wash = {
  plain: "#FFFFFF",
  subtle: "#F7F7F8",
  // Aliases kept so existing callers keep compiling; all resolve to the same
  // two grounds rather than four different tints.
  sky: "#F7F7F8",
  mint: "#FFFFFF",
  violet: "#F7F7F8",
  peach: "#FFFFFF",
} as const;

/** A 10%-ish tint of any accent, for chips and card headers. */
export const tint = (hex: string, alpha = 0.12) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * The primary action is near-black, not a gradient.
 *
 * A three-stop blue-to-green gradient on every button is the loudest thing on
 * the page and says nothing. Solid ink reads as deliberate, and it leaves the
 * product accents free to mean something when they do appear.
 *
 * `gradientBrand` keeps its name because a dozen call sites use it; it is now
 * simply the ink fill.
 */
export const gradientBrand = "#0A0A0B";
export const gradientBrandSoft = "rgba(10,10,11,0.06)";

// Per-product accents, harmonized within the blue-green family.
export const productAccent = {
  stack62: "#6D5AF0",
  hms7: "#0D9F79",
  henholib: "#F97316",
  fms13: "#0891B2",
  edm73: "#D6294E",
} as const;

// Elevation, deliberately almost nothing.
// On a white ground a heavy drop shadow is the other tell of a template. Depth
// comes from a hairline border; these exist only so a panel that genuinely
// floats (a modal, an image) can lift off the page by a hair.
export const shadow = {
  sm: "0 1px 2px rgba(10,10,11,0.04)",
  md: "0 4px 16px rgba(10,10,11,0.06)",
  lg: "0 12px 40px rgba(10,10,11,0.10)",
} as const;
