"use strict";

/**
 * The team onboarding portal, served at loopital.com/onboarding.
 *
 * Four stages, strictly sequential: account, NDA, the nine-step form, handbook.
 * The sequence is enforced here rather than only in the UI, because a stage gate
 * that lives in React is a suggestion — anyone can POST to the next endpoint.
 * Every handler below re-reads the profile and checks the flag it depends on.
 *
 * Two decisions worth knowing before reading the code:
 *
 * The signing date is the server's clock, never a field. The spec allows either,
 * and automatic is the better of the two: a date the signer can type is a date
 * the signer can get wrong, and on a document whose Clause 11.7 gives an
 * electronic signature the force of a handwritten one, the execution date is
 * evidence rather than data entry. Typed would have to be trusted; this does not.
 *
 * The signed PDF is stored in Postgres, not S3. The hub has no bucket and no AWS
 * credentials configured, so an S3 write would fail at the exact moment a
 * signature is captured, leaving a person who has just signed with nothing. A
 * few hundred kilobytes per row, tens of rows.
 */

const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const { sql } = require("./db");
const notify = require("./notify");
const {
  NDA_VERSION,
  NDA_TITLE,
  NDA_SUBTITLE,
  NDA_PREAMBLE,
  NDA_CLAUSES,
  NDA_FOOTER,
  NDA_HISTORY,
  COMPANY_SIGNATORY,
} = require("./nda-document");

const ADMIN_EMAIL = "info@loopital.com";

// Matches the shape server/index.js unwraps: `statusCode`, not `status`. The
// CORS headers are the same set app.js sends, because the portal is served from
// www.loopital.com and the API from onrender.com.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  body: JSON.stringify(body),
});

/** Roles offered at signature and in Step 3. One list, so the two agree. */
const ROLES = [
  "Chief Executive Officer",
  "Chief Operating Officer",
  "Finance & Administration Lead",
  "Engineering Lead",
  "Software Engineer",
  "Product Designer",
  "Product Manager",
  "Marketing & Growth",
  "Sales & Partnerships",
  "Customer Support",
  "Operations",
  "Intern",
  "Other",
];

// ── Profile and gating ───────────────────────────────────────────────────

async function loadProfile(userId) {
  const rows = await sql(
    `SELECT id, nda_signed, nda_signed_at, form_complete, form_done_at, step, answers
       FROM onboarding_profiles WHERE user_id = :u::uuid`,
    { u: userId }
  );
  if (rows.length) return rows[0];
  await sql(
    "INSERT INTO onboarding_profiles (user_id) VALUES (:u::uuid) ON CONFLICT (user_id) DO NOTHING",
    { u: userId }
  );
  const again = await sql(
    `SELECT id, nda_signed, nda_signed_at, form_complete, form_done_at, step, answers
       FROM onboarding_profiles WHERE user_id = :u::uuid`,
    { u: userId }
  );
  return again[0];
}

const asAnswers = (v) => {
  if (!v) return {};
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v) || {};
  } catch {
    return {};
  }
};

/** Which stage the portal should open on. The UI trusts this, not its own memory. */
function stageOf(profile) {
  if (!profile.nda_signed) return "nda";
  if (!profile.form_complete) return "form";
  return "done";
}

async function getState(user) {
  const p = await loadProfile(user.sub);
  return json(200, {
    email: user.email,
    name: user.name || null,
    stage: stageOf(p),
    ndaSigned: p.nda_signed === true,
    ndaSignedAt: p.nda_signed_at,
    formComplete: p.form_complete === true,
    step: Number(p.step) || 1,
    answers: asAnswers(p.answers),
    roles: ROLES,
  });
}

/** The agreement, served from the same source the PDF is built from. */
function getDocument() {
  return json(200, {
    version: NDA_VERSION,
    title: NDA_TITLE,
    subtitle: NDA_SUBTITLE,
    preamble: NDA_PREAMBLE,
    clauses: NDA_CLAUSES,
    footer: NDA_FOOTER,
    history: NDA_HISTORY,
    company: COMPANY_SIGNATORY,
  });
}

// ── PDF generation ───────────────────────────────────────────────────────

