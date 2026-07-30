import { API_BASE_URL } from "../config/site";

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
