import { API_BASE_URL } from "../config/site";
import type { Course, Facilitator, Material, CourseSession, CourseItem, Enrollment, Review, StudentExam, ExamResult, EditableExam, PublicProfile } from "../config/academy";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch (_) {
    throw new Error("Network error. Please check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Something went wrong.");
  }
  return data as T;
}

export const authApi = {
  signup: (name: string, email: string, password: string) =>
    request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  signin: (email: string, password: string) =>
    request<AuthResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    request<{ user: AuthUser }>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ── Waitlist ───────────────────────────────────────────────────────────
// Public capture for products not yet open to the public (STACK62, SART34).
export const waitlistApi = {
  join: (product: string, email: string, name?: string) =>
    request<{ ok: boolean }>("/waitlist", {
      method: "POST",
      body: JSON.stringify({ product, email, name }),
    }),
};

// ── Loopital Academy ───────────────────────────────────────────────────
// Public: course catalog + application capture. Admin: management portal
// (single shared credential set via self-service bootstrap on first run).

export interface AcademyApplicationInput {
  courseSlug: string;
  name: string;
  email: string;
  phone?: string;
  motivation?: string;
  heardFrom?: string;
}

export interface AcademyApplication {
  id: string;
  courseSlug: string;
  courseTitle: string;
  name: string;
  email: string;
  phone: string | null;
  motivation: string | null;
  heardFrom: string | null;
  createdAt: string;
}

const adminHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const academyApi = {
  listCourses: () => request<{ courses: Course[] }>("/academy/courses"),

  getCourse: (slug: string) =>
    request<{ course: Course }>(`/academy/courses/${encodeURIComponent(slug)}`),

  apply: (input: AcademyApplicationInput) =>
    request<{ ok: boolean }>("/academy/apply", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  reviews: (courseId: string) =>
    request<{ reviews: Review[]; count: number; average: number }>(`/academy/reviews?courseId=${encodeURIComponent(courseId)}`),

  verify: (serial: string) =>
    request<{ valid: boolean; name?: string; courseTitle?: string; issuedAt?: string; serial?: string }>(`/academy/verify?serial=${encodeURIComponent(serial)}`),

  achievements: (username: string) =>
    request<PublicProfile>(`/academy/u/${encodeURIComponent(username)}`),
};

export const academyAdminApi = {
  status: () => request<{ initialized: boolean }>("/academy/admin/status"),

  bootstrap: (password: string) =>
    request<{ token: string }>("/academy/admin/bootstrap", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  login: (password: string) =>
    request<{ token: string }>("/academy/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  changePassword: (token: string, current: string, next: string) =>
    request<{ ok: boolean }>("/academy/admin/password", {
      method: "POST",
      headers: adminHeader(token),
      body: JSON.stringify({ current, next }),
    }),

  listCourses: (token: string) =>
    request<{ courses: Course[] }>("/academy/admin/courses", { headers: adminHeader(token) }),

  saveCourse: (token: string, course: Partial<Course>) =>
    request<{ course: Course }>("/academy/admin/courses", {
      method: "POST",
      headers: adminHeader(token),
      body: JSON.stringify(course),
    }),

  deleteCourse: (token: string, id: string) =>
    request<{ ok: boolean }>("/academy/admin/courses/delete", {
      method: "POST",
      headers: adminHeader(token),
      body: JSON.stringify({ id }),
    }),

  listApplications: (token: string) =>
    request<{ applications: AcademyApplication[] }>("/academy/admin/applications", {
      headers: adminHeader(token),
    }),

  // Facilitators
  listFacilitators: (token: string) =>
    request<{ facilitators: Facilitator[] }>("/academy/admin/facilitators", { headers: adminHeader(token) }),

  createFacilitator: (token: string, input: { name: string; email: string; password: string; title?: string; bio?: string }) =>
    request<{ facilitator: Facilitator }>("/academy/admin/facilitators", {
      method: "POST", headers: adminHeader(token), body: JSON.stringify(input),
    }),

  deleteFacilitator: (token: string, id: string) =>
    request<{ ok: boolean }>("/academy/admin/facilitators/delete", {
      method: "POST", headers: adminHeader(token), body: JSON.stringify({ id }),
    }),

  assignFacilitator: (token: string, facilitatorId: string, courseId: string, assigned: boolean) =>
    request<{ ok: boolean }>("/academy/admin/facilitators/assign", {
      method: "POST", headers: adminHeader(token), body: JSON.stringify({ facilitatorId, courseId, assigned }),
    }),

  setFacilitatorPassword: (token: string, id: string, password: string) =>
    request<{ ok: boolean }>("/academy/admin/facilitators/password", {
      method: "POST", headers: adminHeader(token), body: JSON.stringify({ id, password }),
    }),

  // Materials
  listMaterials: (token: string, courseId: string) =>
    request<{ materials: Material[] }>(`/academy/admin/materials?courseId=${encodeURIComponent(courseId)}`, { headers: adminHeader(token) }),

  materialUploadUrl: (token: string, input: { courseId: string; fileName: string; contentType: string }) =>
    request<{ uploadUrl: string; fileKey: string }>("/academy/admin/materials/upload-url", {
      method: "POST", headers: adminHeader(token), body: JSON.stringify(input),
    }),

  createMaterial: (token: string, input: { courseId: string; title: string; kind: string; fileKey: string; fileName: string; contentType: string; sizeBytes: number; studentVisible: boolean }) =>
    request<{ material: Material }>("/academy/admin/materials", {
      method: "POST", headers: adminHeader(token), body: JSON.stringify(input),
    }),

  deleteMaterial: (token: string, id: string) =>
    request<{ ok: boolean }>("/academy/admin/materials/delete", {
      method: "POST", headers: adminHeader(token), body: JSON.stringify({ id }),
    }),

  materialDownloadUrl: (token: string, id: string) =>
    request<{ url: string }>(`/academy/admin/materials/download?id=${encodeURIComponent(id)}`, { headers: adminHeader(token) }),

  // Sessions (calendar)
  listSessions: (token: string, courseId: string) =>
    request<{ sessions: CourseSession[] }>(`/academy/admin/sessions?courseId=${encodeURIComponent(courseId)}`, { headers: adminHeader(token) }),
  createSession: (token: string, input: { courseId: string; title: string; startsAt: string; endsAt?: string; location?: string }) =>
    request<{ session: CourseSession }>("/academy/admin/sessions", { method: "POST", headers: adminHeader(token), body: JSON.stringify(input) }),
  deleteSession: (token: string, id: string) =>
    request<{ ok: boolean }>("/academy/admin/sessions/delete", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ id }) }),

  // Enrollments + certificates
  listEnrollments: (token: string, courseId: string) =>
    request<{ enrollments: AdminEnrollment[] }>(`/academy/admin/enrollments?courseId=${encodeURIComponent(courseId)}`, { headers: adminHeader(token) }),
  removeEnrollment: (token: string, id: string) =>
    request<{ ok: boolean }>("/academy/admin/enrollments/remove", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ id }) }),
  generateCertificate: (token: string, enrollmentId: string) =>
    request<{ ok: boolean; serial: string; emailed: boolean; emailError: string | null }>("/academy/admin/certificate", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ enrollmentId }) }),

  // Reviews + exams
  listReviews: (token: string, courseId: string) =>
    request<{ reviews: (Review & { id: string; email: string; hidden: boolean })[] }>(`/academy/admin/reviews?courseId=${encodeURIComponent(courseId)}`, { headers: adminHeader(token) }),
  hideReview: (token: string, id: string, hidden: boolean) =>
    request<{ ok: boolean }>("/academy/admin/reviews/hide", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ id, hidden }) }),
  getExam: (token: string, courseId: string) =>
    request<{ exam: EditableExam | null }>(`/academy/admin/exam?courseId=${encodeURIComponent(courseId)}`, { headers: adminHeader(token) }),
  saveExam: (token: string, exam: Partial<EditableExam> & { courseId: string }) =>
    request<{ ok: boolean; examId: string }>("/academy/admin/exam", { method: "POST", headers: adminHeader(token), body: JSON.stringify(exam) }),
  grantRetake: (token: string, courseId: string, userId: string) =>
    request<{ ok: boolean }>("/academy/admin/exam/grant", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ courseId, userId }) }),
};

