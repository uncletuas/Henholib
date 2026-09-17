// The hub schema. Run by server/migrate.js on every boot; every statement is
// idempotent (CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
//
// The hub is small on purpose: team accounts, the onboarding portal, and the
// inbound submissions from the public site (contribute, contact). Everything a
// patient, a hospital or Council touches lives in the Loopital platform database.
module.exports = [
  // Team members sign in to loopital.com/onboarding with these.
  `CREATE TABLE IF NOT EXISTS users (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name          TEXT NOT NULL,
     email         TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`,

  // Every inbound form from the public site, as one table.
  //
  // `details` is jsonb because each form asks different questions. Forcing them
  // into shared columns would mean a column per form field.
  `CREATE TABLE IF NOT EXISTS submissions (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     kind         TEXT NOT NULL,
     product      TEXT,
     name         TEXT,
     email        TEXT,
     phone        TEXT,
     organisation TEXT,
     details      JSONB NOT NULL DEFAULT '{}'::jsonb,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS submissions_created_idx ON submissions (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS submissions_kind_idx ON submissions (kind, created_at DESC)`,

  // ── Team onboarding ─────────────────────────────────────────────────────
  // The three stage flags are the gate. They are checked server-side on every
  // request, not just in the UI, so the sequence cannot be skipped by calling
  // the API directly.
  `CREATE TABLE IF NOT EXISTS onboarding_profiles (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id       UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
     nda_signed    BOOLEAN NOT NULL DEFAULT false,
     nda_signed_at TIMESTAMPTZ,
     form_complete BOOLEAN NOT NULL DEFAULT false,
     form_done_at  TIMESTAMPTZ,
     -- Where they left off, so a returning member resumes at the right step.
     step          INTEGER NOT NULL DEFAULT 1,
     -- Every answer, including partial ones, so a member can resume on another device.
     answers       JSONB NOT NULL DEFAULT '{}'::jsonb,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS onboarding_profiles_user_idx ON onboarding_profiles (user_id)`,

  // The signed agreement, and the evidence that it was signed.
  //
  // Nothing updates this row. Clause 11.7 of the agreement gives an electronic
  // signature the force of a handwritten one, and a signed agreement that can
  // be edited afterwards is worth less than one that cannot. A correction means
  // a new row; superseded_by points at it.
  `CREATE TABLE IF NOT EXISTS onboarding_ndas (
     id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     full_name      TEXT NOT NULL,
     role_title     TEXT,
     email          TEXT NOT NULL,
     method         TEXT NOT NULL CHECK (method IN ('drawn','typed','uploaded')),
     signature_png  BYTEA,
     pdf            BYTEA,
     -- The signing time is the server's clock, never the browser's.
     signed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
     ip             TEXT,
     user_agent     TEXT,
     superseded_by  UUID REFERENCES onboarding_ndas (id),
     created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
     version        TEXT NOT NULL DEFAULT '1.0'
   )`,
  `CREATE INDEX IF NOT EXISTS onboarding_ndas_user_idx ON onboarding_ndas (user_id, signed_at DESC)`,

  // Every email the hub sends, including the failures, which are the rows that matter.
  `CREATE TABLE IF NOT EXISTS notification_log (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     template    TEXT,
     to_email    TEXT NOT NULL,
     subject     TEXT NOT NULL,
     status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
     provider_id TEXT,
     error       TEXT,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS notification_log_idx ON notification_log (created_at DESC)`,
];
