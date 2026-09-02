import { API_BASE_URL } from "../config/site";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Shared "Google-style" profile fields, consistent across Loopital and Pal. */
  username?: string | null;
  avatarUrl?: string | null;
  headline?: string | null;
}

export interface ProfileUpdate {
  name?: string;
  avatarUrl?: string;
  headline?: string;
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

  /** Sign in / up with a Google ID token (credential) from the Google button. */
  google: (credential: string) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
};

// ── Waitlist ───────────────────────────────────────────────────────────
// Public capture for products not yet open to the public.
export const waitlistApi = {
  join: (product: string, email: string, name?: string) =>
    request<{ ok: boolean }>("/waitlist", {
      method: "POST",
      body: JSON.stringify({ product, email, name }),
    }),
};

// "Contribute to Henholib" — the research questionnaire. Every answer travels
// in `answers`; the backend stores it as jsonb, so adding a question here needs
// no API change.
export const contributeApi = {
  send: (input: {
    path: "individual" | "organization";
    name: string;
    email: string;
    phone: string;
    organisation?: string;
    consent: boolean;
    answers: Record<string, string | string[]>;
    attribution: Record<string, string>;
  }) =>
    request<{ ok: boolean }>("/contribute", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

// Demo requests for the enterprise products. Separate from the contact form so
// the qualifying answers (organisation, size, role) travel with the request and
// it lands in Zina tagged with the product it is about.
export const demoApi = {
  request: (input: Record<string, string>) =>
    request<{ ok: boolean }>("/demo-request", { method: "POST", body: JSON.stringify(input) }),
};

// Contact form → emails admin@loopital.com + tuamenebestgod@gmail.com (SES).
export const contactApi = {
  send: (input: { name: string; email: string; subject: string; message: string }) =>
    request<{ ok: boolean }>("/contact", { method: "POST", body: JSON.stringify(input) }),
};


/** Upload a file to S3 via a presigned PUT URL. */
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
  if (!res.ok) throw new Error("Upload failed. Please try again.");
}

// ── Unified account portal ─────────────────────────────────────────────
// loopital.com is the single portal for the account-linked products
// (Pal). Subscriptions are kept separate per product. HMS7 and
// Modus are demo-led and never appear here.

export type AccountProductId = "stack62";

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

/**
 * The team onboarding portal.
 *
 * Every call carries the member's own bearer token, and the server re-checks
 * the stage gates on each one — `state` is what the UI trusts to decide which
 * screen to show, rather than anything it remembers locally, so a resumed
 * session on a new device lands in the right place.
 */
export interface OnboardingState {
  email: string;
  name: string | null;
  stage: "nda" | "form" | "done";
  ndaSigned: boolean;
  ndaSignedAt: string | null;
  formComplete: boolean;
  step: number;
  answers: Record<string, unknown>;
  roles: string[];
}

export interface NdaClause {
  heading: string;
  text?: string[];
  bullets?: string[];
}

export interface NdaDocument {
  version: string;
  title: string;
  subtitle: string;
  preamble: string[];
  clauses: NdaClause[];
  footer: string;
  company: { name: string; title: string; company: string };
}

export const onboardingApi = {
  state: (token: string) =>
    request<OnboardingState>("/onboarding/state", { headers: authHeader(token) }),

  document: (token: string) =>
    request<NdaDocument>("/onboarding/document", { headers: authHeader(token) }),

  signNda: (
    token: string,
    input: {
      fullName: string;
      role: string;
      method: "drawn" | "typed" | "uploaded";
      /** PNG data URL. The date is deliberately not sent: the server stamps it. */
      signature: string;
      readConfirmed: boolean;
      legalConsent: boolean;
    },
  ) =>
    request<{ ok: boolean; signedAt: string }>("/onboarding/nda", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(input),
    }),

  saveForm: (token: string, step: number, answers: Record<string, unknown>) =>
    request<{ ok: boolean; savedAt: string }>("/onboarding/form/save", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ step, answers }),
    }),

  submitForm: (token: string, answers: Record<string, unknown>) =>
    request<{ ok: boolean }>("/onboarding/form/submit", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({ answers }),
    }),

  /** Absolute URLs for the two gated PDFs. Both are fetched with the token
   *  rather than linked to directly, because an <a href> cannot carry an
   *  Authorization header — and neither file should be reachable without one. */
  ndaPdfUrl: () => `${API_BASE_URL}/onboarding/nda.pdf`,
  handbookUrl: () => `${API_BASE_URL}/onboarding/handbook.pdf`,
};

export const accountApi = {
  getSubscriptions: (token: string) =>
    request<{ subscriptions: Subscription[] }>("/account/subscriptions", { headers: authHeader(token) }),

  getInvoices: (token: string) =>
    request<{ invoices: Invoice[] }>("/account/invoices", { headers: authHeader(token) }),

  /** Update the shared profile (name, avatar, headline). Returns the fresh user. */
  updateProfile: (token: string, update: ProfileUpdate) =>
    request<{ user: AuthUser }>("/account/profile", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(update),
    }),
};

// ── Single sign-on ──────────────────────────────────────────────────────
// loopital is the identity provider. To open a federated app (Pal)
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

// ── Pal workspace ───────────────────────────────────────────────────────
// A Loopital account IS a Pal account. The workspace is free; the AI coworker
// is a paid upgrade billed here via Paystack (product = "stack62").
export type PalPlan = "free" | "pro" | "business";

export interface PalProfile {
  onboarded: boolean;
  useType: string | null;
  orgName: string | null;
  teamSize: string | null;
  coworker: boolean; // has a paid coworker subscription (pro or business)
  plan?: PalPlan;
  seats?: number;
}

export const palApi = {
  getProfile: (token: string) => request<PalProfile>("/account/pal", { headers: authHeader(token) }),
  saveOnboarding: (token: string, input: { useType: string; orgName?: string; teamSize?: string }) =>
    request<{ ok: boolean }>("/account/pal/onboarding", { method: "POST", headers: authHeader(token), body: JSON.stringify(input) }),
  subscribe: (token: string, input?: { plan?: PalPlan; seats?: number }) =>
    request<{ authorizationUrl: string; reference: string; plan: string; seats: number; amount: number }>(
      "/account/pal/subscribe",
      { method: "POST", headers: authHeader(token), body: JSON.stringify(input || { plan: "pro" }) }
    ),
};

export const payApi = {
  verify: (token: string, reference: string) =>
    request<{ status: string }>(`/account/pay/verify?reference=${encodeURIComponent(reference)}`, { headers: authHeader(token) }),
};

// ── Unified checkout ────────────────────────────────────────────────────
// One checkout portal for every product. The product is passed by the caller
// (from the page/nav you're already on), so the checkout NEVER shows a product
// list — it just processes the payment for that one service, on the single
// Paystack account. Each service has its own plans/pricing page that calls this.
export type BillingProduct = "stack62" | "fms13" | "edm73";

export const billingApi = {
  checkout: (
    token: string,
    input: { product: BillingProduct; purpose: "subscription" | "credits"; plan?: string; bundle?: string; seats?: number }
  ) =>
    request<{ authorizationUrl: string; reference: string; amount: number }>(
      "/billing/checkout",
      { method: "POST", headers: authHeader(token), body: JSON.stringify(input) }
    ),
};
