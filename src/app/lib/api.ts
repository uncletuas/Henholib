import { API_BASE_URL } from "../config/site";

/** A team member's account on the hub (used by the onboarding portal). */
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

// loopital.com/contribute — the research questionnaire. Every answer travels
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

// Contact form → recorded, and emailed to the team.
export const contactApi = {
  send: (input: { name: string; email: string; subject: string; message: string }) =>
    request<{ ok: boolean }>("/contact", { method: "POST", body: JSON.stringify(input) }),
};

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
