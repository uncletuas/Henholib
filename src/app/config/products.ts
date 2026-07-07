// Single source of truth for the Loopital product catalog. Consumed by the
// homepage, products overview, product detail pages, navbar, footer, ecosystem
// page, and the account portal — so naming, positioning, platforms, CTAs, and
// account-linking rules stay consistent everywhere.

import {
  STACK62_URL,
  SART34_URL,
  FMS13_URL,
  HENHOLIB_URL,
  SART34_APP_STORE_URL,
  SART34_PLAY_STORE_URL,
} from "./site";
import { productAccent } from "../lib/brand";
import type { Platform } from "../components/PlatformPills";

import stack62Logo from "../../imports/stack62_logo.png";
import sart34Logo from "../../imports/sart34_logo.png";
import hms7Logo from "../../imports/hms7-logo.svg";
import henholibLogo from "../../imports/henholib-logo.svg";
import fms13Logo from "../../imports/fms13_logo.png";

export type ProductId = "stack62" | "sart34" | "hms7" | "henholib" | "fms13";
export type CtaType = "launch" | "demo";

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
  /** Where "Learn more" goes. For STACK62/SART34 this is their existing
   *  external landing page (subdomain); for HMS7/FMS13 it's the in-site page. */
  detailHref: string;
  /** The live app URL (subdomain) or undefined for demo-led products. */
  appHref?: string;
  /** True when the product's landing page / app lives on an external subdomain
   *  (so links render as anchors, not in-site routes). */
  external: boolean;
  /** True when this product is tied to a unified loopital account/portal. */
  accountLinked: boolean;
  /** Primary call to action: launch the app, or book a demo. */
  ctaType: CtaType;
  /** Optional launch offer, e.g. "Free for the first 3 months". */
  offer?: string;
  /** Mobile store links (SART34 only). */
  mobile?: { appStore: string; playStore: string };
  /** A few proof points used on story blocks. */
  highlights: string[];
}

export const products: Product[] = [
  {
    id: "stack62",
    name: "STACK62",
    logo: stack62Logo,
    category: "AI Coworker Platform",
    theme: "The Future of Work",
    tagline: "Your team's most intelligent member.",
    description:
      "STACK62 is an AI coworker that handles research, knowledge management, content creation, and workflow automation — so your team thinks faster and works at a fundamentally higher level.",
    platforms: ["web", "desktop"],
    accent: productAccent.stack62,
    detailHref: STACK62_URL,
    appHref: STACK62_URL,
    external: true,
    accountLinked: true,
    ctaType: "launch",
    highlights: ["Research & synthesis", "Content generation", "Workflow automation", "Decision support"],
  },
  {
    id: "sart34",
    name: "SART34",
    logo: sart34Logo,
    category: "AI Ads & CRM",
    theme: "The Future of Communication",
    tagline: "AI ads & CRM for growing businesses.",
    description:
      "SART34 unifies advertising and customer relationships in one place — run AI-powered ad campaigns, manage every conversation, and grow your audience from a single intelligent workspace, on any device.",
    platforms: ["web", "desktop", "mobile"],
    accent: productAccent.sart34,
    detailHref: SART34_URL,
    appHref: SART34_URL,
    external: true,
    accountLinked: true,
    ctaType: "launch",
    mobile: { appStore: SART34_APP_STORE_URL, playStore: SART34_PLAY_STORE_URL },
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
      "HMS7 runs the hospital side of care — patient records, appointments, billing, pharmacy, staff, and compliance in one platform — and connects directly to Henholib, so the patients your hospital serves book, message, and get alerts from the very system you run. Hospitals get access free after a short demo.",
    platforms: ["web", "desktop"],
    accent: productAccent.hms7,
    detailHref: "/products/hms7",
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
      "Henholib puts your whole health experience on your phone — find and search hospitals, book consultations with doctors, message your care team, and trigger emergency alerts when it matters most. It's the patient side of the HMS7 network, and anyone can sign up in minutes.",
    platforms: ["web", "mobile"],
    accent: productAccent.henholib,
    detailHref: "/products/henholib",
    appHref: HENHOLIB_URL,
    external: false,
    accountLinked: false,
    ctaType: "launch",
    highlights: ["Book consultations", "Hospital search", "Emergency alerts", "Chat with your care team"],
  },
  {
    id: "fms13",
    name: "FMS13",
    logo: fms13Logo,
    category: "Facility Management",
    theme: "The Future of Facility Operations",
    tagline: "Every facility, fully under control.",
    description:
      "FMS13 is a complete facility management system — managing assets, maintenance, work orders, service requests, vendors, compliance, and space across every building and site from one platform, so your facilities run efficiently and safely at scale. Open it and get started right away, or talk to us about a rollout.",
    platforms: ["web", "desktop"],
    accent: productAccent.fms13,
    detailHref: "/products/fms13",
    appHref: FMS13_URL,
    external: false,
    accountLinked: false,
    ctaType: "launch",
    offer: "Free for the first 3 months",
    highlights: ["Asset & maintenance", "Work orders & requests", "Vendor management", "Compliance & safety"],
  },
];

export const productById = (id: ProductId) => products.find((p) => p.id === id)!;

/** Products tied to the unified loopital account/portal (SART34 + STACK62). */
export const accountProducts = products.filter((p) => p.accountLinked);
