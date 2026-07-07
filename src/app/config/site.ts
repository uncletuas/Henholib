// Central site configuration — single source of truth for external app URLs,
// API endpoint, and brand contact details. Keeps references consistent across
// the marketing site so launch-time changes happen in one place.

// Canonical site origin for SEO (apex 301-redirects here, so www is canonical).
export const SITE_URL = "https://www.loopital.com";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

// Externally-hosted product apps (their own landing pages live on subdomains).
export const STACK62_URL = "https://stack62.loopital.com";
export const SART34_URL = "https://sart34.loopital.com";
export const FMS13_URL = "https://fms13.loopital.com";
export const HENHOLIB_URL = "https://henholib.loopital.com";

// SART34 is the only product with a mobile app. Replace these placeholders
// with the real store listings when available.
export const SART34_APP_STORE_URL = "#";
export const SART34_PLAY_STORE_URL = "#";

// Backend API base. Injected at build time via Vite env (VITE_API_BASE_URL);
// falls back to same-origin "/api" for local dev behind a proxy.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export const CONTACT_EMAIL = "contact@loopital.com";
export const COMPANY_ADDRESS =
  "Pyale Hub, 21 Bekwere Wosu Street, D-Line, Diobu, Port Harcourt, Rivers State, Nigeria";
