// Applies the database schema using the RDS Data API.
// Reads the cluster/secret ARNs from the CDK deploy outputs (outputs.json),
// or from CLUSTER_ARN / DB_SECRET_ARN environment variables.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from "@aws-sdk/client-rds-data";

const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || "eu-north-1";
const DB_NAME = "loopital";

let clusterArn = process.env.CLUSTER_ARN;
let secretArn = process.env.DB_SECRET_ARN;

if (!clusterArn || !secretArn) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const outputs = JSON.parse(readFileSync(path.join(here, "..", "outputs.json"), "utf8"));
  const stack = outputs.LoopitalStack || Object.values(outputs)[0];
  clusterArn = clusterArn || stack.ClusterArn;
  secretArn = secretArn || stack.DbSecretArn;
}

if (!clusterArn || !secretArn) {
  console.error("Missing ClusterArn/DbSecretArn. Deploy first or set env vars.");
  process.exit(1);
}

const client = new RDSDataClient({ region });

const statements = [
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
     product            TEXT NOT NULL CHECK (product IN ('sart34','stack62')),
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
];

async function run() {
  for (const sql of statements) {
    process.stdout.write("Applying: " + sql.split("\n")[0].slice(0, 60) + "...\n");
    // Aurora Serverless v2 may be resuming from idle; retry briefly.
    let attempt = 0;
    for (;;) {
      try {
        await client.send(
          new ExecuteStatementCommand({
            resourceArn: clusterArn,
            secretArn,
            database: DB_NAME,
            sql,
          })
        );
        break;
      } catch (err) {
        attempt++;
        const resuming = /resuming|not currently available|DatabaseResuming|paused/i.test(
          `${err.name} ${err.message}`
        );
        if (attempt < 10 && resuming) {
          process.stdout.write("  cluster resuming, retrying in 10s...\n");
          await new Promise((r) => setTimeout(r, 10000));
          continue;
        }
        throw err;
      }
    }
  }
  console.log("Migration complete.");
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
