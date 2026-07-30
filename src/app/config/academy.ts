// Loopital Academy — shared types and track metadata. Course content itself is
// DB-backed (served by the API and managed from the admin portal); this file
// only holds the client-side shapes and the static track presentation.

import { colors } from "../lib/brand";

export type TrackKey = "technical" | "business" | "public";
export type CourseStatus = "enrolling" | "coming_soon";

export interface CourseWeek {
  week: number;
  title: string;
  desc: string;
}

export interface CourseFormat {
  duration?: string;
  cadence?: string;
  commitment?: string;
  delivery?: string;
  prerequisites?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  track: TrackKey;
  shortDesc: string;
  fullDesc: string;
  whoFor: string[];
  curriculum: CourseWeek[];
  format: CourseFormat;
  priceCents: number;
  currency: string;
  status: CourseStatus;
  published: boolean;
  sortOrder: number;
  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
}

export interface TrackMeta {
  key: TrackKey;
  name: string;
  blurb: string;
  accent: string;
}

export const TRACKS: TrackMeta[] = [
  {
    key: "technical",
    name: "Technical Track",
    blurb: "Hands-on AI skills for builders — from generative AI foundations to shipping software and apps with AI.",
    accent: colors.blue,
  },
  {
    key: "business",
    name: "Business & Leadership Track",
    blurb: "Practical AI for the people who run things — executives, marketers, and strategists driving real adoption.",
    accent: colors.green,
  },
  {
    key: "public",
    name: "Public Sector Track",
    blurb: "AI for government and public service — improving delivery responsibly, ethically, and accountably.",
    accent: colors.cyan,
  },
];

export const trackMeta = (key: TrackKey): TrackMeta =>
  TRACKS.find((t) => t.key === key) ?? TRACKS[0];

/** Format a price in minor units, e.g. (10000,"USD") -> "$100". */
export function formatPrice(cents: number, currency = "USD"): string {
  const value = (Number(cents) || 0) / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
  return formatted;
}

export const statusLabel = (s: CourseStatus): string =>
  s === "enrolling" ? "Enrolling now" : "Coming soon";
