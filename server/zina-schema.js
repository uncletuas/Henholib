// Zina — the Loopital control plane.
//
// One portal (zina.loopital.com) that replaces senate / ministry / assembly /
// academia. One superadmin account sees the whole ecosystem at a glance and can
// step into any single app to manage it directly. Per-app operational roles
// still exist — they are rows in `zina_staff` scoped to one app — but every
// login now happens here.
//
// These tables live in loopital's own Postgres schema alongside `users`,
// `subscriptions` and `payments`, because Zina's job is to be the place where
// identity, money and notification already converge. What Zina does NOT do is
// copy each product's domain data: an app's own records stay in that app's
// database and are read live through its ops connector (see server/connectors.js).
module.exports = [
  // ── Platform staff ──────────────────────────────────────────────────────
  // Standing in Zina comes ONLY from a row here. Signing in uses the same
  // `users` account system — one identity, one password, as everywhere else in
  // the ecosystem — but a user with every role in every product and no row here
  // is anonymous to this portal.
  //
  // `app_scope` is the "other operational roles continue to exist" mechanism:
  // NULL or '{}' means the whole ecosystem (superadmin, ops, finance), while
  // '{fms13}' means this person only ever sees Modus. It is enforced server-side
  // on every route, not just hidden in the UI.
  `CREATE TABLE IF NOT EXISTS zina_staff (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id    UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
     role       TEXT NOT NULL DEFAULT 'support'
                  CHECK (role IN ('superadmin','operations','finance','engineering','support','analyst')),
     title      TEXT,
     app_scope  TEXT[] NOT NULL DEFAULT '{}',
     is_active  BOOLEAN NOT NULL DEFAULT true,
     last_seen  TIMESTAMPTZ,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS zina_staff_role_idx ON zina_staff (role)`,

  // ── App registry ────────────────────────────────────────────────────────
  // Every app Zina manages, and how to reach it. Rows are seeded on boot from
  // the known ecosystem (see ZINA_APPS in connectors.js) and are editable from
  // the portal, so a new product is connected without a deploy.
  //
  // `ops_base_url` is the app's connector root; `ops_secret` is the shared
  // secret Zina signs its calls with. `admin_url` is where "manage directly"
  // lands the superadmin.
  `CREATE TABLE IF NOT EXISTS zina_apps (
     id           TEXT PRIMARY KEY,
     name         TEXT NOT NULL,
     tagline      TEXT,
     app_url      TEXT,
     admin_url    TEXT,
     ops_base_url TEXT,
     ops_secret   TEXT,
     accent       TEXT NOT NULL DEFAULT '#2563eb',
     sort_order   INTEGER NOT NULL DEFAULT 0,
     enabled      BOOLEAN NOT NULL DEFAULT true,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // Last known connector state, refreshed on every fan-out. Kept out of
  // `zina_apps` so a health write never contends with a config edit.
  `CREATE TABLE IF NOT EXISTS zina_app_health (
     app_id       TEXT PRIMARY KEY REFERENCES zina_apps (id) ON DELETE CASCADE,
     status       TEXT NOT NULL DEFAULT 'unknown'
                    CHECK (status IN ('ok','degraded','down','unconfigured','unknown')),
     latency_ms   INTEGER,
     version      TEXT,
     db_status    TEXT,
     detail       TEXT,
     checked_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // ── Credential vault ────────────────────────────────────────────────────
  // The API keys and connection strings each app runs on, in one place. Values
  // are encrypted with ZINA_ENCRYPTION_KEY (AES-256-GCM) before they are
  // written, and are NEVER returned to the browser in full — the API sends a
  // masked preview and only reveals a secret on an explicit, audited request.
  `CREATE TABLE IF NOT EXISTS zina_secrets (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     app_id      TEXT REFERENCES zina_apps (id) ON DELETE CASCADE,
     kind        TEXT NOT NULL DEFAULT 'api_key'
                   CHECK (kind IN ('api_key','database','webhook','oauth','other')),
     label       TEXT NOT NULL,
     env_var     TEXT,
     value_enc   TEXT NOT NULL,
     hint        TEXT,
     rotated_at  TIMESTAMPTZ,
     created_by  UUID REFERENCES users (id) ON DELETE SET NULL,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (app_id, label)
   )`,
  `CREATE INDEX IF NOT EXISTS zina_secrets_app_idx ON zina_secrets (app_id, kind)`,

  // ── The vault as live configuration ─────────────────────────────────────
  // The vault started as a record of what each app's keys *are*. It is now
  // also where they come from: an app fetches its own config at boot from
  // GET /ops-config and overlays it onto its environment, so rotating a key or
  // repointing a URL is an edit in the portal, not a code change and a deploy.
  //
  // That means the table holds more than secrets — base URLs, bucket names,
  // region names, which provider to use. `url` and `config` are those; they are
  // still encrypted at rest, because the cost is nil and the alternative is a
  // rule about which values are sensitive that someone will eventually get wrong.
  `ALTER TABLE zina_secrets DROP CONSTRAINT IF EXISTS zina_secrets_kind_check`,
  `ALTER TABLE zina_secrets ADD CONSTRAINT zina_secrets_kind_check
     CHECK (kind IN ('api_key','database','webhook','oauth','url','config','other'))`,

  // Bumped whenever any app's config changes. An app polls this integer rather
  // than re-pulling every value on a timer — cheap enough to check often, which
  // is what makes a rotation take effect in a minute instead of at next deploy.
  `CREATE TABLE IF NOT EXISTS zina_config_version (
     app_id     TEXT PRIMARY KEY REFERENCES zina_apps (id) ON DELETE CASCADE,
     version    INTEGER NOT NULL DEFAULT 1,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // ── Unified support inbox ───────────────────────────────────────────────
  // Tickets raised in any app land here, so support is answered from one queue
  // instead of four. `app_id` says where it came from; `external_id` lets the
  // originating app reconcile its own copy.
  `CREATE TABLE IF NOT EXISTS zina_tickets (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     app_id       TEXT REFERENCES zina_apps (id) ON DELETE SET NULL,
     external_id  TEXT,
     subject      TEXT NOT NULL,
     requester_name  TEXT,
     requester_email TEXT NOT NULL,
     user_id      UUID REFERENCES users (id) ON DELETE SET NULL,
     status       TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','waiting','resolved','closed')),
     priority     TEXT NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low','normal','high','urgent')),
     assignee_id  UUID REFERENCES zina_staff (id) ON DELETE SET NULL,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS zina_tickets_status_idx ON zina_tickets (status, updated_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS zina_tickets_external_key
     ON zina_tickets (app_id, external_id) WHERE external_id IS NOT NULL`,

  `CREATE TABLE IF NOT EXISTS zina_ticket_messages (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     ticket_id  UUID NOT NULL REFERENCES zina_tickets (id) ON DELETE CASCADE,
     author     TEXT NOT NULL DEFAULT 'staff' CHECK (author IN ('staff','requester','system')),
     staff_id   UUID REFERENCES zina_staff (id) ON DELETE SET NULL,
     body       TEXT NOT NULL,
     emailed    BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS zina_ticket_messages_idx ON zina_ticket_messages (ticket_id, created_at)`,

  // ── One notification system ─────────────────────────────────────────────
  // Every transactional email in the ecosystem is sent through POST /notify/send
  // on this API, on the single connected Resend account, and is logged here.
  // That is what makes "did the customer actually get it?" answerable from one
  // screen instead of four sets of provider logs.
  `CREATE TABLE IF NOT EXISTS zina_notifications (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     app_id     TEXT,
     channel    TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email')),
     template   TEXT,
     to_email   TEXT NOT NULL,
     subject    TEXT NOT NULL,
     status     TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','sent','failed')),
     provider_id TEXT,
     error      TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS zina_notifications_idx ON zina_notifications (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS zina_notifications_app_idx ON zina_notifications (app_id, status)`,

  // ── Audit ───────────────────────────────────────────────────────────────
  // A superadmin who can do everything everywhere needs a record of what they
  // did. Every mutating Zina route writes one row.
  `CREATE TABLE IF NOT EXISTS zina_audit (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     staff_id   UUID REFERENCES zina_staff (id) ON DELETE SET NULL,
     actor_email TEXT,
     app_id     TEXT,
     action     TEXT NOT NULL,
     target     TEXT,
     detail     JSONB,
     ip         TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS zina_audit_idx ON zina_audit (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS zina_audit_actor_idx ON zina_audit (staff_id, created_at DESC)`,

  // ── One ledger, including payments Loopital didn't originate ────────────
  // The unified `payments` table was written for customers who are Loopital
  // accounts. Beacon bills an institution and Modus bills a company, neither of
  // which is a row in `users` — so the ledger has to be able to name a customer
  // it doesn't own, or those payments would sit outside it and "one Paystack
  // account, one place to see the money" would quietly not be true.
  `ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_email TEXT`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_name TEXT`,
  // Which app reported it. `product` is what was bought; this is who told us.
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS source_app TEXT`,
  `CREATE INDEX IF NOT EXISTS payments_customer_idx ON payments (customer_email)`,

  // ── Cross-app analytics ─────────────────────────────────────────────────
  // A narrow, deliberately boring event table. Apps post daily rollups rather
  // than raw events, so Zina can chart the ecosystem without becoming a
  // warehouse and without every app shipping its traffic here.
  `CREATE TABLE IF NOT EXISTS zina_metrics (
     app_id     TEXT NOT NULL,
     metric     TEXT NOT NULL,
     day        DATE NOT NULL,
     value      NUMERIC NOT NULL DEFAULT 0,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (app_id, metric, day)
   )`,
  `CREATE INDEX IF NOT EXISTS zina_metrics_day_idx ON zina_metrics (day DESC)`,
];
