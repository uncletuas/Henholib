// Per-route SEO metadata, looked up by pathname and rendered once in RootLayout.
// Keeping it centralized means titles/descriptions/structured-data live in one
// place and unknown paths (404s) default to noindex.

import { organizationLd, websiteLd, softwareApplicationLd, breadcrumbLd, personLd, academyLd, courseLd } from "./structured-data";
import { FOUNDER_IMAGE } from "./site";

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

const academyCrumb = (name: string, path: string) =>
  breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Academy", path: "/academy" },
    { name, path },
  ]);

// SEO for the launch course pages. Course *content* is DB-backed and editable
// from the admin portal, but titles/descriptions for the known launch courses
// are kept static here so each page is indexable with tailored metadata.
// Courses added later via the portal fall back to a generic (still indexable)
// academy entry in getPageSeo().
interface CourseSeo {
  slug: string;
  name: string;
  price: number;
  desc: string;
}
const academyCourses: CourseSeo[] = [
  { slug: "generative-ai-masterclass", name: "Generative AI Masterclass", price: 100, desc: "Go from zero to confidently using generative AI in your work — a hands-on 4-week live course for professionals, entrepreneurs, and students. No prior experience needed." },
  { slug: "software-development-with-ai", name: "Software Development with AI", price: 100, desc: "Make AI a dependable part of your development workflow — generating, reviewing, and shipping code. A 4-week live course for developers and engineers." },
  { slug: "application-development-with-ai", name: "Application Development with AI", price: 100, desc: "Turn an idea into a working app with AI, no engineering background required. A 4-week live course for founders, product people, and non-technical builders." },
  { slug: "ai-for-business-executives", name: "AI for Business Executives", price: 200, desc: "Lead AI adoption with clarity — spot real opportunities, evaluate vendors, and drive responsible adoption. A 3-week live course for leaders and decision-makers." },
  { slug: "ai-for-marketing", name: "AI for Marketing", price: 200, desc: "Build a practical AI marketing workflow — content at scale, AI creative, and data-driven campaigns. A 4-week live course for marketers and brand teams." },
  { slug: "ai-for-research-and-planning", name: "AI for Research & Planning", price: 200, desc: "Use AI to research, analyze, and plan responsibly — without fabricated findings. A 4-week live course for analysts, planners, and academics." },
  { slug: "ai-for-governance", name: "AI for Governance", price: 300, desc: "Help the public sector adopt AI to improve service delivery, responsibly and accountably. A 3-week live course for government officials and administrators." },
];

const academyCourseSeo: Record<string, PageSeo> = Object.fromEntries(
  academyCourses.map((c) => [
    `/academy/${c.slug}`,
    {
      title: `${c.name} | Loopital Academy`,
      description: c.desc,
      jsonLd: [
        courseLd({ name: c.name, description: c.desc, path: `/academy/${c.slug}`, price: c.price }),
        academyCrumb(c.name, `/academy/${c.slug}`),
      ],
    } as PageSeo,
  ])
);

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
  "/products/stack62": {
    title: "STACK62 — AI Coworker Platform | Join the Waitlist",
    description:
      "STACK62 is an AI coworker for research, knowledge management, content, and workflow automation, on web and desktop. Not public yet — join the waitlist for early access.",
    jsonLd: [
      softwareApplicationLd({
        name: "STACK62",
        category: "BusinessApplication",
        description:
          "AI coworker platform for research, knowledge management, content generation, and workflow automation.",
        path: "/products/stack62",
      }),
      productCrumb("STACK62", "/products/stack62"),
    ],
  },
  "/products/sart34": {
    title: "SART34 — AI Ads & CRM | Join the Waitlist",
    description:
      "SART34 unifies AI-powered advertising and CRM in one workspace — run campaigns, manage every conversation, and grow your audience. Not public yet — join the waitlist for early access.",
    jsonLd: [
      softwareApplicationLd({
        name: "SART34",
        category: "BusinessApplication",
        description:
          "AI ads and CRM platform to run campaigns, manage conversations, and grow audiences from one workspace.",
        path: "/products/sart34",
      }),
      productCrumb("SART34", "/products/sart34"),
    ],
  },
  "/academy": {
    title: "Loopital Academy — Practical AI Training Courses",
    description:
      "Loopital Academy offers practical, hands-on AI training for individuals, businesses, and the public sector — across a Technical Track, a Business & Leadership Track, and a Public Sector Track. Live cohorts, real-world projects.",
    jsonLd: [
      academyLd,
      breadcrumbLd([{ name: "Home", path: "/" }, { name: "Academy", path: "/academy" }]),
    ],
  },
  ...academyCourseSeo,
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
  "/contact": {
    title: "Contact Loopital",
    description:
      "Get in touch with Loopital to explore our products or discuss a custom software, AI, or enterprise platform project. Book a demo or talk to our team.",
  },
  "/tuamene.bestgod": {
    title: "Tuamene Bestgod — Founder & CEO of Loopital",
    description:
      "Tuamene Bestgod is the founder and CEO of Loopital, building AI and software for businesses and governments across Africa — and Henholib, connecting Nigeria's hospitals with a single patient health identity. Speaker, volunteer, and advocate for impact.",
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

  // Academy: application forms and the admin portal stay out of the index.
  if (key === "/academy/admin" || key.startsWith("/academy/apply")) {
    return {
      title: key.startsWith("/academy/apply") ? "Apply — Loopital Academy" : "Academy Admin — Loopital",
      description: "Loopital Academy.",
      noindex: true,
    };
  }
  // A course added later via the admin portal (not in the static map): still
  // indexable, with generic-but-relevant metadata.
  if (key.startsWith("/academy/")) {
    return {
      title: "Loopital Academy — AI Training Course",
      description:
        "A practical, hands-on AI training course from Loopital Academy. Learn to apply AI in your work through live cohorts and real-world projects.",
      jsonLd: breadcrumbLd([{ name: "Home", path: "/" }, { name: "Academy", path: "/academy" }]),
    };
  }
  return NOT_FOUND;
}
