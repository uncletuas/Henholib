// Central site configuration, single source of truth for external app URLs,
// API endpoint, and brand contact details. Keeps references consistent across
// the marketing site so launch-time changes happen in one place.

// Canonical site origin for SEO (apex 301-redirects here, so www is canonical).
export const SITE_URL = "https://www.loopital.com";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

// Externally-hosted product apps (their own landing pages live on subdomains).
//
// Named after the products, not the codenames they shipped under. The codenames
// still exist as ids in the database and in the SSO handshake — renaming those
// would break federation — but nothing a visitor can click should carry one.
// fms13.loopital.com in particular is dead and has no DNS record at all: Modus
// lives at modus.loopital.com.
export const PAL_URL = "https://pal.loopital.com";
export const HENHOLIB_URL = "https://henholib.loopital.com";
// Beacon has a subdomain but no deployment behind it yet, so it is deliberately
// not linked from anywhere on the marketing site — a live link to a placeholder
// is worse than no link. Add it to the Beacon product entry once it serves.
export const BEACON_URL = "https://beacon.loopital.com";

// Google Sign-In client ID (public, safe to expose). The Google button uses it
// to obtain an ID token that the backend verifies. Configure loopital.com +
// www.loopital.com as authorized JavaScript origins in the Google console.
export const GOOGLE_CLIENT_ID =
  "673117866604-4f0h5o89jdnams4h7aqej09lqsl3ngqk.apps.googleusercontent.com";

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

// The fundraiser, on Crowdr. One call site now — the end of the contribute
// questionnaire, offered to people who have just finished it. It stays named
// here rather than inlined there because it is the kind of URL that is easier
// to check and replace when it lives with the other external addresses.
export const DONATE_URL =
  "https://www.oncrowdr.com/explore/c/help-us-bring-one-free-health-record-to-every-nigerian-hospital";

export const CONTACT_EMAIL = "info@loopital.com";
// No public office address for now — the company is registered in Nigeria but
// does not publish a street address. Anything that needs to reach us uses the
// contact form or the published email.
