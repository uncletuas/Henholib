// Single source of truth for the Loopital product catalog. Consumed by the
// homepage, products overview, product detail pages, navbar, footer, ecosystem
// page, and the account portal, so naming, positioning, platforms, CTAs, and
// account-linking rules stay consistent everywhere.

import {
  FMS13_URL,
  HENHOLIB_URL,
  PAL_URL,
  SART34_URL,
} from "./site";
import { productAccent } from "../lib/brand";
import type { Platform } from "../components/PlatformPills";

import stack62Logo from "../../imports/stack62_logo.png";
import sart34Logo from "../../imports/sart34_logo.png";
import hms7Logo from "../../imports/hms7-logo.svg";
import henholibLogo from "../../imports/henholib-logo.svg";
import fms13Logo from "../../imports/fms13_logo.png";
import edm73Logo from "../../imports/edm73-logo.svg";

export type ProductId = "stack62" | "sart34" | "hms7" | "henholib" | "fms13" | "edm73";
export type CtaType = "launch" | "demo" | "waitlist";

export interface Product {
  id: ProductId;
  name: string;
  logo: string;
  /** Short category label shown as a chip. */
  category: string;
  /** Ecosystem theme line, e.g. "The Future of Work". */
  theme: string;
  /** One-line tagline. */
  tagline: string;
  /** Paragraph description for cards and overview. */
  description: string;
  /** Platforms the product ships on. */
  platforms: Platform[];
  accent: string;
  /** Where "Learn more" goes, the in-site product landing page. */
  detailHref: string;
  /** The live app URL (subdomain), or undefined for demo-led / waitlist products. */
  appHref?: string;
  /** True when the product's landing page / app lives on an external subdomain
   *  (so links render as anchors, not in-site routes). */
  external: boolean;
  /** True when this product is tied to a unified loopital account/portal. */
  accountLinked: boolean;
  /** Primary call to action: launch the app, or book a demo. */
  ctaType: CtaType;
  /** Launch stage: "available" (usable now) or "coming_soon" (in development / waitlist). */
  stage: "available" | "coming_soon";
  /** Flagship products we actively promote (Henholib + Beacon). */
  flagship?: boolean;
  /** Optional launch offer, e.g. "Free for the first 3 months". */
  offer?: string;
  /** Mobile store links (Swift only). */
  mobile?: { appStore: string; playStore: string };
  /** A few proof points used on story blocks. */
  highlights: string[];
}

