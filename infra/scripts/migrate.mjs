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
