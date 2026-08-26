// JSON-LD structured data for rich results. Kept in one place so the schema
// stays consistent across pages.

import { SITE_URL, OG_IMAGE, CONTACT_EMAIL } from "./site";

export const organizationLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Loopital",
  legalName: "Loopital Limited",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  image: OG_IMAGE,
  email: CONTACT_EMAIL,
  description:
    "Loopital is a health technology company. We build HMS7, the hospital operating system, and Henholib, the personal health app, connected as one care network, alongside Pal, Modus and Beacon.",
  // No PostalAddress: the company does not publish a street address at the
  // moment. Schema.org treats address as optional on an Organization, and a
  // stale or partial one is worse for search than none — it is what gets shown
  // in a knowledge panel and sent to maps.
};

export const websiteLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Loopital",
  url: SITE_URL,
  publisher: { "@type": "Organization", name: "Loopital", url: SITE_URL },
};

/** SoftwareApplication schema for an in-house product page. */
export function softwareApplicationLd(input: {
  name: string;
  category: string;
  description: string;
  path: string;
  operatingSystem?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    applicationCategory: input.category,
    operatingSystem: input.operatingSystem ?? "Web-based, Windows, macOS",
    url: `${SITE_URL}${input.path}`,
    description: input.description,
    publisher: { "@type": "Organization", name: "Loopital", url: SITE_URL },
    offers: { "@type": "Offer", priceCurrency: "USD", price: "0", description: "Contact sales for pricing, book a demo." },
  };
}

/** Person schema for a profile page (e.g. the founder). */
export function personLd(input: {
  name: string;
  jobTitle: string;
  path: string;
  image: string;
  description: string;
  sameAs?: string[];
  alumniOf?: string;
  homeLocation?: string;
  knowsAbout?: string[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    jobTitle: input.jobTitle,
    url: `${SITE_URL}${input.path}`,
    image: input.image.startsWith("http") ? input.image : `${SITE_URL}${input.image}`,
    description: input.description,
    worksFor: { "@type": "Organization", name: "Loopital", url: SITE_URL },
    ...(input.alumniOf ? { alumniOf: { "@type": "CollegeOrUniversity", name: input.alumniOf } } : {}),
    ...(input.homeLocation ? { homeLocation: { "@type": "Place", name: input.homeLocation } } : {}),
    ...(input.knowsAbout ? { knowsAbout: input.knowsAbout } : {}),
    ...(input.sameAs && input.sameAs.length ? { sameAs: input.sameAs } : {}),
  };
}

/** BreadcrumbList for a page nested under the site root. */
export function breadcrumbLd(trail: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}