export const products: Product[] = [
  {
    id: "stack62",
    name: "Pal",
    logo: stack62Logo,
    category: "Your AI Workspace",
    theme: "The Future of Work",
    tagline: "Your AI workspace, it comes with your account.",
    description:
      "Pal is your AI workspace, included with every Loopital account. Organize your work in one place, and switch on the AI coworker, research, content, automation, and decision support, whenever you're ready. Free to use; the coworker is a paid upgrade.",
    platforms: ["web", "desktop"],
    accent: productAccent.stack62,
    detailHref: "/products/stack62",
    stage: "available",
    external: false,
    accountLinked: true,
    ctaType: "launch",
    appHref: PAL_URL,
    highlights: ["Free workspace with your account", "AI coworker (paid)", "Research & content", "Workflow automation"],
  },
  {
    id: "sart34",
    name: "Swift",
    logo: sart34Logo,
    category: "AI Ads & CRM",
    theme: "The Future of Communication",
    tagline: "AI ads & CRM for growing businesses.",
    description:
      "Swift unifies advertising and customer relationships in one place, run AI-powered ad campaigns, manage every conversation, and grow your audience from a single intelligent workspace, on any device.",
    platforms: ["web", "desktop", "mobile"],
    accent: productAccent.sart34,
    // Swift has no on-site landing page — every link opens the live app directly.
    detailHref: SART34_URL,
    stage: "available",
    external: true,
    accountLinked: true,
    ctaType: "launch",
    appHref: SART34_URL,
    highlights: ["AI ad campaigns", "Unified CRM", "Audience engagement", "Cross-platform publishing"],
  },
  {
    id: "hms7",
    name: "HMS7",
    logo: hms7Logo,
    category: "Hospital Management System",
    theme: "The Future of Healthcare Operations",
    tagline: "The operating system for the modern hospital.",
    description:
      "HMS7 runs the hospital side of care, patient records, appointments, billing, pharmacy, staff, and compliance in one platform, and connects directly to Henholib, so the patients your hospital serves book, message, and get alerts from the very system you run. Hospitals get access free after a short demo.",
    platforms: ["web", "desktop"],
    accent: productAccent.hms7,
    detailHref: "/products/hms7",
    stage: "available",
    external: false,
    accountLinked: false,
    ctaType: "demo",
    offer: "Free for the first 3 months",
    highlights: ["Patient records (EMR)", "Billing & insurance", "Connected to Henholib", "Staff & pharmacy"],
  },
  {
    id: "henholib",
    name: "Henholib",
    logo: henholibLogo,
    category: "Personal Health App",
    theme: "The Future of Patient Care",
    tagline: "Your hospital and your health, in your pocket.",
    description:
      "Henholib puts your whole health experience on your phone, find and search hospitals, book consultations with doctors, message your care team, and trigger emergency alerts when it matters most. It's the patient side of the HMS7 network, and anyone can sign up in minutes.",
    platforms: ["web", "mobile"],
    accent: productAccent.henholib,
    detailHref: "/products/henholib",
    stage: "available",
    flagship: true,
    appHref: HENHOLIB_URL,
    external: false,
    accountLinked: false,
    ctaType: "launch",
    highlights: ["Book consultations", "Hospital search", "Emergency alerts", "Chat with your care team"],
  },
  {
    id: "fms13",
    name: "Modus",
    logo: fms13Logo,
    category: "Facility Management",
    theme: "The Future of Facility Operations",
    tagline: "Every facility, fully under control.",
    description:
      "Modus is a complete facility management system, managing assets, maintenance, work orders, service requests, vendors, compliance, and space across every building and site from one platform, so your facilities run efficiently and safely at scale. Open it and get started right away, or talk to us about a rollout.",
    platforms: ["web", "desktop"],
    accent: productAccent.fms13,
    // Modus has no on-site landing page — links go straight to the app sign-in.
    detailHref: FMS13_URL,
    stage: "available",
    appHref: FMS13_URL,
    external: true,
    accountLinked: false,
    ctaType: "launch",
    offer: "Free for the first 3 months",
    highlights: ["Asset & maintenance", "Work orders & requests", "Vendor management", "Compliance & safety"],
  },
  {
    id: "edm73",
    name: "Beacon",
    logo: edm73Logo,
    category: "Education Management",
    theme: "The Future of Education Operations",
    tagline: "The operating system for schools and training institutions.",
    description:
      "Beacon is a complete educational-organization management system, admissions, students, staff, classes, timetables, grades, fees, and communication in one platform, so schools, colleges, and training institutions run smoothly end to end. Not open to the public yet; join the waitlist for early access.",
    platforms: ["web", "desktop"],
    accent: productAccent.edm73,
    detailHref: "/products/edm73",
    stage: "coming_soon",
    flagship: true,
    external: false,
    accountLinked: false,
    ctaType: "waitlist",
    highlights: ["Admissions & enrollment", "Students & staff", "Grades & timetables", "Fees & communication"],
  },
];

export const productById = (id: ProductId) => products.find((p) => p.id === id)!;

/** Products tied to the unified loopital account/portal (Swift + Pal). */
export const accountProducts = products.filter((p) => p.accountLinked);

// ── Positioning groups ──
/** The core ecosystem, in the order we lead with them (needs-first). */
export const ecosystemProducts: Product[] = ["henholib", "fms13", "hms7", "edm73"].map((id) => productById(id as ProductId));
/** Products still in development, shown separately with a waitlist (Pal, Swift). */
export const inDevelopmentProducts = products.filter((p) => p.stage === "coming_soon" && !p.flagship);