export interface AdminEnrollment {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  progress: number;
  completedAt: string | null;
  certSerial: string | null;
}

export interface RosterStudent {
  enrollmentId: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  progress: number;
  completedAt: string | null;
  certSerial: string | null;
}

export interface StudentCourseDetail {
  enrollment: { id: string; status: string; progress: number; completedAt: string | null };
  course: Course;
  items: CourseItem[];
  completed: string[];
  materials: Material[];
  sessions: CourseSession[];
  certificate: { id: string; serial: string; issuedAt: string; hasFile: boolean } | null;
}

// Student portal uses the standard Loopital user account (JWT).
export const studentApi = {
  signup: (name: string, email: string, password: string) => authApi.signup(name, email, password),
  signin: (email: string, password: string) => authApi.signin(email, password),
  me: (token: string) => authApi.me(token),
  courses: (token: string) => request<{ courses: Enrollment[] }>("/academy/student/courses", { headers: adminHeader(token) }),
  enroll: (token: string, courseId: string) => request<{ ok: boolean }>("/academy/student/enroll", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ courseId }) }),
  unenroll: (token: string, courseId: string) => request<{ ok: boolean }>("/academy/student/unenroll", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ courseId }) }),
  course: (token: string, courseId: string) => request<StudentCourseDetail>(`/academy/student/course?courseId=${encodeURIComponent(courseId)}`, { headers: adminHeader(token) }),
  progress: (token: string, courseId: string, itemKey: string, completed: boolean) => request<{ progress: number; status: string }>("/academy/student/progress", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ courseId, itemKey, completed }) }),
  materialDownloadUrl: (token: string, id: string) => request<{ url: string }>(`/academy/student/materials/download?id=${encodeURIComponent(id)}`, { headers: adminHeader(token) }),
  certificateDownloadUrl: (token: string, id: string) => request<{ url: string }>(`/academy/student/certificate/download?id=${encodeURIComponent(id)}`, { headers: adminHeader(token) }),
  review: (token: string, courseId: string, rating: number, comment: string) => request<{ ok: boolean }>("/academy/student/review", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ courseId, rating, comment }) }),
  exam: (token: string, courseId: string) => request<StudentExam>(`/academy/student/exam?courseId=${encodeURIComponent(courseId)}`, { headers: adminHeader(token) }),
  submitExam: (token: string, courseId: string, answers: Record<string, string[]>) => request<ExamResult>("/academy/student/exam/submit", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ courseId, answers }) }),
  profile: (token: string) => request<{ name: string; email: string; username: string }>("/academy/student/profile", { headers: adminHeader(token) }),
  setUsername: (token: string, username: string) => request<{ username: string }>("/academy/student/username", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ username }) }),
};

