// Central site configuration, single source of truth for external app URLs,
// API endpoint, and brand contact details. Keeps references consistent across
// the marketing site so launch-time changes happen in one place.

// Canonical site origin for SEO (apex 301-redirects here, so www is canonical).
export const SITE_URL = "https://www.loopital.com";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

// Externally-hosted product apps (their own landing pages live on subdomains).
// Pal (formerly STACK62) is the workspace every Loopital account can open.
export const PAL_URL = "https://pal.loopital.com";
export const STACK62_URL = PAL_URL; // legacy alias
export const SART34_URL = "https://swift.loopital.com";
export const FMS13_URL = "https://fms13.loopital.com";
export const HENHOLIB_URL = "https://henholib.loopital.com";

// Paystack public key (safe to expose), used to redirect to hosted checkout.
export const PAYSTACK_PUBLIC_KEY = "pk_test_13449920aaa915f243a95926ec029dfe609dbbee";

// Google Sign-In client ID (public, safe to expose). The Google button uses it
// to obtain an ID token that the backend verifies. Configure loopital.com +
// sart34.loopital.com as authorized JavaScript origins in the Google console.
export const GOOGLE_CLIENT_ID =
  "673117866604-4f0h5o89jdnams4h7aqej09lqsl3ngqk.apps.googleusercontent.com";

// SART34 is the only product with a mobile app. Replace these placeholders
// with the real store listings when available.
export const SART34_APP_STORE_URL = "#";
export const SART34_PLAY_STORE_URL = "#";

// Backend API base. Injected at build time via Vite env (VITE_API_BASE_URL);
// falls back to same-origin "/api" for local dev behind a proxy.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

// Founder portrait, used on the founder profile page and Academy instructor
// blocks. Swap this single constant (and the file in /public) to change it
// everywhere.
export const FOUNDER_IMAGE = "/tuamene.jpg";

// Founder social profiles (order defines display order).
export const FOUNDER_SOCIALS = [
  { network: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/tuamene-bestgod" },
  { network: "x", label: "X", href: "https://x.com/BTuamene" },
  { network: "instagram", label: "Instagram", href: "https://www.instagram.com/btuamene" },
  { network: "facebook", label: "Facebook", href: "https://facebook.com/bestgod.tuamene" },
  { network: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@btuamene" },
] as const;

export const CONTACT_EMAIL = "info@loopital.com";
export const COMPANY_ADDRESS =
  "Pyale Hub, 21 Bekwere Wosu Street, D-Line, Diobu, Port Harcourt, Rivers State, Nigeria";
