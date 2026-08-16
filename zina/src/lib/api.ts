/**
 * The Zina API client.
 *
 * One thin `request` with the staff token attached, and a typed function per
 * endpoint. Errors arrive as thrown `Error`s carrying the server's own message,
 * because the API already writes those for a human to read and rewording them
 * here would only make them vaguer.
 */

export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api"
).replace(/\/$/, "");

const TOKEN_KEY = "zina.token";

export function storedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode — the session simply won't survive a reload */
  }
}

/** Thrown when the session is gone, so the shell can send the user to sign in. */
export class UnauthorizedError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = storedToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Couldn't reach the Loopital API. Check your connection.");
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 401) {
    storeToken(null);
    throw new UnauthorizedError((data.error as string) || "Please sign in again.");
  }
  if (!res.ok) throw new Error((data.error as string) || `Something went wrong (${res.status}).`);
  return data as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
const put = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

// ── Types ──────────────────────────────────────────────────────────────────

export type Permission =
  | "app:read" | "app:manage" | "app:switch"
  | "user:read" | "user:manage"
  | "billing:read" | "billing:manage"
  | "notify:read" | "notify:send"
  | "support:read" | "support:respond"
  | "secret:read" | "secret:reveal" | "secret:manage"
  | "system:read" | "system:manage"
  | "analytics:read"
  | "staff:manage"
  | "audit:read";

export interface Staff {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  roleLabel: string;
  title: string | null;
  appScope: string[];
  permissions: Permission[];
}

export type HealthStatus = "ok" | "degraded" | "down" | "unconfigured" | "unknown";

export interface AppSummaryCard {
  id: string;
  name: string;
  tagline: string | null;
  accent: string;
  appUrl: string | null;
  adminUrl: string | null;
  connected: boolean;
  health: HealthStatus;
  latencyMs: number | null;
  checkedAt: string | null;
  summary: Record<string, unknown> | null;
  summaryError: string | null;
}

export interface Payment {
  reference: string;
  product: string;
  purpose: string;
  amountMinor: number;
  currency: string;
  plan: string | null;
  credits: number | null;
  seats: number;
  status: "pending" | "success" | "failed";
  createdAt: string;
  customer?: { name: string; email: string };
}

export interface Overview {
  scope: string[];
  totals: {
    users: number;
    newUsers30d: number;
    activeSubscriptions: number;
    waitlist: number;
    grossMinor: number;
  };
  revenueByProduct: Record<string, { grossMinor: number; paid: number; pending: number }>;
  recentPayments: Payment[];
  notifications7d: Record<string, number>;
  tickets: Record<string, number>;
  apps: AppSummaryCard[];
}

export interface ManagedApp {
  id: string;
  name: string;
  tagline: string | null;
  appUrl: string | null;
  adminUrl: string | null;
  opsBaseUrl: string | null;
  hasSecret: boolean;
  accent: string;
  sortOrder: number;
  enabled: boolean;
  health: HealthStatus;
  latencyMs: number | null;
  dbStatus: string | null;
  healthDetail: string | null;
  checkedAt: string | null;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: string;
  products: string[];
}

export interface UserDetail {
  user: DirectoryUser & {
    headline: string | null;
    pal: { onboarded: boolean; useType: string | null; orgName: string | null; teamSize: string | null };
  };
  subscriptions: {
    product: string;
    plan: string;
    status: string;
    seats: number;
    currentPeriodEnd: string | null;
    createdAt: string;
  }[];
  payments: Payment[];
  emails: { appId: string | null; subject: string; status: string; error: string | null; createdAt: string }[];
  tickets: { id: string; appId: string | null; subject: string; status: string; priority: string; createdAt: string }[];
  inApps: {
    appId: string;
    name: string;
    accent: string;
    known: boolean;
    record: Record<string, unknown> | null;
    unavailable: string | null;
  }[];
}

export interface Notification {
  id: string;
  appId: string | null;
  template: string | null;
  to: string;
  subject: string;
  status: "queued" | "sent" | "failed";
  providerId: string | null;
  error: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  appId: string | null;
  subject: string;
  requester: { name: string | null; email: string };
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assigneeId: string | null;
  messages: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  author: "staff" | "requester" | "system";
  staffName: string | null;
  body: string;
  emailed: boolean;
  createdAt: string;
}

export interface Secret {
  id: string;
  appId: string | null;
  appName: string | null;
  accent: string | null;
  kind: "api_key" | "database" | "webhook" | "oauth" | "url" | "config" | "other";
  label: string;
  envVar: string | null;
  preview: string;
  hint: string | null;
  rotatedAt: string | null;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  roleLabel: string;
  title: string | null;
  appScope: string[];
  isActive: boolean;
  lastSeen: string | null;
  createdAt: string;
}

export interface RoleDefinition {
  id: string;
  label: string;
  description: string;
  permissions: Permission[];
}

