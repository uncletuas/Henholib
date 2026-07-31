// Loopital Academy — shared types and track metadata. Course content itself is
// DB-backed (served by the API and managed from the admin portal); this file
// only holds the client-side shapes and the static track presentation.

import { colors } from "../lib/brand";

export type TrackKey = "technical" | "business" | "public";
export type CourseStatus = "enrolling" | "coming_soon";
export type CourseType = "live" | "self_paced";
export type DeliveryMode = "online" | "in_house" | "both";

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
  image: string;
  track: TrackKey;
  courseType: CourseType;
  deliveryMode: DeliveryMode;
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
  introVideoUrl: string;
  selfPacedVideos: { title: string; url: string }[];
}

export interface Facilitator {
  id: string;
  name: string;
  email: string;
  title: string;
  bio: string;
  active: boolean;
  courseIds: string[];
  createdAt: string;
}

export interface CourseSession {
  id: string;
  courseId: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
}

export interface CourseItem {
  key: string;
  label: string;
  type: "video" | "lesson";
  url?: string;
}

export interface Enrollment {
  enrollmentId: string;
  status: "active" | "completed" | "withdrawn";
  progress: number;
  completedAt: string | null;
  course: Course;
}

export interface Review {
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type QuestionKind = "single" | "multi" | "truefalse";

export interface ExamOption { id: string; text: string; }

export interface ExamQuestion {
  id: string;
  prompt: string;
  kind: QuestionKind;
  options: ExamOption[];
  points: number;
  correct?: string[]; // only present in the instructor/edit view
}

export interface ExamStatus {
  attemptsUsed: number;
  maxAttempts: number;
  passed: boolean;
  bestScore: number;
  canTake: boolean;
  passMark: number;
}

export interface StudentExam {
  exam: { id: string; title: string; passMark: number; questions: ExamQuestion[] } | null;
  status?: ExamStatus;
}

export interface ExamResult {
  score: number;
  passed: boolean;
  passMark: number;
  attemptNo: number;
  attemptsLeft: number;
  canRetake: boolean;
}

export interface EditableExam {
  id: string;
  courseId: string;
  title: string;
  passMark: number;
  published: boolean;
  questions: ExamQuestion[];
}

export interface Achievement {
  courseTitle: string;
  track: string;
  completedAt: string | null;
  certificateSerial: string | null;
  certificateIssuedAt: string | null;
}

export interface PublicProfile {
  name: string;
  username: string;
  achievements: Achievement[];
}

export type MaterialKind = "manual" | "slides" | "resource";

export interface Material {
  id: string;
  courseId: string;
  title: string;
  kind: MaterialKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  studentVisible: boolean;
  createdAt: string;
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

export const courseTypeLabel = (t: CourseType): string =>
  t === "self_paced" ? "Self-paced" : "Live cohort";

export const deliveryLabel = (d: DeliveryMode): string =>
  d === "in_house" ? "In-house" : d === "both" ? "Online or in-house" : "Online";

/** A fallback course image when none is set. */
export const FALLBACK_COURSE_IMAGE =
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1080&q=80";
