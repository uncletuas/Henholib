// Per-route SEO metadata, looked up by pathname and rendered once in RootLayout.
// Keeping it centralized means titles/descriptions/structured-data live in one
// place and unknown paths (404s) default to noindex.

import { organizationLd, websiteLd, softwareApplicationLd, breadcrumbLd } from "./structured-data";

export interface PageSeo {
  title: string;
  description: string;
  noindex?: boolean;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const productCrumb = (name: string, path: string) =>
  breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name, path },
  ]);

export const pageSeo: Record<string, PageSeo> = {
  "/": {
    title: "Loopital — Software, AI & Enterprise Platforms",
    description:
      "Loopital builds software products, AI, and enterprise platforms — STACK62 (AI coworker), SART34 (AI ads & CRM), HMS7 (hospital management), Henholib (personal health app), and FMS13 (facility management) — helping organizations and people operate more intelligently.",
    jsonLd: [organizationLd, websiteLd],
  },
  "/products": {
    title: "Products — AI, Healthcare & Enterprise Software",
    description:
      "Explore Loopital's products: STACK62 AI coworker, SART34 AI ads & CRM, HMS7 hospital management system, Henholib personal health app, and FMS13 facility management software — for businesses, hospitals, and individuals.",
    jsonLd: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }]),
  },
  "/services": {
    title: "Services — Web, Mobile, AI & Enterprise Development",
    description:
      "Loopital designs and builds websites, mobile apps, AI solutions, enterprise platforms, and custom digital systems — applying the same engineering standards we hold our own products to.",
    jsonLd: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]),
  },
  "/products/hms7": {
    title: "HMS7 — Hospital Management System Software",
    description:
      "HMS7 is an enterprise hospital management system for patient records (EMR), appointments, billing, insurance, staff, pharmacy, and compliance — the hospital side of the Henholib care network. Free for the first 3 months; request access via a quick demo.",
    jsonLd: [
      softwareApplicationLd({
        name: "HMS7",
        category: "HealthApplication",
        description:
          "Enterprise hospital management system for patient records, appointments, billing, staff, pharmacy, and compliance — connected to the Henholib patient app.",
        path: "/products/hms7",
      }),
      productCrumb("HMS7", "/products/hms7"),
    ],
  },
  "/products/henholib": {
    title: "Henholib — Book Doctors, Hospital Search & Emergency Alerts",
    description:
      "Henholib is a personal health app to search hospitals, book doctor consultations, message your care team, and raise emergency alerts — the patient side of the HMS7 hospital network. Sign up free at henholib.loopital.com.",
    jsonLd: [
      softwareApplicationLd({
        name: "Henholib",
        category: "HealthApplication",
        description:
          "Personal health app for hospital search, doctor consultations, care-team messaging, and emergency alerts — connected to hospitals running HMS7.",
        path: "/products/henholib",
      }),
      productCrumb("Henholib", "/products/henholib"),
    ],
  },
  "/products/fms13": {
    title: "FMS13 — Facility Management System Software",
    description:
      "FMS13 is a complete facility management system for assets, maintenance, work orders, service requests, vendors, compliance, and space across every building and site. Open it at fms13.loopital.com — free for the first 3 months.",
    jsonLd: [
      softwareApplicationLd({
        name: "FMS13",
        category: "BusinessApplication",
        description:
          "Complete facility management system for assets, maintenance, work orders, vendors, compliance, and multi-site operations.",
        path: "/products/fms13",
      }),
      productCrumb("FMS13", "/products/fms13"),
    ],
  },
  // External product apps live on their own subdomains — keep the in-site
  // redirect routes out of the index.
  "/products/stack62": {
    title: "STACK62 — AI Coworker Platform",
    description: "STACK62 is an AI coworker for research, knowledge management, content, and workflow automation. Visit stack62.loopital.com.",
    noindex: true,
  },
  "/products/sart34": {
    title: "SART34 — AI Ads & CRM",
    description: "SART34 unifies AI-powered advertising and CRM in one workspace. Visit sart34.loopital.com.",
    noindex: true,
  },
  "/about": {
    title: "About Loopital",
    description:
      "Loopital is a technology company building software products, AI, and enterprise platforms from Port Harcourt, Nigeria, for organizations worldwide.",
    jsonLd: organizationLd,
  },
  "/insights": {
    title: "News & Insights",
    description:
      "Product news, engineering, and perspectives from Loopital on software, AI, healthcare technology, and enterprise platforms.",
  },
  "/careers": {
    title: "Careers at Loopital",
    description:
      "Join Loopital and help build the software, AI, and enterprise platforms powering the next generation of organizations. See open roles.",
  },
  "/contact": {
    title: "Contact Loopital",
    description:
      "Get in touch with Loopital to explore our products or discuss a custom software, AI, or enterprise platform project. Book a demo or talk to our team.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How Loopital collects, uses, and protects your information.",
  },
  "/terms": {
    title: "Terms of Service",
    description: "The terms governing use of Loopital's website, products, and services.",
  },
};

const NOT_FOUND: PageSeo = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist. Explore Loopital's products and services instead.",
  noindex: true,
};

/** Resolve SEO config for a pathname; unknown paths get a noindex 404 default. */
export function getPageSeo(pathname: string): PageSeo {
  const key = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  return pageSeo[key] ?? NOT_FOUND;
}
