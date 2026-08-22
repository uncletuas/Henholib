// Per-route SEO metadata, looked up by pathname and rendered once in RootLayout.
// Keeping it centralized means titles/descriptions/structured-data live in one
// place and unknown paths (404s) default to noindex.

import { organizationLd, websiteLd, softwareApplicationLd, breadcrumbLd, personLd } from "./structured-data";
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

const productCrumb = (name: string, path: string) =>
  breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name, path },
  ]);

export const pageSeo: Record<string, PageSeo> = {
  "/": {
    title: "Loopital, Software, AI & Enterprise Platforms",
    description:
      "Loopital builds software products, AI, and enterprise platforms, Pal (AI coworker), Swift (AI ads & CRM), HMS7 (hospital management), Henholib (personal health app), and Modus (facility management), helping organizations and people operate more intelligently.",
    jsonLd: [organizationLd, websiteLd],
  },
  "/products": {
    title: "Products, AI, Healthcare & Enterprise Software",
    description:
      "Explore Loopital's products: Pal AI coworker, Swift AI ads & CRM, HMS7 hospital management system, Henholib personal health app, and Modus facility management software, for businesses, hospitals, and individuals.",
    jsonLd: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }]),
  },
  "/products/hms7": {
    title: "HMS7, Hospital Management System Software",
    description:
      "HMS7 is an enterprise hospital management system for patient records (EMR), appointments, billing, insurance, staff, pharmacy, and compliance, the hospital side of the Henholib care network. Free for the first 3 months; request access via a quick demo.",
    jsonLd: [
      softwareApplicationLd({
        name: "HMS7",
        category: "HealthApplication",
        description:
          "Enterprise hospital management system for patient records, appointments, billing, staff, pharmacy, and compliance, connected to the Henholib patient app.",
        path: "/products/hms7",
      }),
      productCrumb("HMS7", "/products/hms7"),
    ],
  },
  "/products/henholib": {
    title: "Henholib, Book Doctors, Hospital Search & Emergency Alerts",
    description:
      "Henholib is a personal health app to search hospitals, book doctor consultations, message your care team, and raise emergency alerts, the patient side of the HMS7 hospital network. Sign up free at henholib.loopital.com.",
    jsonLd: [
      softwareApplicationLd({
        name: "Henholib",
        category: "HealthApplication",
        description:
          "Personal health app for hospital search, doctor consultations, care-team messaging, and emergency alerts, connected to hospitals running HMS7.",
        path: "/products/henholib",
      }),
      productCrumb("Henholib", "/products/henholib"),
    ],
  },
  "/products/pal": {
    title: "Pal, AI Coworker Platform | Join the Waitlist",
    description:
      "Pal is an AI coworker for research, knowledge management, content, and workflow automation, on web and desktop. Not public yet, join the waitlist for early access.",
    jsonLd: [
      softwareApplicationLd({
        name: "Pal",
        category: "BusinessApplication",
        description:
          "AI coworker platform for research, knowledge management, content generation, and workflow automation.",
        path: "/products/pal",
      }),
      productCrumb("Pal", "/products/pal"),
    ],
  },
  "/products/beacon": {
    title: "Beacon, Education Management System | Join the Waitlist",
    description:
      "Beacon is a complete educational-organization management system for admissions, students, staff, classes, timetables, grades, fees, and communication, for schools, colleges, and training institutions. Not public yet, join the waitlist for early access.",
    jsonLd: [
      softwareApplicationLd({
        name: "Beacon",
        category: "BusinessApplication",
        description:
          "Educational-organization management system for admissions, students, staff, classes, timetables, grades, fees, and communication.",
        path: "/products/beacon",
      }),
      productCrumb("Beacon", "/products/beacon"),
    ],
  },
  "/about": {
    title: "About Loopital",
    description:
      "Loopital is a Nigerian technology company building software products, AI, and enterprise platforms for organizations worldwide.",
    jsonLd: organizationLd,
  },
  "/insights": {
    title: "News & Insights",
    description:
      "Product news, engineering, and perspectives from Loopital on software, AI, healthcare technology, and enterprise platforms.",
  },
  "/contact": {
    title: "Contact Loopital",
    description:
      "Get in touch with Loopital to explore our products or discuss a custom software, AI, or enterprise platform project. Book a demo or talk to our team.",
  },
  "/tuamene.bestgod": {
    title: "Tuamene Bestgod, Founder & CEO of Loopital",
    description:
      "Tuamene Bestgod is the founder and CEO of Loopital, building AI and software for businesses and governments across Africa, and Henholib, connecting Nigeria's hospitals with a single patient health identity. Speaker, volunteer, and advocate for impact.",
    image: FOUNDER_IMAGE,
    jsonLd: [
      personLd({
        name: "Tuamene Bestgod",
        jobTitle: "Founder & CEO of Loopital",
        path: "/tuamene.bestgod",
        image: FOUNDER_IMAGE,
        description:
          "Founder and CEO of Loopital, a technology company building AI and software for businesses, corporations, and governments across Africa. Building Henholib to connect hospitals and give patients a single health identity. Public speaker and volunteer across innovation, education, environment, climate, and healthcare.",
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
  if (pageSeo[key]) return pageSeo[key];
  return NOT_FOUND;
}