// ── Academy facilitator portal ─────────────────────────────────────────
export interface FacilitatorCourse {
  id: string;
  slug: string;
  title: string;
  image: string;
  track: string;
  status: string;
  introVideoUrl: string;
  materials: Material[];
}

export interface FacilitatorProfile {
  id: string;
  name: string;
  email: string;
  title: string;
  bio: string;
}

export const facilitatorApi = {
  login: (email: string, password: string) =>
    request<{ token: string; facilitator: { id: string; name: string; email: string } }>("/academy/facilitator/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    request<{ facilitator: FacilitatorProfile; courses: FacilitatorCourse[] }>("/academy/facilitator/me", { headers: adminHeader(token) }),

  changePassword: (token: string, current: string, next: string) =>
    request<{ ok: boolean }>("/academy/facilitator/password", {
      method: "POST", headers: adminHeader(token), body: JSON.stringify({ current, next }),
    }),

  materialDownloadUrl: (token: string, id: string) =>
    request<{ url: string }>(`/academy/facilitator/materials/download?id=${encodeURIComponent(id)}`, { headers: adminHeader(token) }),

  roster: (token: string, courseId: string) =>
    request<{ students: RosterStudent[] }>(`/academy/facilitator/roster?courseId=${encodeURIComponent(courseId)}`, { headers: adminHeader(token) }),

  generateCertificate: (token: string, enrollmentId: string) =>
    request<{ ok: boolean; serial: string; emailed: boolean; emailError: string | null }>("/academy/facilitator/certificate", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ enrollmentId }) }),

  getExam: (token: string, courseId: string) =>
    request<{ exam: EditableExam | null }>(`/academy/facilitator/exam?courseId=${encodeURIComponent(courseId)}`, { headers: adminHeader(token) }),
  saveExam: (token: string, exam: Partial<EditableExam> & { courseId: string }) =>
    request<{ ok: boolean; examId: string }>("/academy/facilitator/exam", { method: "POST", headers: adminHeader(token), body: JSON.stringify(exam) }),
  grantRetake: (token: string, courseId: string, userId: string) =>
    request<{ ok: boolean }>("/academy/facilitator/exam/grant", { method: "POST", headers: adminHeader(token), body: JSON.stringify({ courseId, userId }) }),
};