/** Greedy wrap. pdf-lib draws strings, it does not lay out paragraphs. */
function wrap(text, font, size, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? line + " " + w : w;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Render the agreement with the recipient's details and signature into a PDF.
 *
 * Built from NDA_CLAUSES rather than by stamping fields onto a template file,
 * so the PDF and the on-screen document cannot say different things.
 */
async function buildNdaPdf({ fullName, roleTitle, email, signedAt, signaturePng }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Loopital Non-Disclosure and Confidentiality Agreement");
  pdf.setSubject(`Executed by ${fullName}`);
  pdf.setProducer("Loopital onboarding portal");

  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28, H = 841.89;           // A4
  const M = 56;                            // margin
  const MAXW = W - M * 2;
  const INK = rgb(0.06, 0.09, 0.13);
  const MUTED = rgb(0.45, 0.47, 0.5);

  let page = null;
  let y = 0;

  const footer = () => {
    page.drawText(NDA_FOOTER, {
      x: M, y: 34, size: 7.5, font: body, color: MUTED,
    });
  };
  const newPage = () => {
    page = pdf.addPage([W, H]);
    y = H - M;
    footer();
  };
  const room = (need) => {
    if (y - need < 64) newPage();
  };
  const para = (text, { font = body, size = 9.5, gap = 7, color = INK, indent = 0 } = {}) => {
    for (const line of wrap(text, font, size, MAXW - indent)) {
      room(size + 3);
      page.drawText(line, { x: M + indent, y, size, font, color });
      y -= size + 3.2;
    }
    y -= gap;
  };

  newPage();

  // Title block
  para(NDA_TITLE, { font: bold, size: 14, gap: 3 });
  para(NDA_SUBTITLE, { size: 9, color: MUTED, gap: 14 });

  for (const line of NDA_PREAMBLE) para(line);

  for (const clause of NDA_CLAUSES) {
    room(30);
    y -= 4;
    para(clause.heading, { font: bold, size: 10, gap: 5 });
    for (const t of clause.text || []) para(t);
    for (const b of clause.bullets || []) {
      room(14);
      page.drawText("•", { x: M + 4, y, size: 9.5, font: body, color: INK });
      para(b, { indent: 16 });
    }
  }

  // ── Execution block ────────────────────────────────────────────────────
  // Kept together: a signature separated from the clause it executes across a
  // page break is the first thing anyone disputing the document points at.
  if (y < 300) newPage();
  y -= 16;
  para("FOR AND ON BEHALF OF THE COMPANY", { font: bold, size: 9, gap: 10 });
  para(COMPANY_SIGNATORY.name, { font: bold, size: 10, gap: 2 });
  para(COMPANY_SIGNATORY.title, { size: 9, color: MUTED, gap: 2 });
  para(COMPANY_SIGNATORY.company, { size: 9, color: MUTED, gap: 18 });

  para("THE RECIPIENT", { font: bold, size: 9, gap: 10 });

  if (signaturePng) {
    try {
      const img = await pdf.embedPng(signaturePng);
      const w = Math.min(190, img.width);
      const h = (img.height / img.width) * w;
      room(h + 12);
      page.drawImage(img, { x: M, y: y - h + 6, width: w, height: h });
      y -= h + 10;
    } catch {
      // A signature image that will not embed must not lose the whole
      // execution: the name, role, date and audit row still evidence it.
      para("[signature image could not be rendered]", { size: 8, color: MUTED, gap: 4 });
    }
  }

  page.drawLine({
    start: { x: M, y }, end: { x: M + 250, y },
    thickness: 0.75, color: rgb(0.2, 0.22, 0.25),
  });
  y -= 14;

  para(`Name: ${fullName}`, { font: bold, size: 10, gap: 3 });
  if (roleTitle) para(`Role: ${roleTitle}`, { size: 9.5, gap: 3 });
  para(`Email: ${email}`, { size: 9.5, gap: 3 });
  para(`Date: ${signedAt.toISOString().slice(0, 10)}`, { size: 9.5, gap: 3 });
  para(
    `Executed electronically through the Loopital onboarding platform under Clause 11.7. Agreement version ${NDA_VERSION}. Server timestamp ${signedAt.toISOString()}.`,
    { size: 7.5, color: MUTED, gap: 16 }
  );

  // The version history, as the document itself now prints it. A signed copy
  // that carries its own history explains, years later, exactly which revision
  // this person agreed to without anyone having to find the source repository.
  room(40);
  para("DOCUMENT VERSION HISTORY", { font: bold, size: 8.5, gap: 6 });
  for (const h of NDA_HISTORY) {
    room(14);
    page.drawText(h.version, { x: M, y, size: 8, font: bold, color: INK });
    para(h.note, { size: 8, color: MUTED, gap: 3, indent: 44 });
  }

  return Buffer.from(await pdf.save());
}

// ── Signing ──────────────────────────────────────────────────────────────

/** Accept a data: URL or bare base64, return PNG bytes. */
function decodeSignature(input) {
  if (!input || typeof input !== "string") return null;
  const m = input.match(/^data:image\/png;base64,(.+)$/);
  const b64 = m ? m[1] : input;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(b64)) return null;
  const buf = Buffer.from(b64.replace(/\s+/g, ""), "base64");
  // 5MB ceiling from the spec, and a PNG magic-number check so a renamed
  // file cannot reach pdf-lib as something it will choke on.
  if (!buf.length || buf.length > 5 * 1024 * 1024) return null;
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  if (!buf.subarray(0, 4).equals(png)) return null;
  return buf;
}

