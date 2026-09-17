// Per-route SEO metadata for the company pages, looked up by pathname and
// rendered once in RootLayout. The site root belongs to the Loopital app, which
// carries its own metadata. Unknown paths (404s) default to noindex.

import { organizationLd, breadcrumbLd, personLd } from "./structured-data";
import { FOUNDER_IMAGE, FOUNDER_SOCIALS } from "./site";

export interface PageSeo {
  title: string;
  description: string;
  noindex?: boolean;
  type?: "website" | "article";
  /** Optional per-page OG/Twitter image (absolute or site-relative). */
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const pageSeo: Record<string, PageSeo> = {
  "/refund-policy": {
    title: "Refund Policy",
    description:
      "When Loopital refunds a payment, how long it takes, and the few cases we cannot. Covers care payments, duplicate charges and cancellations.",
    jsonLd: breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Refund Policy", path: "/refund-policy" },
    ]),
  },
  // The research questionnaire. Indexed on purpose: we want people to find it
  // and answer it, and it is linked from campaigns that run off-site.
  "/contribute": {
    title: "Help Us Build Loopital",
    description:
      "Tell us how you get healthcare today, or how your hospital runs. A few minutes of answers shape what Loopital becomes.",
    image: "/media/care-ward.jpg",
    jsonLd: breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Contribute", path: "/contribute" },
    ]),
  },
  "/about": {
    title: "About Loopital, Health Technology Built in Nigeria",
    description:
      "Loopital is a Nigerian health technology company building one connected health record, so every patient can find care, book doctors and pay for treatment.",
    image: "/media/office-meeting.jpg",
    jsonLd: organizationLd,
  },
  "/insights": {
    title: "Health Tech News and Insights from Loopital",
    description:
      "News and engineering notes from the team building Loopital, one connected health record for patients and hospitals across Nigeria.",
  },
  "/contact": {
    title: "Contact Loopital",
    description:
      "Talk to the Loopital team about bringing your hospital onto Loopital, partnerships, support or press. Send us a message.",
  },
  "/tuamene.bestgod": {
    title: "Tuamene Bestgod, Founder & CEO of Loopital",
    description:
      "Tuamene Bestgod is the founder and CEO of Loopital, building Loopital, connecting Nigeria's hospitals with a single patient health identity. Speaker, volunteer, and advocate for impact.",
    image: FOUNDER_IMAGE,
    jsonLd: [
      personLd({
        name: "Tuamene Bestgod",
        jobTitle: "Founder & CEO of Loopital",
        path: "/tuamene.bestgod",
        image: FOUNDER_IMAGE,
        description:
          "Founder and CEO of Loopital, a health technology company connecting hospitals and giving every patient a single health identity. Public speaker and volunteer across innovation, education, environment, climate, and healthcare.",
        alumniOf: "Rivers State University",
        homeLocation: "Rivers State, Nigeria",
        knowsAbout: ["Artificial Intelligence", "Software Engineering", "Healthcare Technology", "Leadership", "Public Policy", "Innovation"],
        sameAs: FOUNDER_SOCIALS.map((s) => s.href),
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Tuamene Bestgod", path: "/tuamene.bestgod" },
      ]),
    ],
  },
  // The team onboarding portal. Internal, behind a login, and holding NDAs and
  // payroll data — indexing it would put a door to that in search results.
  "/onboarding": {
    title: "Team Onboarding",
    description: "Loopital team onboarding. Sign in to continue.",
    noindex: true,
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How Loopital collects, uses and protects your information, including the health data held in your Loopital record.",
  },
  "/terms": {
    title: "Terms of Service",
    description: "The terms governing use of Loopital's website and app.",
  },
};

const NOT_FOUND: PageSeo = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist.",
  noindex: true,
};

/** Resolve SEO config for a pathname; unknown paths get a noindex 404 default. */
export function getPageSeo(pathname: string): PageSeo {
  const key = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  if (pageSeo[key]) return pageSeo[key];
  return NOT_FOUND;
}
