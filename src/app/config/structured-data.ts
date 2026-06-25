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
    "Loopital builds software products, AI solutions, and enterprise platforms that help businesses and institutions operate more intelligently.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Pyale Hub, 21 Bekwere Wosu Street, D-Line, Diobu",
    addressLocality: "Port Harcourt",
    addressRegion: "Rivers State",
    addressCountry: "NG",
  },
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
    offers: { "@type": "Offer", priceCurrency: "USD", price: "0", description: "Contact sales for pricing — book a demo." },
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
