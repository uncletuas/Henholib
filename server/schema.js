// The loopital schema DDL — the historical ecosystem tables, carried forward
// unchanged. Run by server/migrate.js against Postgres via pg. Zina's own
// tables live in zina-schema.js so this file stays as it was.
module.exports = [
  `CREATE TABLE IF NOT EXISTS users (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name          TEXT NOT NULL,
     email         TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`,

  // Per-product subscriptions for the account-linked products only. The unified
  // user is the single identity; each product is billed independently, so a
  // user may have one row per product. HMS7/FMS13 are intentionally excluded.
  `CREATE TABLE IF NOT EXISTS subscriptions (
     id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id            UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     product            TEXT NOT NULL CHECK (product IN ('sart34','stack62','fms13','edm73')),
     plan               TEXT NOT NULL,
     status             TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','trialing','past_due','canceled')),
     current_period_end TIMESTAMPTZ,
     created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (user_id, product)
   )`,
  `CREATE INDEX IF NOT EXISTS subscriptions_user_product_idx ON subscriptions (user_id, product)`,

  // Per-product invoice history surfaced in the portal billing tab.
  `CREATE TABLE IF NOT EXISTS invoices (
     id           TEXT PRIMARY KEY,
     user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     product      TEXT NOT NULL CHECK (product IN ('sart34','stack62')),
     amount_cents INTEGER NOT NULL,
     currency     TEXT NOT NULL DEFAULT 'USD',
     status       TEXT NOT NULL DEFAULT 'paid'
                    CHECK (status IN ('paid','open','void')),
     issued_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS invoices_user_idx ON invoices (user_id)`,

  // Optional mapping when SART34/STACK62 keep their own per-app account ids that
  // must resolve to the unified loopital user.
  `CREATE TABLE IF NOT EXISTS product_accounts (
     user_id             UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     product             TEXT NOT NULL CHECK (product IN ('sart34','stack62')),
     external_account_id TEXT,
     created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (user_id, product)
   )`,

  // Public waitlist capture for products that aren't open to the public yet
  // (STACK62, SART34). No account required; one row per (email, product).
  `CREATE TABLE IF NOT EXISTS waitlist (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email      TEXT NOT NULL,
     product    TEXT NOT NULL,
     name       TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (email, product)
   )`,
  `CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email)`,

  // ── Every inbound submission, in one place ─────────────────────────────
  // Registrations, demo requests and waitlist joins used to land in three
  // different places: waitlist in its own table, demo requests only as a Zina
  // ticket and an email, contact only as an email. That made "who has asked us
  // for something" a question nobody could answer without three lookups.
  //
  // `details` is jsonb because each form asks different questions. A hospital
  // sends bed count and facility type; a waitlist join sends almost nothing.
  // Forcing them into shared columns would mean a column per form field.
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

  // ── Loopital Academy ──────────────────────────────────────────────────
  // Course catalog for the Academy training arm. Content is DB-backed (not
  // hardcoded) so it can be managed from the admin portal without a deploy.
  // JSON-shaped fields (who_for, curriculum, format) are stored as TEXT
  // holding a JSON string, parsed by the API — avoids Data API jsonb quirks.
  `CREATE TABLE IF NOT EXISTS academy_courses (
     id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug             TEXT NOT NULL UNIQUE,
     title            TEXT NOT NULL,
     image            TEXT,
     track            TEXT NOT NULL DEFAULT 'technical',
     short_desc       TEXT,
     full_desc        TEXT,
     who_for          TEXT,
     curriculum       TEXT,
     format           TEXT,
     price_cents      INTEGER NOT NULL DEFAULT 0,
     currency         TEXT NOT NULL DEFAULT 'USD',
     status           TEXT NOT NULL DEFAULT 'coming_soon'
                        CHECK (status IN ('enrolling','coming_soon')),
     published        BOOLEAN NOT NULL DEFAULT true,
     sort_order       INTEGER NOT NULL DEFAULT 0,
     instructor_name  TEXT,
     instructor_title TEXT,
     instructor_bio   TEXT,
     created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS academy_courses_track_idx ON academy_courses (track)`,
  // Additive columns for existing installs (no-op when already present).
  `ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS image TEXT`,
  `ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS course_type TEXT NOT NULL DEFAULT 'live'`,
  `ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'online'`,

  // Applications / expressions of interest submitted from a course page.
  `CREATE TABLE IF NOT EXISTS academy_applications (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     course_slug  TEXT NOT NULL,
     course_title TEXT,
     name         TEXT NOT NULL,
     email        TEXT NOT NULL,
     phone        TEXT,
     motivation   TEXT,
     heard_from   TEXT,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS academy_applications_course_idx ON academy_applications (course_slug)`,

  // Single-row admin credential for the Academy management portal. Password is
  // set once via self-service bootstrap (first run), then used to log in.
  `CREATE TABLE IF NOT EXISTS academy_admin (
     id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
     password_hash TEXT NOT NULL,
     updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // ── Academy LMS: facilitators, materials, enrolments, sessions, certs ──
  // Facilitators (trainers) enrolled by the admin. They log into their own
  // portal to access the training materials for the courses they're assigned.
  `CREATE TABLE IF NOT EXISTS academy_facilitators (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name          TEXT NOT NULL,
     email         TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     title         TEXT,
     bio           TEXT,
     active        BOOLEAN NOT NULL DEFAULT true,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS academy_course_facilitators (
     course_id      UUID NOT NULL REFERENCES academy_courses (id) ON DELETE CASCADE,
     facilitator_id UUID NOT NULL REFERENCES academy_facilitators (id) ON DELETE CASCADE,
     created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (course_id, facilitator_id)
   )`,

  // Course materials (manuals, slides, resources) uploaded by the admin to the
  // private materials bucket. student_visible gates student downloads.
  `CREATE TABLE IF NOT EXISTS academy_materials (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     course_id       UUID NOT NULL REFERENCES academy_courses (id) ON DELETE CASCADE,
     title           TEXT NOT NULL,
     kind            TEXT NOT NULL DEFAULT 'manual'
                       CHECK (kind IN ('manual','slides','resource')),
     file_key        TEXT NOT NULL,
     file_name       TEXT,
     content_type    TEXT,
     size_bytes      BIGINT,
     student_visible BOOLEAN NOT NULL DEFAULT true,
     created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS academy_materials_course_idx ON academy_materials (course_id)`,

  // Student enrolments (student accounts reuse the existing users table).
  `CREATE TABLE IF NOT EXISTS academy_enrollments (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     course_id    UUID NOT NULL REFERENCES academy_courses (id) ON DELETE CASCADE,
     user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     status       TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','completed','withdrawn')),
     progress     INTEGER NOT NULL DEFAULT 0,
     completed_at TIMESTAMPTZ,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (course_id, user_id)
   )`,
  `CREATE INDEX IF NOT EXISTS academy_enrollments_user_idx ON academy_enrollments (user_id)`,

  // Scheduled sessions for the course calendar.
  `CREATE TABLE IF NOT EXISTS academy_sessions (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     course_id  UUID NOT NULL REFERENCES academy_courses (id) ON DELETE CASCADE,
     title      TEXT,
     starts_at  TIMESTAMPTZ NOT NULL,
     ends_at    TIMESTAMPTZ,
     location   TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS academy_sessions_course_idx ON academy_sessions (course_id)`,

  // Issued certificates (generated as PDF + emailed on completion).
  `CREATE TABLE IF NOT EXISTS academy_certificates (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     course_id     UUID REFERENCES academy_courses (id) ON DELETE SET NULL,
     user_id       UUID REFERENCES users (id) ON DELETE SET NULL,
     student_name  TEXT NOT NULL,
     student_email TEXT NOT NULL,
     course_title  TEXT,
     serial        TEXT NOT NULL UNIQUE,
     issued_at     TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // Course-level media added later: intro video (watched before class) and a
  // list of self-paced videos (Coursera-style, tutor-optional).
  `ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS intro_video_url TEXT`,
  `ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS self_paced_videos TEXT`,

  // Per-enrolment lesson/video completion, for progress tracking.
  `CREATE TABLE IF NOT EXISTS academy_progress (
     enrollment_id UUID NOT NULL REFERENCES academy_enrollments (id) ON DELETE CASCADE,
     item_key      TEXT NOT NULL,
     completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (enrollment_id, item_key)
   )`,

  // Link a certificate to its stored PDF key (added additively).
  `ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS file_key TEXT`,

  // ── Academy: usernames, reviews, exams ────────────────────────────────
  // Public username handle for the shareable achievements page (/u/<username>).
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (lower(username))`,
  // Shared "Google-style" profile: one identity across Loopital, Pal & Swift.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS headline TEXT`,

  // Course reviews (one per student per course).
  `CREATE TABLE IF NOT EXISTS academy_reviews (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     course_id  UUID NOT NULL REFERENCES academy_courses (id) ON DELETE CASCADE,
     user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
     comment    TEXT,
     hidden     BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (course_id, user_id)
   )`,
  `CREATE INDEX IF NOT EXISTS academy_reviews_course_idx ON academy_reviews (course_id)`,

  // One assessment exam per course; auto-graded (MC + true/false).
  `CREATE TABLE IF NOT EXISTS academy_exams (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     course_id  UUID NOT NULL UNIQUE REFERENCES academy_courses (id) ON DELETE CASCADE,
     title      TEXT NOT NULL DEFAULT 'Course assessment',
     pass_mark  INTEGER NOT NULL DEFAULT 70,
     published  BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS academy_exam_questions (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     exam_id    UUID NOT NULL REFERENCES academy_exams (id) ON DELETE CASCADE,
     prompt     TEXT NOT NULL,
     kind       TEXT NOT NULL DEFAULT 'single'
                  CHECK (kind IN ('single','multi','truefalse')),
     options    TEXT NOT NULL DEFAULT '[]',
     correct    TEXT NOT NULL DEFAULT '[]',
     points     INTEGER NOT NULL DEFAULT 1,
     sort_order INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS academy_exam_questions_exam_idx ON academy_exam_questions (exam_id)`,

  // Attempt history (auto-graded); students get up to 3 attempts + any overrides.
  `CREATE TABLE IF NOT EXISTS academy_exam_attempts (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     exam_id    UUID NOT NULL REFERENCES academy_exams (id) ON DELETE CASCADE,
     user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     score      INTEGER NOT NULL,
     passed     BOOLEAN NOT NULL,
     attempt_no INTEGER NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS academy_exam_attempts_idx ON academy_exam_attempts (exam_id, user_id)`,

  // Extra attempts granted by an instructor/admin after the 3-attempt limit.
  `CREATE TABLE IF NOT EXISTS academy_exam_overrides (
     exam_id  UUID NOT NULL REFERENCES academy_exams (id) ON DELETE CASCADE,
     user_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     extra    INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (exam_id, user_id)
   )`,

  // ── Payments (Paystack) + instructor-controlled completion ─────────────
  // A payment attempt per (student, course). Paid access is granted only after
  // a successful payment (free courses skip this).
  `CREATE TABLE IF NOT EXISTS academy_payments (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     course_id    UUID NOT NULL REFERENCES academy_courses (id) ON DELETE CASCADE,
     reference    TEXT NOT NULL UNIQUE,
     amount_cents INTEGER NOT NULL,
     currency     TEXT NOT NULL DEFAULT 'USD',
     status       TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed')),
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS academy_payments_user_idx ON academy_payments (user_id)`,

  // Instructor marks attendance per session per enrolled student.
  `CREATE TABLE IF NOT EXISTS academy_attendance (
     enrollment_id UUID NOT NULL REFERENCES academy_enrollments (id) ON DELETE CASCADE,
     session_id    UUID NOT NULL REFERENCES academy_sessions (id) ON DELETE CASCADE,
     present       BOOLEAN NOT NULL DEFAULT true,
     marked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (enrollment_id, session_id)
   )`,

  // Enrolment flags: paid gates access; exam_authorized gates the assessment
  // (only the instructor can set completion + authorize the exam).
  `ALTER TABLE academy_enrollments ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE academy_enrollments ADD COLUMN IF NOT EXISTS exam_authorized BOOLEAN NOT NULL DEFAULT false`,

  // ── Pal workspace: a Loopital account IS a Pal account ─────────────────
  // First-time onboarding (personal vs team) + the paid "coworker" upgrade
  // (billed by Loopital via Paystack; recorded in the shared subscriptions
  // table as product='stack62'). pal_payments logs the Paystack transactions.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS pal_onboarded BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS pal_use_type TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS pal_org_name TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS pal_team_size TEXT`,
  `CREATE TABLE IF NOT EXISTS pal_payments (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     reference    TEXT NOT NULL UNIQUE,
     amount_cents INTEGER NOT NULL,
     currency     TEXT NOT NULL DEFAULT 'USD',
     status       TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed')),
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // Pal pricing tiers (Free / Pro / Business): which plan and how many seats
  // the active subscription covers. Additive — defaults keep existing rows valid.
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS seats INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE pal_payments ADD COLUMN IF NOT EXISTS plan TEXT`,
  `ALTER TABLE pal_payments ADD COLUMN IF NOT EXISTS seats INTEGER NOT NULL DEFAULT 1`,

  // ── Unified billing hub ────────────────────────────────────────────────
  // One Paystack account, one checkout, many products. Every payment (any
  // product, subscription or credits) is recorded here and fulfilled by the
  // /paystack/webhook dispatcher based on product + purpose.
  `CREATE TABLE IF NOT EXISTS payments (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     product      TEXT NOT NULL,               -- stack62 | sart34 | fms13 | edm73
     purpose      TEXT NOT NULL,               -- subscription | credits
     reference    TEXT NOT NULL UNIQUE,
     amount_cents INTEGER NOT NULL,
     currency     TEXT NOT NULL DEFAULT 'NGN',
     plan         TEXT,                          -- for subscriptions
     credits      INTEGER,                       -- for credit top-ups
     seats        INTEGER NOT NULL DEFAULT 1,
     status       TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed')),
     fulfilled    BOOLEAN NOT NULL DEFAULT false,
     metadata     JSONB,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS payments_user_idx ON payments (user_id, product)`,
  // ── Team onboarding portal (/onboarding) ─────────────────────────────
  // One row per team member, created when they first reach the NDA stage. The
  // account itself is the existing `users` row, because the spec is explicit
  // that this becomes their permanent Loopital account rather than a throwaway
  // onboarding session.
  //
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
     -- Where they left off, so a returning member resumes at the right step
     -- rather than at the beginning. 1-indexed to match what the UI shows.
     step          INTEGER NOT NULL DEFAULT 1,
     -- Every answer, including partial ones. Written on each step transition,
     -- which is what makes "close the browser, come back on another device"
     -- work: the answers live here, not in that browser's local storage.
     answers       JSONB NOT NULL DEFAULT '{}'::jsonb,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS onboarding_profiles_user_idx ON onboarding_profiles (user_id)`,

  // The signed agreement, and the evidence that it was signed.
  //
  // The PDF is stored here as bytes rather than in S3 on purpose: the hub has
  // no bucket and no AWS credentials configured, so an S3 write would fail at
  // the exact moment a signature is captured and there would be nothing to
  // show for it. These are a few hundred kilobytes each and there will be tens
  // of them, not millions.
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
     -- drawn | typed | uploaded, per the three capture methods in the spec.
     method         TEXT NOT NULL CHECK (method IN ('drawn','typed','uploaded')),
     signature_png  BYTEA,
     pdf            BYTEA,
     -- Audit trail. The signing time is the server's clock, never the
     -- browser's, because the browser's is whatever the signer set it to.
     signed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
     ip             TEXT,
     user_agent     TEXT,
     superseded_by  UUID REFERENCES onboarding_ndas (id),
     created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS onboarding_ndas_user_idx ON onboarding_ndas (user_id, signed_at DESC)`,
  // Which revision of the agreement this person actually executed. Added with
  // v1.1; existing rows are v1.0 because that is the only text that existed
  // when they signed. Without it, answering "who is still on the old terms"
  // means opening every stored PDF one at a time.
  `ALTER TABLE onboarding_ndas ADD COLUMN IF NOT EXISTS version TEXT NOT NULL DEFAULT '1.0'`,

  // Widen the subscriptions product constraint for existing DBs (fresh ones get
  // it from CREATE above). Recreate the check idempotently.
  `ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_product_check`,
  `ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_product_check CHECK (product IN ('sart34','stack62','fms13','edm73'))`,
];