async function signNda(user, body, headers) {
  const p = await loadProfile(user.sub);
  if (p.nda_signed) return json(409, { error: "This agreement has already been signed." });

  const fullName = String((body && body.fullName) || "").trim();
  const roleTitle = String((body && body.role) || "").trim();
  const method = String((body && body.method) || "").trim();

  if (fullName.length < 2) return json(400, { error: "Please give your full legal name." });
  if (!ROLES.includes(roleTitle)) return json(400, { error: "Please choose your role." });
  if (!["drawn", "typed", "uploaded"].includes(method)) {
    return json(400, { error: "Choose how you want to sign." });
  }
  if (body.readConfirmed !== true) {
    return json(400, { error: "Please confirm you have read the agreement in full." });
  }
  if (body.legalConsent !== true) {
    return json(400, { error: "Please accept that your electronic signature is legally binding." });
  }

  const signaturePng = decodeSignature(body && body.signature);
  if (!signaturePng) {
    return json(400, { error: "That signature could not be read. Please sign again, or upload a PNG under 5MB." });
  }

  // The clock is ours. See the header note on why the date is not a field.
  const signedAt = new Date();

  const pdf = await buildNdaPdf({
    fullName,
    roleTitle,
    email: user.email,
    signedAt,
    signaturePng,
  });

  const ip =
    (headers && (headers["x-forwarded-for"] || headers["X-Forwarded-For"] || "")).split(",")[0].trim() ||
    null;
  const ua = (headers && (headers["user-agent"] || headers["User-Agent"])) || null;

  const ins = await sql(
    `INSERT INTO onboarding_ndas
       (user_id, full_name, role_title, email, method, signature_png, pdf, signed_at, ip, user_agent, version)
     VALUES (:u::uuid, :n, :r, :e, :m, decode(:sig,'base64'), decode(:pdf,'base64'), :at, :ip, :ua, :ver)
     RETURNING id`,
    {
      u: user.sub, n: fullName, r: roleTitle, e: user.email, m: method,
      sig: signaturePng.toString("base64"), pdf: pdf.toString("base64"),
      at: signedAt.toISOString(), ip, ua, ver: NDA_VERSION,
    }
  );

  await sql(
    `UPDATE onboarding_profiles
        SET nda_signed = true, nda_signed_at = :at, updated_at = now()
      WHERE user_id = :u::uuid`,
    { at: signedAt.toISOString(), u: user.sub }
  );

  const attachment = { filename: "Loopital-NDA-Signed.pdf", content: pdf.toString("base64") };

  // Both sends are best-effort. A mail failure must not undo a signature that
  // is already recorded — the row is the agreement, the email is a copy of it.
  await safeSend({
    to: user.email,
    subject: "Your signed Loopital Non-Disclosure Agreement",
    heading: `Thank you, ${fullName.split(" ")[0]}`,
    lines: [
      "Your Non-Disclosure and Confidentiality Agreement is signed and on file. Your copy is attached to this email.",
      "Keep it somewhere you can find it. You can also download it again at any time from the onboarding portal.",
      "Next: your onboarding details, then the Loopital Handbook.",
    ],
    attachments: [attachment],
  });

  await safeSend({
    to: ADMIN_EMAIL,
    subject: `NDA signed — ${fullName}`,
    heading: "A team member has signed the NDA",
    lines: [
      `${fullName} (${user.email}) signed the Non-Disclosure Agreement on ${signedAt.toISOString().slice(0, 10)}.`,
      `Role: ${roleTitle}. Signature method: ${method}.`,
      "The signed PDF is attached, and is also on the Zina portal under Onboarding.",
    ],
    attachments: [attachment],
  });

  return json(201, { ok: true, id: ins[0] && ins[0].id, signedAt: signedAt.toISOString() });
}

