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
