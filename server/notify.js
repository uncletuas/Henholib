"use strict";

/**
 * One notification system for the whole ecosystem.
 *
 * Before this, each app sent its own mail: Beacon through its own Resend
 * client, loopital through Resend-or-SES, Modus through SES. Four senders meant
 * four reputations, four sets of provider logs, and no way to answer "did that
 * customer actually get the email?" without knowing which app to go and look in.
 *
 * Now every app POSTs to /notify/send on this API and nothing else holds the
 * Resend key. The send is logged to `zina_notifications` either way — including
 * the failures, which are the rows that matter — so Zina's notifications screen
 * is the whole picture rather than this API's slice of it.
 *
 * Sending is best-effort by design. A welcome email that fails must not fail the
 * signup that triggered it; the row records what happened and the operator can
 * resend from the portal.
 */

const { sql } = require("./db");

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Per-app sender identity. Falls back to the ecosystem default. */
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || "Loopital <no-reply@loopital.com>";

const APP_BRANDING = {
  loopital: { name: "Loopital", accent: "#0f766e", url: "https://www.loopital.com" },
  stack62: { name: "Pal", accent: "#4f46e5", url: "https://pal.loopital.com" },
  sart34: { name: "Swift", accent: "#059669", url: "https://swift.loopital.com" },
  fms13: { name: "Modus", accent: "#c2410c", url: "https://fms13.loopital.com" },
  edm73: { name: "Beacon", accent: "#a3122b", url: "https://beacon.loopital.com" },
  hms7: { name: "Henholib", accent: "#0369a1", url: "https://henholib.loopital.com" },
};

function brandingFor(appId) {
  return APP_BRANDING[appId] || APP_BRANDING.loopital;
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Only an in-app path or an absolute http(s) URL becomes a button.
 *
 * The order matters: a `javascript:` link has to be rejected outright, not
 * concatenated onto the app URL, which would turn it into an https-looking link
 * that goes somewhere else entirely.
 */
function safeUrl(appUrl, linkUrl) {
  if (!linkUrl) return null;
  if (linkUrl.startsWith("//")) return null;
  if (linkUrl.startsWith("/")) return `${appUrl.replace(/\/+$/, "")}${linkUrl}`;
  return /^https?:\/\/[^\s]+$/i.test(linkUrl) ? linkUrl : null;
}

/**
 * Table-based, inline-styled HTML, because that is what survives Outlook and
 * Gmail. No external stylesheet, no web font, no remote image.
 */
function renderHtml({ appId, subject, body, linkUrl, linkLabel, recipientName }) {
  const brand = brandingFor(appId);
  const url = safeUrl(brand.url, linkUrl);

  const greeting = recipientName
    ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3f3f4a">Hi ${esc(
        String(recipientName).trim().split(/\s+/)[0] || ""
      )},</p>`
    : "";

  // The body arrives as plain text — the same text the plaintext part sends.
  // Blank lines become paragraphs so a message written for a terminal still
  // reads properly in an inbox.
  const paragraphs = String(body || "")
    .split(/\n{2,}/)
    .filter((chunk) => chunk.trim())
    .map(
      (chunk) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3f3f4a">${esc(
          chunk.trim()
        ).replace(/\n/g, "<br />")}</p>`
    )
    .join("");

  const button = url
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0">
         <tr><td style="border-radius:8px;background:${brand.accent}">
           <a href="${esc(url)}" style="display:inline-block;padding:12px 22px;font:600 14px ui-sans-serif,system-ui,'Segoe UI',sans-serif;color:#ffffff;text-decoration:none">${esc(
             linkLabel || "Open"
           )}</a>
         </td></tr>
       </table>
       <p style="margin:14px 0 0;font-size:12px;line-height:1.5;color:#9a9aa4">Or paste this into your browser:<br /><span style="color:#77777f">${esc(
         url
       )}</span></p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${esc(
    subject
  )}</title></head>
<body style="margin:0;padding:0;background:#f4f4f6;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(String(body || "").slice(0, 140))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6">
    <tr><td align="center" style="padding:28px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="background:${brand.accent};border-radius:14px 14px 0 0;padding:18px 26px;font:600 16px ui-sans-serif,system-ui,'Segoe UI',sans-serif;color:#ffffff">${esc(
          brand.name
        )}</td></tr>
        <tr><td style="background:#ffffff;padding:28px 26px;font-family:ui-sans-serif,system-ui,'Segoe UI',sans-serif">
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;font-weight:700;color:#1c1c22">${esc(
            subject
          )}</h1>
          ${greeting}${paragraphs}${button}
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 14px 14px;border-top:1px solid #ececf0;padding:16px 26px;font-family:ui-sans-serif,system-ui,'Segoe UI',sans-serif">
          <p style="margin:0;font-size:12px;line-height:1.55;color:#8c8c96">Sent by ${esc(
            brand.name
          )}, part of Loopital. Reply to this message and a real person will read it.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send one notification.
 *
 * Returns `{ ok, id?, error? }` and never throws, so a caller can `await` it on
 * the happy path of a signup or a payment without wrapping it in a try.
 */
async function sendNotification({
  appId = "loopital",
  to,
  subject,
  body,
  html,
  linkUrl,
  linkLabel,
  recipientName,
  template = null,
  replyTo = null,
  from = null,
}) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return { ok: false, error: "No recipient." };
  if (!subject) return { ok: false, error: "No subject." };

  const apiKey = process.env.RESEND_API_KEY;
  const sender = from || DEFAULT_FROM;

  // Log first, so a send that dies mid-flight still leaves a trace. One row per
  // recipient: "was this person emailed?" is the question the log has to answer.
  const logged = [];
  for (const recipient of recipients) {
    const rows = await sql(
      `INSERT INTO zina_notifications (app_id, template, to_email, subject, status)
       VALUES (:app, :template, :to, :subject, 'queued') RETURNING id`,
      { app: appId, template, to: recipient, subject }
    ).catch(() => []);
    if (rows[0]) logged.push(rows[0].id);
  }

  // One statement per logged row rather than `id = ANY($1::uuid[])`: a handful
  // of recipients at most, and it avoids depending on how the driver serialises
  // a JS array into a Postgres array literal — a detail that is easy to get
  // subtly wrong and whose failure mode is a row silently stuck at "queued".
  async function finish(status, { providerId = null, error = null } = {}) {
    for (const id of logged) {
      await sql(
        `UPDATE zina_notifications SET status = :status, provider_id = :pid, error = :err
          WHERE id = :id::uuid`,
        { status, pid: providerId, err: error, id }
      ).catch(() => {});
    }
  }

  if (!apiKey) {
    await finish("failed", { error: "RESEND_API_KEY is not set." });
    return { ok: false, error: "Email isn't configured yet." };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: recipients,
        subject,
        text: body || undefined,
        html: html || renderHtml({ appId, subject, body, linkUrl, linkLabel, recipientName }),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = (data && (data.message || data.name)) || `Resend ${res.status}`;
      await finish("failed", { error: String(error).slice(0, 500) });
      return { ok: false, error: String(error) };
    }
    await finish("sent", { providerId: data && data.id ? String(data.id) : null });
    return { ok: true, id: data && data.id };
  } catch (e) {
    const error = (e && e.message) || "Network error";
    await finish("failed", { error: String(error).slice(0, 500) });
    return { ok: false, error: String(error) };
  }
}

module.exports = { sendNotification, renderHtml, brandingFor, APP_BRANDING, DEFAULT_FROM };