/** Upload a file to S3 via a presigned PUT URL. */
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
  if (!res.ok) throw new Error("Upload failed. Please try again.");
}

// ── Unified account portal ─────────────────────────────────────────────
// loopital.com is the single portal for the account-linked products
// (SART34 + STACK62). Subscriptions are kept separate per product. HMS7 and
// FMS13 are demo-led and never appear here.

export type AccountProductId = "sart34" | "stack62";

export interface Subscription {
  product: AccountProductId;
  plan: string;
  status: "active" | "trialing" | "past_due" | "canceled";
  currentPeriodEnd: string; // ISO date
}

export interface Invoice {
  id: string;
  product: AccountProductId;
  amount: string; // formatted, e.g. "$29.00"
  status: "paid" | "open" | "void";
  issuedAt: string; // ISO date
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const accountApi = {
  getSubscriptions: (token: string) =>
    request<{ subscriptions: Subscription[] }>("/account/subscriptions", { headers: authHeader(token) }),

  getInvoices: (token: string) =>
    request<{ invoices: Invoice[] }>("/account/invoices", { headers: authHeader(token) }),
};

// ── Single sign-on ──────────────────────────────────────────────────────
// loopital is the identity provider. To open a federated app (SART34/STACK62)
// for a logged-in user, mint a short-lived SSO token and carry it to the app,
// which exchanges it server-side for the loopital user.

export const ssoApi = {
  getLaunchToken: (product: AccountProductId, token: string) =>
    request<{ ssoToken: string; expiresIn: number }>("/sso/token", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ product }),
    }),
};

/**
 * Opens a federated product app. When the user is signed in, performs the SSO
 * handoff (so they land already authenticated once the app integrates the
 * receiving side); otherwise just opens the app normally.
 */
export async function launchProductApp(
  appHref: string,
  product: AccountProductId,
  token: string | null
): Promise<void> {
  const base = appHref.replace(/\/$/, "");
  if (!token) {
    window.open(appHref, "_blank", "noopener");
    return;
  }
  try {
    const { ssoToken } = await ssoApi.getLaunchToken(product, token);
    window.open(`${base}/sso?token=${encodeURIComponent(ssoToken)}`, "_blank", "noopener");
  } catch {
    // Fall back to a normal launch if SSO minting fails.
    window.open(appHref, "_blank", "noopener");
  }
}
