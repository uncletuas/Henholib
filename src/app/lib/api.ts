import { API_BASE_URL } from "../config/site";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Shared "Google-style" profile fields, consistent across Loopital/Pal/Swift. */
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
// Public capture for products not yet open to the public (STACK62, SART34).
export const waitlistApi = {
  join: (product: string, email: string, name?: string) =>
    request<{ ok: boolean }>("/waitlist", {
      method: "POST",
      body: JSON.stringify({ product, email, name }),
    }),
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
// (SART34 + STACK62). Subscriptions are kept separate per product. HMS7 and
// Modus are demo-led and never appear here.

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

  /** Update the shared profile (name, avatar, headline). Returns the fresh user. */
  updateProfile: (token: string, update: ProfileUpdate) =>
    request<{ user: AuthUser }>("/account/profile", {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify(update),
    }),
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
