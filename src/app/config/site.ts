// Central site configuration: canonical URL, API endpoint, and brand contact
// details. Keeps references consistent across
// the marketing site so launch-time changes happen in one place.

// Canonical site origin for SEO (www 301-redirects to the apex).
export const SITE_URL = "https://loopital.com";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

// The hub API, served same-origin at /hub. Overridable at build time
// (VITE_API_BASE_URL) for local development against another host.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/hub"
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