export interface AuditEntry {
  id: string;
  actor: { name: string | null; email: string | null };
  appId: string | null;
  action: string;
  target: string | null;
  detail: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

export interface Analytics {
  days: number;
  signups: { day: string; count: number }[];
  revenue: { day: string; product: string; totalMinor: number }[];
  subscriptions: { product: string; plan: string; status: string; count: number }[];
  appMetrics: { appId: string; metric: string; day: string; value: number }[];
  email: { day: string; status: string; count: number }[];
}

export interface DatabaseView {
  own: {
    appId: string;
    name?: string;
    status: string;
    latencyMs?: number;
    database?: string;
    size?: string;
    connections?: number;
    pool?: { total: number; idle: number; waiting: number };
    detail?: string;
  } | null;
  apps: {
    appId: string;
    name: string;
    accent: string;
    connected: boolean;
    status: HealthStatus;
    dbStatus: string | null;
    latencyMs: number | null;
    detail: string | null;
  }[];
}

export interface BillingCatalog {
  currency: string;
  configured: boolean;
  callbackUrl: string | null;
  products: {
    product: string;
    purposes: {
      purpose: string;
      items: {
        key: string;
        amountMinor: number;
        credits: number | null;
        seatBased: boolean;
        minSeats: number | null;
      }[];
    }[];
  }[];
}

// ── Endpoints ──────────────────────────────────────────────────────────────

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
};

export const api = {
  login: (email: string, password: string) =>
    post<{ token: string; staff: Staff }>("/zina/auth/login", { email, password }),
  me: () => get<{ staff: Staff }>("/zina/me"),

  overview: () => get<Overview>("/zina/overview"),

  apps: () => get<{ apps: ManagedApp[] }>("/zina/apps"),
  updateApp: (id: string, body: Partial<ManagedApp> & { opsSecret?: string }) =>
    put<{ app: ManagedApp }>(`/zina/apps/${encodeURIComponent(id)}`, body),
  switchInto: (id: string) =>
    post<{ url: string; mode: "session" | "link"; note?: string }>(
      `/zina/apps/${encodeURIComponent(id)}/switch`
    ),
  checkHealth: (appId?: string) =>
    get<{ health: unknown[] }>(`/zina/health${query({ appId })}`),

  users: (params: { q?: string; limit?: number; offset?: number } = {}) =>
    get<{ users: DirectoryUser[]; total: number; limit: number; offset: number }>(
      `/zina/users${query(params)}`
    ),
  user: (id: string) => get<UserDetail>(`/zina/users/${encodeURIComponent(id)}`),
  userAction: (id: string, appId: string, action: "suspend" | "restore" | "reset-password") =>
    post<{ ok: boolean }>(`/zina/users/${encodeURIComponent(id)}/action`, { appId, action }),

  payments: (params: { product?: string; status?: string; limit?: number } = {}) =>
    get<{
      payments: Payment[];
      summary: { product: string; status: string; count: number; totalMinor: number }[];
    }>(`/zina/payments${query(params)}`),
  billingCatalog: () => get<BillingCatalog>("/zina/billing/catalog"),

  notifications: (params: { status?: string; appId?: string; q?: string; limit?: number } = {}) =>
    get<{
      notifications: Notification[];
      stats30d: Record<string, number>;
      configured: boolean;
      from: string | null;
    }>(`/zina/notifications${query(params)}`),
  sendNotification: (body: { to: string; subject: string; body: string; appId?: string }) =>
    post<{ ok: boolean; id: string }>("/zina/notifications/send", body),

  tickets: (params: { status?: string; appId?: string } = {}) =>
    get<{ tickets: Ticket[]; counts: Record<string, number> }>(`/zina/tickets${query(params)}`),
  ticket: (id: string) =>
    get<{ ticket: Ticket; messages: TicketMessage[] }>(`/zina/tickets/${encodeURIComponent(id)}`),
  replyToTicket: (id: string, body: string) =>
    post<{ ok: boolean; emailed: boolean; emailError: string | null }>(
      `/zina/tickets/${encodeURIComponent(id)}/reply`,
      { body }
    ),
  updateTicket: (id: string, body: { status?: string; priority?: string; assignToMe?: boolean }) =>
    post<{ ticket: Ticket }>(`/zina/tickets/${encodeURIComponent(id)}`, body),

  secrets: (appId?: string) =>
    get<{ configured: boolean; secrets: Secret[] }>(`/zina/secrets${query({ appId })}`),
  saveSecret: (body: {
    appId?: string;
    kind: string;
    label: string;
    value: string;
    envVar?: string;
    hint?: string;
  }) => post<{ ok: boolean; id: string }>("/zina/secrets", body),
  revealSecret: (id: string) =>
    post<{ value: string }>(`/zina/secrets/${encodeURIComponent(id)}/reveal`),
  deleteSecret: (id: string) => del<{ ok: boolean }>(`/zina/secrets/${encodeURIComponent(id)}`),

  /** Which variables an app will receive on its next config pull, and at what version. */
  configPreview: (appId: string) =>
    get<{
      appId: string;
      version: number;
      updatedAt: string | null;
      variables: { envVar: string; kind: string; label: string; rotatedAt: string | null }[];
    }>(`/zina/config/${encodeURIComponent(appId)}`),

  databases: () => get<DatabaseView>("/zina/databases"),
  analytics: (days = 30) => get<Analytics>(`/zina/analytics${query({ days })}`),

  staff: () => get<{ staff: StaffMember[]; roles: RoleDefinition[] }>("/zina/staff"),
  saveStaff: (body: { email: string; role: string; title?: string; appScope?: string[] }) =>
    post<{ ok: boolean; id: string }>("/zina/staff", body),
  setStaffActive: (id: string, isActive: boolean) =>
    post<{ ok: boolean }>(`/zina/staff/${encodeURIComponent(id)}/active`, { isActive }),

  audit: (params: { appId?: string; limit?: number } = {}) =>
    get<{ entries: AuditEntry[] }>(`/zina/audit${query(params)}`),
};
