/**
 * Fail if the pricing page and the server disagree about money.
 *
 * src/app/config/pal-plans.ts is a copy of PAL_PLANS and BILLING_CATALOG.stack62
 * in server/app.js, kept so the marketing page renders without waiting on the
 * API. The failure mode of a copy is drift, and here drift means quoting a
 * customer one price and charging another.
 *
 * Both files are read as text and the numbers pulled out with regexes rather
 * than imported: server/app.js opens a database pool at import time, and the
 * frontend config is TypeScript. Neither loads cleanly in a plain node script,
 * and a check that is awkward to run does not get run.
 *
 *   npm run check:pricing
 */
import { readFileSync } from "node:fs";

const server = readFileSync("server/app.js", "utf8");
const client = readFileSync("src/app/config/pal-plans.ts", "utf8");
const problems = [];

/** Pull `amountNgn: 3500000` out of the PAL_PLANS block for one plan. */
function serverPlanKobo(plan) {
  const re = new RegExp(plan + String.raw`:\s*\{[\s\S]*?amountNgn:[^,]*?(\d{4,})`, "m");
  const m = server.match(re);
  return m ? Number(m[1]) : null;
}

/** Pull one credit bundle's `amountNgn` and `credits`. */
function serverBundle(key) {
  const re = new RegExp(
    key + String.raw`:\s*\{\s*amountNgn:\s*(\d+),\s*credits:\s*(\d+)`,
    "m",
  );
  const m = server.match(re);
  return m ? { kobo: Number(m[1]), credits: Number(m[2]) } : null;
}

/** Pull one entry out of the exported PAL_PLANS array in the TS config. */
function clientPlan(key) {
  const re = new RegExp(`key: "${key}"` + String.raw`[\s\S]*?amountKobo:\s*(\d+)`, "m");
  const m = client.match(re);
  return m ? Number(m[1]) : null;
}

function clientBundle(key) {
  const re = new RegExp(
    `key: "${key}",` + String.raw`\s*name: "[^"]*",\s*amountKobo:\s*(\d+),\s*credits:\s*(\d+)`,
    "m",
  );
  const m = client.match(re);
  return m ? { kobo: Number(m[1]), credits: Number(m[2]) } : null;
}

for (const plan of ["pro", "business"]) {
  const s = serverPlanKobo(plan);
  const c = clientPlan(plan);
  if (s === null) problems.push(`could not read plan ${plan} from server/app.js`);
  else if (c === null) problems.push(`could not read plan ${plan} from pal-plans.ts`);
  else if (s !== c)
    problems.push(`plan ${plan}: server charges ${s} kobo, page shows ${c}`);
}

for (const key of ["starter", "growth", "pro", "business", "scale"]) {
  const s = serverBundle(key);
  const c = clientBundle(key);
  if (!s) problems.push(`could not read bundle ${key} from server/app.js`);
  else if (!c) problems.push(`could not read bundle ${key} from pal-plans.ts`);
  else {
    if (s.kobo !== c.kobo)
      problems.push(`bundle ${key}: server charges ${s.kobo} kobo, page shows ${c.kobo}`);
    if (s.credits !== c.credits)
      problems.push(`bundle ${key}: server grants ${s.credits} credits, page shows ${c.credits}`);
  }
}

if (problems.length) {
  console.error("pricing is out of sync:");
  for (const p of problems) console.error("  - " + p);
  console.error("\nChange server/app.js and src/app/config/pal-plans.ts together.");
  process.exit(1);
}
console.log("pricing in sync: 2 plans, 5 credit bundles.");
