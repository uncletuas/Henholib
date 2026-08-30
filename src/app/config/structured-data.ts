// JSON-LD structured data for rich results. Kept in one place so the schema
// stays consistent across pages.

import { SITE_URL, OG_IMAGE, CONTACT_EMAIL, FOUNDER_SOCIALS } from "./site";

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
    "Loopital is a Nigerian software company. We build HMS7 for hospitals and Henholib for patients, connected as one care network, plus Beacon for schools, Modus for facilities, and Pal, the office of your AI coworker.",
  // Where we operate. A knowledge-panel signal, and safe to state without a
  // published street address.
  areaServed: [
    { "@type": "Country", name: "Nigeria" },
    { "@type": "Place", name: "Africa" },
  ],
  foundingLocation: { "@type": "Place", name: "Port Harcourt, Rivers State, Nigeria" },
  knowsAbout: [
    "Hospital management systems",
    "Electronic medical records",
    "Digital health",
    "Patient engagement",
    "Health insurance and HMO administration",
    "School management systems",
    "Facility and asset management",
    "AI agents for business",
    "Enterprise software in Africa",
  ],
  sameAs: FOUNDER_SOCIALS.map((x) => x.href),
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
  inLanguage: "en",
  publisher: { "@type": "Organization", name: "Loopital", url: SITE_URL },
};

/**
 * FAQ blocks. These are the questions people actually type, and answering them
 * in schema is what makes a page eligible for the expandable result.
 */
export function faqLd(items: Array<{ q: string; a: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

/**
 * SoftwareApplication schema for an in-house product page.
 *
 * `offers` is opt-in, and that is the point. Every product used to declare
 * `price: "0"` in USD with a note to contact sales — which told Google that
 * five products are free, including one whose own page says thirty-five
 * thousand naira a month. Structured data that contradicts the visible page is
 * worse than no structured data: it is the version Google trusts, and a price
 * mismatch is the kind of thing that costs a rich result.
 *
 * So: state a price when there is a real one, and say nothing when there is
 * not. Omission is a valid answer.
 */
export function softwareApplicationLd(input: {
  name: string;
  category: string;
  description: string;
  path: string;
  operatingSystem?: string;
  /** A single real price, in the currency actually charged. */
  offer?: { price: string; currency: string; description?: string };
  /** A range, for a product sold on more than one plan. */
  offerRange?: { low: string; high: string; currency: string };
}): Record<string, unknown> {
  const offers = input.offer
    ? {
        "@type": "Offer",
        price: input.offer.price,
        priceCurrency: input.offer.currency,
        ...(input.offer.description ? { description: input.offer.description } : {}),
      }
    : input.offerRange
      ? {
          "@type": "AggregateOffer",
          lowPrice: input.offerRange.low,
          highPrice: input.offerRange.high,
          priceCurrency: input.offerRange.currency,
        }
      : null;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    applicationCategory: input.category,
    operatingSystem: input.operatingSystem ?? "Web-based, Windows, macOS",
    url: `${SITE_URL}${input.path}`,
    description: input.description,
    publisher: { "@type": "Organization", name: "Loopital", url: SITE_URL },
    ...(offers ? { offers } : {}),
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