/**
 * Never let a mail provider outage break a write that already succeeded.
 *
 * sendNotification already logs every attempt to zina_notifications, including
 * the failures, and the hub currently has no RESEND_API_KEY — so today these
 * land as `failed` rows with "Email isn't configured yet." That is the correct
 * behaviour rather than a silent loss: the row is there to be resent from Zina
 * the moment the key is set.
 */
async function safeSend({ to, subject, heading, lines, attachments }) {
  try {
    await notify.sendNotification({
      appId: "loopital",
      template: "onboarding",
      to,
      subject,
      recipientName: heading,
      body: lines.join("\n\n"),
      attachments: attachments || null,
    });
  } catch (e) {
    console.error("onboarding: notification failed:", (e && e.message) || e);
  }
}

// ── The nine-step form ───────────────────────────────────────────────────

async function saveForm(user, body) {
  const p = await loadProfile(user.sub);
  if (!p.nda_signed) return json(403, { error: "The agreement has to be signed first." });
  if (p.form_complete) return json(409, { error: "Your onboarding form is already submitted." });

  const answers = body && typeof body.answers === "object" && body.answers ? body.answers : null;
  if (!answers) return json(400, { error: "Nothing to save." });
  const step = Math.max(1, Math.min(9, Number(body.step) || 1));

  await sql(
    `UPDATE onboarding_profiles
        SET answers = :a::jsonb, step = :s::int, updated_at = now()
      WHERE user_id = :u::uuid`,
    { a: JSON.stringify(answers), s: step, u: user.sub }
  );
  return json(200, { ok: true, savedAt: new Date().toISOString() });
}

/**
 * Did they agree?
 *
 * Accepts the boolean the consent checkbox now sends, and the string "I agree"
 * that the acknowledgements used to store when they were single-option selects.
 * The strict `=== true` check that was here rejected every submission the form
 * could actually produce: the UI let people through and this refused them, with
 * no way to satisfy it. Being liberal about the shape and strict about the
 * meaning is the right way round, and it also means anyone who was midway
 * through with the old value is not stuck.
 */
function agreed(v) {
  if (v === true) return true;
  if (typeof v !== "string") return false;
  const t = v.trim().toLowerCase();
  return t === "i agree" || t === "yes" || t === "true" || t === "agreed";
}

async function submitForm(user, body) {
  const p = await loadProfile(user.sub);
  if (!p.nda_signed) return json(403, { error: "The agreement has to be signed first." });
  if (p.form_complete) return json(409, { error: "Your onboarding form is already submitted." });

  const answers = body && typeof body.answers === "object" && body.answers ? body.answers : asAnswers(p.answers);

  // Only the acknowledgements are hard-required. The rest is chased by a human
  // if it is missing, which is cheaper than blocking someone at step 6 over a
  // field they need to go and look up.
  const missingAcks = ["ackHandbook", "ackAccurate", "ackDataConsent"].filter(
    (k) => !agreed(answers[k]),
  );
  if (missingAcks.length) {
    return json(400, { error: "Please tick the three acknowledgements to finish." });
  }

  const now = new Date();
  await sql(
    `UPDATE onboarding_profiles
        SET answers = :a::jsonb, form_complete = true, form_done_at = :t, step = 9, updated_at = now()
      WHERE user_id = :u::uuid`,
    { a: JSON.stringify(answers), t: now.toISOString(), u: user.sub }
  );

  // Also recorded as a submission so it shows up in the one place every other
  // inbound form already lands, rather than only in a table nobody checks.
  await sql(
    `INSERT INTO submissions (kind, product, name, email, phone, organisation, details)
     VALUES ('onboarding', 'loopital', :n, :e, :ph, 'Loopital Limited', :d::jsonb)`,
    {
      n: String(answers.fullName || user.name || ""),
      e: user.email,
      ph: String(answers.phone || ""),
      d: JSON.stringify({ role: answers.role || null, submittedAt: now.toISOString() }),
    }
  );

  await safeSend({
    to: ADMIN_EMAIL,
    subject: `Onboarding complete — ${answers.fullName || user.email}`,
    heading: "A team member has completed onboarding",
    lines: [
      `${answers.fullName || user.email} finished the onboarding form on ${now.toISOString().slice(0, 10)}.`,
      `Role: ${answers.role || "not stated"}.`,
      "Their full details, including payroll and identification, are on the Zina portal under Onboarding. They are deliberately not included in this email.",
    ],
  });

  await safeSend({
    to: user.email,
    subject: "Welcome to Loopital",
    heading: "You are officially part of the team",
    lines: [
      "Your agreement is signed and your details are in.",
      "One last thing, and it matters more than the paperwork. The Loopital Handbook explains how we think, how we work, and what we are actually trying to build. Read it properly this week, then read it again in three months. It will make more sense the second time.",
      "Welcome to Loopital. Reach Beyond.",
    ],
  });

  return json(200, { ok: true });
}

