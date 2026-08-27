// Every inbound submission, as one readable table.
//
// Registrations, demo requests, waitlist joins and contact messages all land in
// the `submissions` table. This renders them.
//
// ── Why this is not a file on loopital.com ────────────────────────────────
//
// The obvious version of this is a JSON or CSV file written into the S3 bucket
// and served from the site. It would work, and it would also publish the names,
// emails and phone numbers of every hospital administrator and individual who
// has ever filled in a form. Anything served from that bucket is public: no
// login, no rate limit, and crawlable the moment the URL appears in a browser
// history sync, a chat message, or a referrer header.
//
// So it lives behind the API instead, gated on a secret in the query string.
// That is still a bearer-token-in-a-URL and should be treated like a password,
// but it is server-side, never indexed, and revocable by changing one
// environment variable rather than deleting an object that CDNs may have
// cached.
//
// `?format=csv` returns the same data as a download for spreadsheets.

const crypto = require("node:crypto");
const { sql } = require("./db");

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Constant-time compare, so the key cannot be guessed a character at a time. */
function keyMatches(provided) {
  const expected = process.env.SUBMISSIONS_KEY || "";
  if (!expected) return false;
  const a = Buffer.from(String(provided || ""), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const KIND_LABEL = {
  registration: "Registration",
  demo: "Demo request",
  waitlist: "Waitlist",
  contact: "Contact",
};

const PRODUCT_LABEL = {
  hms7: "HMS7",
  henholib: "Henholib",
  stack62: "Pal",
  fms13: "Modus",
  edm73: "Beacon",
  sart34: "Swift",
};

/** Flatten the jsonb details into "Label: value" lines for the table cell. */
function detailLines(details) {
  if (!details || typeof details !== "object") return "";
  return Object.entries(details)
    .map(([k, v]) => {
      const label = k
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase());
      return `${label}: ${v}`;
    })
    .join("\n");
}

async function fetchRows(kind) {
  const where = kind ? "WHERE kind = :kind" : "";
  return await sql(
    `SELECT id, kind, product, name, email, phone, organisation, details, created_at
       FROM submissions
       ${where}
      ORDER BY created_at DESC
      LIMIT 1000`,
    kind ? { kind } : {}
  );
}

function toCsv(rows) {
  const head = [
    "date",
    "kind",
    "product",
    "name",
    "email",
    "phone",
    "organisation",
    "details",
  ];
  const cell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const lines = [head.join(",")];
  for (const r of rows) {
    lines.push(
      [
        new Date(r.created_at).toISOString(),
        r.kind,
        r.product || "",
        r.name || "",
        r.email || "",
        r.phone || "",
        r.organisation || "",
        detailLines(r.details).replace(/\n/g, " | "),
      ]
        .map(cell)
        .join(",")
    );
  }
  return lines.join("\n");
}

function renderHtml(rows, counts) {
  const body = rows
    .map((r) => {
      const when = new Date(r.created_at);
      return `<tr>
        <td class="nowrap muted">${esc(when.toISOString().slice(0, 16).replace("T", " "))}</td>
        <td><span class="tag t-${esc(r.kind)}">${esc(KIND_LABEL[r.kind] || r.kind)}</span></td>
        <td class="nowrap">${esc(PRODUCT_LABEL[r.product] || r.product || "—")}</td>
        <td>${esc(r.name || "—")}</td>
        <td><a href="mailto:${esc(r.email)}">${esc(r.email || "—")}</a></td>
        <td class="nowrap">${esc(r.phone || "—")}</td>
        <td>${esc(r.organisation || "—")}</td>
        <td class="detail">${esc(detailLines(r.details)).replace(/\n/g, "<br>")}</td>
      </tr>`;
    })
    .join("");

  const summary = Object.entries(counts)
    .map(([k, n]) => `<span class="pill">${esc(KIND_LABEL[k] || k)} <b>${n}</b></span>`)
    .join("");

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>Loopital submissions</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; font:15px/1.5 ui-sans-serif,system-ui,"Segoe UI",Roboto,sans-serif;
         background:#f2f5fb; color:#1b2437; }
  header { padding:22px 26px; background:#fff; border-bottom:1px solid rgba(15,23,41,.09); }
  h1 { margin:0 0 4px; font-size:19px; letter-spacing:-.01em; }
  .sub { color:#646f81; font-size:13.5px; }
  .bar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:12px; }
  .pill { background:#e9eff9; border-radius:999px; padding:5px 11px; font-size:12.5px; color:#556074; }
  .pill b { color:#0f1729; }
  a.btn { margin-left:auto; background:#2563eb; color:#fff; text-decoration:none;
          border-radius:999px; padding:8px 16px; font-size:13px; font-weight:600; }
  .wrap { padding:18px 26px 40px; overflow-x:auto; }
  table { border-collapse:collapse; width:100%; background:#fff; border-radius:12px;
          overflow:hidden; box-shadow:0 6px 18px rgba(15,23,41,.06); font-size:13.5px; }
  th { text-align:left; background:#f7faff; color:#556074; font-size:11.5px;
       text-transform:uppercase; letter-spacing:.06em; padding:11px 12px;
       border-bottom:1px solid rgba(15,23,41,.09); white-space:nowrap; }
  td { padding:11px 12px; border-bottom:1px solid rgba(15,23,41,.06); vertical-align:top; }
  tr:last-child td { border-bottom:0; }
  .nowrap { white-space:nowrap; }
  .muted { color:#646f81; }
  .detail { color:#556074; font-size:12.5px; max-width:340px; }
  .tag { border-radius:999px; padding:3px 9px; font-size:11.5px; font-weight:600; white-space:nowrap; }
  .t-registration { background:#e3f5ea; color:#0b6b4a; }
  .t-demo         { background:#e8f1fe; color:#1a4fa8; }
  .t-waitlist     { background:#efe9fd; color:#4c31b8; }
  .t-contact      { background:#fdf1dc; color:#8a5a06; }
  .empty { padding:44px; text-align:center; color:#646f81; background:#fff; border-radius:12px; }
</style></head><body>
<header>
  <h1>Loopital submissions</h1>
  <div class="sub">Registrations, demo requests, waitlist joins and contact messages. Newest first, latest 1000.</div>
  <div class="bar">${summary || '<span class="pill">Nothing yet</span>'}
    <a class="btn" href="?key=${esc(process.env.SUBMISSIONS_KEY || "")}&amp;format=csv">Download CSV</a>
  </div>
</header>
<div class="wrap">
${
  rows.length
    ? `<table><thead><tr>
        <th>When</th><th>Type</th><th>Product</th><th>Name</th>
        <th>Email</th><th>Phone</th><th>Organisation</th><th>Details</th>
      </tr></thead><tbody>${body}</tbody></table>`
    : `<div class="empty">No submissions yet.</div>`
}
</div></body></html>`;
}

/**
 * GET /submissions?key=…            the table
 * GET /submissions?key=…&format=csv the same data as a download
 * GET /submissions?key=…&kind=demo  filtered to one kind
 */
async function handleSubmissions(query) {
  if (!process.env.SUBMISSIONS_KEY) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "SUBMISSIONS_KEY is not configured on this service.",
    };
  }
  if (!keyMatches(query.key)) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "Not found.",
    };
  }

  const kind = query.kind ? String(query.kind) : null;
  const rows = await fetchRows(kind);

  if (query.format === "csv") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="loopital-submissions-${new Date().toISOString().slice(0, 10)}.csv"`,
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
      body: toCsv(rows),
    };
  }

  const counts = {};
  for (const r of rows) counts[r.kind] = (counts[r.kind] || 0) + 1;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
    body: renderHtml(rows, counts),
  };
}

module.exports = { handleSubmissions, recordSubmissionSql: null };
