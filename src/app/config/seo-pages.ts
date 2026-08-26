// Per-route SEO metadata, looked up by pathname and rendered once in RootLayout.
// Keeping it centralized means titles/descriptions/structured-data live in one
// place and unknown paths (404s) default to noindex.

import { organizationLd, websiteLd, softwareApplicationLd, breadcrumbLd, personLd, faqLd } from "./structured-data";
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
    title: "Health Technology for Hospitals and Patients in Africa",
    description:
      "Loopital builds HMS7, the hospital management system, and Henholib, the patient health app. Book consultations, hold your records and raise emergency alerts.",
    jsonLd: [organizationLd, websiteLd],
  },
  "/products": {
    title: "Products: Hospital, Health, Facility and School Software",
    description:
      "Henholib for patients, HMS7 for hospitals, Modus for facilities, Beacon for schools and Pal, the office of your AI coworker. One account opens all of them.",
    jsonLd: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }]),
  },
  "/products/hms7": {
    title: "HMS7, Hospital Management System Software",
    description:
      "Hospital management software for patient records, appointments, billing, pharmacy and staff. Connected to the Henholib patient app. Free for 3 months.",
    jsonLd: [
      softwareApplicationLd({
        name: "HMS7",
        category: "HealthApplication",
        description:
          "Enterprise hospital management system for patient records, appointments, billing, staff, pharmacy, and compliance, connected to the Henholib patient app.",
        path: "/products/hms7",
      }),
      productCrumb("HMS7", "/products/hms7"),
      faqLd([
        {
          q: "What does HMS7 cost?",
          a: "HMS7 is free for the first three months after a short demo, so a hospital can run it properly before deciding.",
        },
        {
          q: "Does HMS7 handle billing and insurance?",
          a: "Yes. Billing, insurance claims, pharmacy stock, staff scheduling and compliance are all part of the platform alongside patient records.",
        },
        {
          q: "How does HMS7 connect to patients?",
          a: "Through Henholib. Patients on Henholib book, message their care team and receive alerts from the same system the hospital runs.",
        },
      ]),
    ],
  },
  "/products/henholib": {
    title: "Henholib, Book Doctors, Hospital Search & Emergency Alerts",
    description:
      "Find a hospital, book a doctor, hold your records and raise an emergency alert from your phone. Free health app for patients in Nigeria and beyond.",
    jsonLd: [
      softwareApplicationLd({
        name: "Henholib",
        category: "HealthApplication",
        description:
          "Personal health app for hospital search, doctor consultations, care-team messaging, and emergency alerts, connected to hospitals running HMS7.",
        path: "/products/henholib",
      }),
      productCrumb("Henholib", "/products/henholib"),
      faqLd([
        {
          q: "Is Henholib free?",
          a: "Yes. Anyone can sign up and use Henholib free to find hospitals, book consultations, hold their records and raise emergency alerts.",
        },
        {
          q: "How do I book a doctor on Henholib?",
          a: "Open Care, search by what you need treated or by the nearest hospital, pick a time and confirm. The booking lands in the hospital's own system if they run HMS7.",
        },
        {
          q: "What happens when I press the SOS button?",
          a: "Henholib shares your live location with responders and alerts the nearest Henholib hospital. You can choose medical, police or fire.",
        },
        {
          q: "Who can see my health records?",
          a: "You can. Records are yours, and a hospital sees them when you choose to share them, for example by showing your Henholib ID at the desk.",
        },
      ]),
    ],
  },
  "/products/pal": {
    title: "Pal, the Office of Your AI Coworker",
    description:
      "Pal Workspace is where your AI coworker works. A member of your team, not a tool you operate. Join the waitlist for early access.",
    jsonLd: [
      softwareApplicationLd({
        name: "Pal",
        category: "BusinessApplication",
        description:
          "The office of your AI coworker. A member of your team that drafts, researches, answers the inbox and runs the work you hand it.",
        path: "/products/pal",
      }),
      productCrumb("Pal", "/products/pal"),
    ],
  },
  "/products/beacon": {
    title: "Beacon, School Management Software for Africa",
    description:
      "Beacon is a complete educational-organization management system for admissions, students, staff, classes, timetables, grades, fees, and communication, for schools, colleges, and training institutions. Request a demo to see it with your own data.",
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
    title: "About Loopital, a Health Technology Company",
    description:
      "Loopital is a Nigerian health technology company using software and AI to solve Africa's most important problems, starting with how care is delivered.",
    jsonLd: organizationLd,
  },
  "/insights": {
    title: "Health Tech News and Insights from Loopital",
    description:
      "Product news and engineering notes on hospital software, patient apps and AI, from the team building health technology across Africa.",
  },
  "/contact": {
    title: "Contact Loopital, Book a Hospital Software Demo",
    description:
      "Talk to the Loopital team about HMS7 for your hospital, Henholib for your patients, or a rollout of Modus or Beacon. Book a demo or send a message.",
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
    description: "How Loopital collects, uses and protects your information, including health data held in Henholib and HMS7.",
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