// ── Downloads ────────────────────────────────────────────────────────────

/**
 * A real PDF download.
 *
 * The body is the Buffer, not base64 of it: server/index.js hands whatever it
 * gets straight to res.send, and express writes a string as UTF-8. A base64
 * body would download as a text file wearing a .pdf extension, which opens as
 * garbage — and would do so only in production, never in a unit test.
 */
const pdfResponse = (buf, filename) => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Length": String(buf.length),
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    ...CORS,
  },
  body: buf,
});

async function ownNda(user) {
  const rows = await sql(
    `SELECT pdf FROM onboarding_ndas
      WHERE user_id = :u::uuid AND superseded_by IS NULL
      ORDER BY signed_at DESC LIMIT 1`,
    { u: user.sub }
  );
  if (!rows.length || !rows[0].pdf) return json(404, { error: "No signed agreement on file." });
  return pdfResponse(toBuffer(rows[0].pdf), "Loopital-NDA-Signed.pdf");
}

/**
 * The Loopital Handbook, gated on having finished onboarding.
 *
 * Served from here rather than from public/ because public/ ships to CloudFront,
 * where the only thing standing between this file and the open internet is
 * nobody guessing the URL. The handbook carries the salary and equity policy,
 * the real SWOT, and the funding position. Section 9 of the spec says files must
 * never be publicly addressable, and the whole point of the last stage is that
 * you receive it once your details are in.
 */
const HANDBOOK_PATH = path.join(__dirname, "assets", "loopital-team-handbook.pdf");

async function handbook(user) {
  const p = await loadProfile(user.sub);
  if (!p.form_complete) {
    return json(403, { error: "Finish your onboarding details first." });
  }
  let buf;
  try {
    buf = fs.readFileSync(HANDBOOK_PATH);
  } catch {
    // Say what is actually wrong. "Download failed" would send someone chasing
    // their own connection for a file that is missing from the deploy.
    console.error("onboarding: handbook missing at", HANDBOOK_PATH);
    return json(503, { error: "The handbook is not available right now. Please tell info@loopital.com." });
  }
  return pdfResponse(buf, "The-Loopital-Handbook.pdf");
}

/** pg returns bytea as a Buffer; the Data API path returns base64. Accept both. */
function toBuffer(v) {
  if (Buffer.isBuffer(v)) return v;
  if (v && v.type === "Buffer" && Array.isArray(v.data)) return Buffer.from(v.data);
  return Buffer.from(String(v), "base64");
}

// ── Zina admin ───────────────────────────────────────────────────────────

/**
 * Fields only Finance and the CEO may see.
 *
 * Mirrors `sensitive: true` in src/app/config/onboarding-form.ts. The two lists
 * have to be edited together, and the server's copy is the one that decides:
 * hiding a field in the admin UI while the API still returns it is not access
 * control, it is styling.
 */
const SENSITIVE_FIELDS = [
  "nin", "bvn", "tin", "idType", "idNumber",
  "bankName", "accountNumber", "accountName", "pfa", "rsaPin",
];

const redact = (answers, allowed) => {
  if (allowed) return answers;
  const out = {};
  for (const [k, v] of Object.entries(answers || {})) {
    if (!SENSITIVE_FIELDS.includes(k)) out[k] = v;
  }
  return out;
};

