"use strict";

/**
 * Every external service the ecosystem depends on, and the credentials each one
 * needs.
 *
 * The vault started as a place to *record* a key you already knew about. That
 * is the wrong way round: it means the screen is empty until someone remembers
 * what to type, and the question you actually have at 2am — "what are we paying
 * for, which app breaks if this expires, and where do I change it?" — is
 * unanswerable.
 *
 * So this is the catalog, held in code because it describes the shape of the
 * system rather than its contents. Zina joins it against what's actually stored
 * and shows every service whether or not a value has been set, so a blank row
 * reads as "nobody has configured this yet" instead of as absence.
 *
 * Values never live here. Only names, purposes, and where to go when a key
 * needs rotating.
 *
 * Adding a service: add an entry. Adding a variable to one: add it to `vars`.
 * Nothing else changes — the portal renders whatever this describes.
 */

/** Apps, by the id used in `zina_apps`. */
const L = "loopital";
const PAL = "stack62";
const SWIFT = "sart34";
const MODUS = "fms13";
const BEACON = "edm73";
const HEN = "hms7";

/**
 * `critical` means the app does not function without it. It drives the ordering
 * and the warning in the portal — an unset Paystack key is a different kind of
 * problem from an unset TikTok one.
 */
const SERVICES = [
  // ── Money ───────────────────────────────────────────────────────────────
  {
    id: "paystack",
    name: "Paystack",
    category: "Payments",
    purpose: "The single merchant account every product bills through.",
    console: "https://dashboard.paystack.com/#/settings/developers",
    critical: true,
    vars: [
      { key: "PAYSTACK_SECRET_KEY", apps: [L, SWIFT], secret: true, note: "Server-side key. Also verifies webhook signatures." },
      { key: "PAYSTACK_PUBLIC_KEY", apps: [SWIFT], secret: false },
      { key: "PAYSTACK_WEBHOOK_SECRET", apps: [SWIFT], secret: true },
      { key: "PAYSTACK_CALLBACK_URL", apps: [L], secret: false, note: "Where Paystack returns the customer after payment." },
      { key: "PAYSTACK_CURRENCY", apps: [L], secret: false, note: "NGN unless deliberately changed." },
      { key: "LOOPITAL_PAYSTACK_SECRET_KEY", apps: [BEACON], secret: true, note: "Beacon bills institutions on the same account." },
      { key: "LOOPITAL_PAYSTACK_PUBLIC_KEY", apps: [BEACON], secret: false },
    ],
  },

  // ── Email and messaging ─────────────────────────────────────────────────
  {
    id: "resend",
    name: "Resend",
    category: "Email",
    purpose: "The one sending account. Every transactional email in the group goes through it.",
    console: "https://resend.com/api-keys",
    critical: true,
    vars: [
      { key: "RESEND_API_KEY", apps: [L], secret: true, note: "Held only by the hub — no other app has it." },
      { key: "RESEND_FROM_EMAIL", apps: [L], secret: false, note: 'e.g. "Loopital <no-reply@loopital.com>". The domain must be verified in Resend.' },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "Messaging",
    purpose: "Phone verification and SMS.",
    console: "https://console.twilio.com",
    vars: [
      { key: "TWILIO_ACCOUNT_SID", apps: [HEN, BEACON], secret: false },
      { key: "TWILIO_AUTH_TOKEN", apps: [HEN, BEACON], secret: true },
      { key: "TWILIO_VERIFY_SERVICE_SID", apps: [HEN], secret: false },
    ],
  },
  {
    id: "termii",
    name: "Termii",
    category: "Messaging",
    purpose: "Nigerian SMS delivery, used per-institution by Beacon.",
    console: "https://accounts.termii.com",
    vars: [{ key: "TERMII_API_KEY", apps: [BEACON], secret: true }],
  },

  // ── AI ──────────────────────────────────────────────────────────────────
  {
    id: "openai",
    name: "OpenAI-compatible LLM",
    category: "AI",
    purpose: "Chat and embeddings. The base URL is what lets this point at OpenAI, OpenRouter, Qwen or a local model.",
    console: "https://platform.openai.com/api-keys",
    critical: true,
    vars: [
      { key: "OPENAI_API_KEY", apps: [PAL, SWIFT], secret: true },
      { key: "OPENAI_BASE_URL", apps: [PAL, SWIFT], secret: false, note: "Change this to switch provider without touching code." },
      { key: "OPENAI_MODEL", apps: [PAL, SWIFT], secret: false },
      { key: "OPENAI_MODEL_CHEAP", apps: [PAL], secret: false },
      { key: "OPENAI_EMBEDDING_BASE_URL", apps: [PAL], secret: false },
      { key: "EMBEDDING_MODEL", apps: [PAL], secret: false },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    category: "AI",
    purpose: "Claude models, where Pal uses them directly.",
    console: "https://console.anthropic.com/settings/keys",
    vars: [
      { key: "ANTHROPIC_API_KEY", apps: [PAL], secret: true },
      { key: "ANTHROPIC_MODEL", apps: [PAL], secret: false },
    ],
  },
  {
    id: "ollama",
    name: "Ollama",
    category: "AI",
    purpose: "Self-hosted models. Off unless a host is set.",
    vars: [
      { key: "OLLAMA_BASE_URL", apps: [PAL], secret: false },
      { key: "OLLAMA_MODEL", apps: [PAL], secret: false },
    ],
  },

  // ── Identity and ad platforms ───────────────────────────────────────────
  {
    id: "google",
    name: "Google",
    category: "Identity & Ads",
    purpose: "Sign-in across the group, plus Google Ads and Workspace for the products that use them.",
    console: "https://console.cloud.google.com/apis/credentials",
    critical: true,
    vars: [
      { key: "GOOGLE_CLIENT_ID", apps: [L, PAL, SWIFT, BEACON], secret: false, note: "Public. Every app should share the same one." },
      { key: "GOOGLE_CLIENT_SECRET", apps: [PAL, SWIFT, BEACON], secret: true },
      { key: "GOOGLE_REDIRECT_URI", apps: [PAL, SWIFT, BEACON], secret: false, note: "Must match the console exactly, per app." },
      { key: "GOOGLE_DEVELOPER_TOKEN", apps: [SWIFT], secret: true, note: "Google Ads API." },
      { key: "GOOGLE_ADS_AUTH_REDIRECT_URI", apps: [SWIFT], secret: false },
      { key: "GOOGLE_WORKSPACE_CLIENT_ID", apps: [PAL], secret: false },
      { key: "GOOGLE_WORKSPACE_CLIENT_SECRET", apps: [PAL], secret: true },
      { key: "GOOGLE_WORKSPACE_API_KEY", apps: [PAL], secret: true },
    ],
  },
  {
    id: "meta",
    name: "Meta / WhatsApp",
    category: "Identity & Ads",
    purpose: "Facebook and Instagram ads, and WhatsApp Business messaging.",
    console: "https://developers.facebook.com/apps",
    vars: [
      { key: "META_APP_ID", apps: [PAL, SWIFT], secret: false },
      { key: "META_APP_SECRET", apps: [PAL, SWIFT], secret: true },
      { key: "META_REDIRECT_URI", apps: [PAL, SWIFT], secret: false },
      { key: "META_WHATSAPP_ACCESS_TOKEN", apps: [PAL], secret: true },
      { key: "META_WHATSAPP_PHONE_NUMBER_ID", apps: [PAL], secret: false },
      { key: "WHATSAPP_APP_SECRET", apps: [SWIFT], secret: true },
      { key: "WHATSAPP_PHONE_NUMBER_ID", apps: [SWIFT], secret: false },
      { key: "WHATSAPP_BUSINESS_ACCOUNT_ID", apps: [SWIFT], secret: false },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "Identity & Ads",
    purpose: "TikTok ads and conversion tracking.",
    console: "https://ads.tiktok.com",
    vars: [
      { key: "TIKTOK_APP_ID", apps: [SWIFT], secret: false },
      { key: "TIKTOK_APP_SECRET", apps: [SWIFT], secret: true },
      { key: "TIKTOK_REDIRECT_URI", apps: [SWIFT], secret: false },
      { key: "TIKTOK_PIXEL_ID", apps: [SWIFT], secret: false },
      { key: "TIKTOK_PIXEL_ACCESS_TOKEN", apps: [SWIFT], secret: true },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "Identity & Ads",
    purpose: "LinkedIn campaign publishing.",
    console: "https://www.linkedin.com/developers/apps",
    vars: [
      { key: "LINKEDIN_CLIENT_ID", apps: [SWIFT], secret: false },
      { key: "LINKEDIN_CLIENT_SECRET", apps: [SWIFT], secret: true },
      { key: "LINKEDIN_REDIRECT_URI", apps: [SWIFT], secret: false },
    ],
  },
  {
    id: "x",
    name: "X",
    category: "Identity & Ads",
    purpose: "X campaign publishing.",
    console: "https://developer.x.com",
    vars: [
      { key: "X_CLIENT_ID", apps: [SWIFT], secret: false },
      { key: "X_CLIENT_SECRET", apps: [SWIFT], secret: true },
      { key: "X_REDIRECT_URI", apps: [SWIFT], secret: false },
    ],
  },
  {
    id: "intuit",
    name: "Intuit / QuickBooks",
    category: "Integrations",
    purpose: "Accounting sync from Pal.",
    console: "https://developer.intuit.com",
    vars: [
      { key: "INTUIT_CLIENT_ID", apps: [PAL], secret: false },
      { key: "INTUIT_CLIENT_SECRET", apps: [PAL], secret: true },
      { key: "INTUIT_REDIRECT_URI", apps: [PAL], secret: false },
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft 365",
    category: "Integrations",
    purpose: "Mail and calendar integration from Pal.",
    console: "https://entra.microsoft.com",
    vars: [
      { key: "MICROSOFT_365_CLIENT_ID", apps: [PAL], secret: false },
      { key: "MICROSOFT_365_CLIENT_SECRET", apps: [PAL], secret: true },
      { key: "MICROSOFT_365_TENANT_ID", apps: [PAL], secret: false },
    ],
  },

  // ── Infrastructure ──────────────────────────────────────────────────────
  {
    id: "postgres",
    name: "PostgreSQL",
    category: "Infrastructure",
    purpose: "Each app's own database. Changing one here repoints that app on its next restart.",
    critical: true,
    vars: [
      { key: "DATABASE_URL", apps: [L, PAL, SWIFT, BEACON], secret: true, note: "Per app — these are NOT the same database." },
      { key: "DB_SCHEMA", apps: [L], secret: false, note: "loopital's schema inside the shared instance." },
    ],
  },
  {
    id: "redis",
    name: "Redis",
    category: "Infrastructure",
    purpose: "Background job queues.",
    vars: [
      { key: "REDIS_URL", apps: [PAL], secret: true },
      { key: "REDIS_HOST", apps: [SWIFT], secret: false },
      { key: "REDIS_PORT", apps: [SWIFT], secret: false },
    ],
  },
  {
    id: "objectstore",
    name: "Object storage",
    category: "Infrastructure",
    purpose: "Uploads and generated files. S3-compatible, so this is what switching cloud provider actually means.",
    vars: [
      { key: "AWS_ACCESS_KEY_ID", apps: [SWIFT, MODUS], secret: true },
      { key: "AWS_SECRET_ACCESS_KEY", apps: [SWIFT, MODUS], secret: true },
      { key: "AWS_REGION", apps: [SWIFT, MODUS], secret: false },
      { key: "AWS_S3_BUCKET", apps: [SWIFT], secret: false },
      { key: "UPLOADS_BUCKET", apps: [MODUS], secret: false },
      { key: "S3_ENDPOINT", apps: [SWIFT, MODUS], secret: false, note: "Set this to point at Alibaba OSS, R2 or MinIO instead of AWS." },
    ],
  },
  {
    id: "cognito",
    name: "AWS Cognito",
    category: "Infrastructure",
    purpose: "Modus's user pool.",
    vars: [
      { key: "COGNITO_USER_POOL_ID", apps: [MODUS], secret: false },
      { key: "COGNITO_CLIENT_ID", apps: [MODUS], secret: false },
    ],
  },
  {
    id: "sentry",
    name: "Sentry",
    category: "Infrastructure",
    purpose: "Error tracking.",
    console: "https://sentry.io",
    vars: [{ key: "SENTRY_DSN", apps: [PAL], secret: false }],
  },

  // ── The group's own secrets ─────────────────────────────────────────────
  {
    id: "zina",
    name: "Zina control plane",
    category: "Loopital",
    purpose:
      "How the apps and this portal trust each other. These are the one set that must stay in each service's own environment — they are what let it reach Zina in the first place.",
    critical: true,
    selfHosted: true,
    vars: [
      { key: "ZINA_OPS_SECRET", apps: [L, PAL, SWIFT, MODUS, BEACON, HEN], secret: true, note: "Signs every call between Zina and an app." },
      { key: "ZINA_JWT_SECRET", apps: [L, PAL, SWIFT, MODUS, BEACON], secret: true, note: "Signs staff sessions and step-in assertions." },
      { key: "ZINA_ENCRYPTION_KEY", apps: [L], secret: true, note: "Seals everything in this vault. Changing it makes stored values unreadable." },
      { key: "ZINA_SUPERADMINS", apps: [L], secret: false, note: "Emails that become superadmin on first sign-in." },
      { key: "LOOPITAL_API_URL", apps: [PAL, SWIFT, MODUS, BEACON, HEN], secret: false },
    ],
  },
  {
    id: "app-auth",
    name: "Per-app session secrets",
    category: "Loopital",
    purpose: "Each app signs its own user sessions. Rotating one signs everybody out of that app.",
    critical: true,
    selfHosted: true,
    vars: [
      { key: "JWT_SECRET", apps: [L, PAL], secret: true },
      { key: "ADMIN_JWT_SECRET", apps: [PAL], secret: true },
      { key: "JWT_ACCESS_SECRET", apps: [SWIFT], secret: true },
      { key: "JWT_REFRESH_SECRET", apps: [SWIFT], secret: true },
      { key: "AUTH_SECRET", apps: [BEACON], secret: true },
      { key: "ENCRYPTION_KEY", apps: [SWIFT], secret: true },
      { key: "APP_ENCRYPTION_KEY", apps: [BEACON], secret: true },
    ],
  },
  {
    id: "urls",
    name: "Public URLs",
    category: "Loopital",
    purpose: "Where each app thinks it lives. Wrong values break OAuth redirects and email links.",
    selfHosted: true,
    vars: [
      { key: "APP_URL", apps: [BEACON], secret: false },
      { key: "APP_BASE_URL", apps: [SWIFT, MODUS], secret: false },
      { key: "PUBLIC_BASE_URL", apps: [SWIFT], secret: false },
      { key: "SWIFT_WEB_URL", apps: [SWIFT], secret: false },
      { key: "CORS_ORIGIN", apps: [PAL], secret: false },
      { key: "MINISTRY_URL", apps: [MODUS], secret: false },
      { key: "PAL_ADMIN_URL", apps: [PAL], secret: false },
    ],
  },
];

/** Flat lookup: env var name → the service that owns it. */
const VAR_OWNER = new Map();
for (const service of SERVICES) {
  for (const v of service.vars) VAR_OWNER.set(v.key, service);
}

module.exports = { SERVICES, VAR_OWNER };