/** Every team member and where each one has got to. */
async function adminList() {
  const rows = await sql(
    `SELECT u.id, u.name, u.email, u.created_at AS account_created,
            p.nda_signed, p.nda_signed_at, p.form_complete, p.form_done_at, p.step,
            p.answers ->> 'role' AS role
       FROM onboarding_profiles p
       JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT 500`
  );
  return json(200, {
    members: rows.map((r) => ({
      userId: r.id,
      name: r.name,
      email: r.email,
      role: r.role || null,
      accountCreated: r.account_created,
      ndaSigned: r.nda_signed === true,
      ndaSignedAt: r.nda_signed_at,
      formComplete: r.form_complete === true,
      formDoneAt: r.form_done_at,
      step: Number(r.step) || 1,
    })),
  });
}

/** One member's full record, with payroll and identification gated. */
async function adminDetail(userId, canSeeSensitive) {
  const rows = await sql(
    `SELECT u.name, u.email, p.nda_signed, p.nda_signed_at, p.form_complete,
            p.form_done_at, p.step, p.answers
       FROM onboarding_profiles p JOIN users u ON u.id = p.user_id
      WHERE p.user_id = :u::uuid`,
    { u: userId }
  );
  if (!rows.length) return json(404, { error: "No onboarding record for that person." });
  const r = rows[0];
  const nda = await sql(
    `SELECT id, full_name, role_title, method, signed_at, ip, user_agent, version
       FROM onboarding_ndas WHERE user_id = :u::uuid AND superseded_by IS NULL
      ORDER BY signed_at DESC LIMIT 1`,
    { u: userId }
  );
  return json(200, {
    name: r.name,
    email: r.email,
    ndaSigned: r.nda_signed === true,
    ndaSignedAt: r.nda_signed_at,
    formComplete: r.form_complete === true,
    formDoneAt: r.form_done_at,
    step: Number(r.step) || 1,
    answers: redact(asAnswers(r.answers), canSeeSensitive),
    sensitiveHidden: !canSeeSensitive,
    nda: nda.length
      ? {
          id: nda[0].id,
          fullName: nda[0].full_name,
          role: nda[0].role_title,
          method: nda[0].method,
          version: nda[0].version || "1.0",
          signedAt: nda[0].signed_at,
          ip: nda[0].ip,
          userAgent: nda[0].user_agent,
        }
      : null,
  });
}

async function adminNdaPdf(userId) {
  const rows = await sql(
    `SELECT full_name, pdf FROM onboarding_ndas
      WHERE user_id = :u::uuid AND superseded_by IS NULL
      ORDER BY signed_at DESC LIMIT 1`,
    { u: userId }
  );
  if (!rows.length || !rows[0].pdf) return json(404, { error: "No signed agreement on file." });
  const safe = String(rows[0].full_name || "member").replace(/[^A-Za-z0-9 _-]/g, "").trim() || "member";
  return pdfResponse(toBuffer(rows[0].pdf), `Loopital-NDA-${safe.replace(/\s+/g, "-")}.pdf`);
}

const csvCell = (v) => {
  const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
};

/** CSV for HR and payroll. Columns follow the permission, not the request. */
async function adminCsv(canSeeSensitive) {
  const rows = await sql(
    `SELECT u.name, u.email, p.nda_signed, p.nda_signed_at, p.form_complete, p.answers
       FROM onboarding_profiles p JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC LIMIT 500`
  );
  const base = ["fullName", "preferredName", "phone", "role", "employmentType", "startDate",
                "stateOfResidence", "emergencyName", "emergencyPhone"];
  const cols = canSeeSensitive ? [...base, ...SENSITIVE_FIELDS] : base;
  const head = ["name", "email", "ndaSigned", "ndaSignedAt", "formComplete", ...cols];
  const lines = [head.map(csvCell).join(",")];
  for (const r of rows) {
    const a = asAnswers(r.answers);
    lines.push(
      [r.name, r.email, r.nda_signed === true, r.nda_signed_at, r.form_complete === true,
       ...cols.map((c) => a[c])].map(csvCell).join(",")
    );
  }
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="loopital-onboarding.csv"`,
      "Cache-Control": "no-store",
      ...CORS,
    },
    body: lines.join("\n"),
  };
}

module.exports = {
  SENSITIVE_FIELDS,
  adminList,
  adminDetail,
  adminNdaPdf,
  adminCsv,
  ROLES,
  loadProfile,
  stageOf,
  asAnswers,
  toBuffer,
  getState,
  getDocument,
  signNda,
  saveForm,
  submitForm,
  ownNda,
  handbook,
  buildNdaPdf,
};
