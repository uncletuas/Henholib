# Loopital ecosystem — message & copy templates

One voice across **Loopital**, **Pal**, and **Swift**. Use these for transactional email, product updates, and in-app notifications.

**Voice:** warm, plain, human. First name only. One clear next step. No hype, no em dashes, no jargon. Say what happened and what to do next.
**Sign-off (email):** `— The Loopital team` / `www.loopital.com`
**Sender:** support@loopital.com

Legend: 🟢 = already wired in code · ⚪ = ready to wire.

---

## Loopital (account & identity)

**🟢 Welcome (on signup)** — *subject:* `Welcome to Loopital`
> Hi {first}, welcome to Loopital — one account for everything we build. Pal is your free AI workspace (add the AI coworker when you're ready); Swift is AI ads + CRM across every major platform. You sign in to every app with this same email. Reply anytime — a real person reads it.

**🟢 Waitlist confirmation** — *subject:* `You're on the {Product} waitlist`
> Hi {first}, you're on the list. We roll out access in batches; the moment your spot is ready we'll email an invite. Meanwhile, explore what else we're building at loopital.com.

**⚪ Password reset** — *subject:* `Reset your Loopital password`
> Hi {first}, we got a request to reset your password. Tap below to choose a new one — the link expires in 30 minutes. Didn't ask for this? You can safely ignore this email; your password won't change.

**⚪ Password changed** — *subject:* `Your password was changed`
> Hi {first}, your Loopital password was just changed. If this was you, you're all set. If it wasn't, reset it now and contact us right away.

**⚪ Contact received (auto-reply)** — *subject:* `We got your message`
> Hi {first}, thanks for reaching out — your message landed with our team and we'll get back to you within one business day. For anything urgent, just reply here.

**⚪ Payment receipt** — *subject:* `Your Loopital receipt — {amount}`
> Hi {first}, thanks for your payment of {amount} on {date} for {item}. This email is your receipt. Manage your plan anytime from your account on loopital.com.

---

## Pal (AI workspace + coworker)

**🟢 Plan activated (after payment)** — *subject:* `Your Pal {Pro/Business} plan is active`
> Hi {first}, your payment went through and your Pal {plan} coworker is switched on{, seats: N}. Open your workspace and put it to work — research, drafts, automation, decisions. Renews every 30 days; change or cancel anytime.

**⚪ Coworker daily limit reached (in-app + email nudge)** — *subject:* `You've hit today's free coworker limit`
> Hi {first}, you've used your free coworker messages for today. Upgrade to Pal Pro (₦35,000 / $25 a month) for unlimited help within fair use, priority responses, and workflow automations. Pick up right where you left off →

**⚪ Renewal reminder (T-3 days)** — *subject:* `Your Pal plan renews in 3 days`
> Hi {first}, a heads-up: your Pal {plan} plan renews on {date} for {amount}. Nothing to do if you're happy — it'll continue without interruption. Need to change seats or cancel? Manage your plan here.

**⚪ Payment failed** — *subject:* `We couldn't renew your Pal plan`
> Hi {first}, we tried to renew your Pal {plan} plan but the payment didn't go through. Your coworker stays on for a 3-day grace period. Update your payment method to avoid interruption →

**⚪ Team seat invite (Business)** — *subject:* `{Inviter} added you to their Pal team`
> Hi {first}, {inviter} added you to the {org} workspace on Pal. Your AI coworker is ready — sign in with this email to jump in. No setup, no separate bill.

**In-app notifications (short):**
- `Coworker unlocked — you're on Pal {plan}.`
- `Free limit reached. Upgrade to keep going →`
- `Renews {date}. Manage plan.`
- `{name} joined your workspace.`

---

## Swift (AI ads + CRM, credit-based)

**⚪ Welcome to your workspace** — *subject:* `Your Swift workspace is ready`
> Hi {first}, your Swift workspace is live with 100 free credits to start. Connect a platform, describe your offer, and let Swift build your first AI campaign. When you're ready for more, top up from ₦5,000 / $4 — no subscription, pay only for what you use.

**⚪ Low credits warning (in-app + email)** — *subject:* `You're running low on Swift credits`
> Hi {first}, you have {N} credits left — about {M} campaigns' worth. Top up to keep your campaigns running without a pause. Bigger bundles cost less per credit →

**⚪ Credits topped up** — *subject:* `{N} credits added to your workspace`
> Hi {first}, {N} credits are in your Swift wallet (payment of {amount} confirmed). You're good to keep building and publishing. Here's your receipt.

**⚪ Campaign published** — *subject:* `Your campaign is live on {platform}`
> Hi {first}, "{campaign}" is now live on {platform}. We'll keep an eye on it and surface anything worth your attention in the workspace. View performance →

**⚪ Campaign needs attention** — *subject:* `"{campaign}" needs a quick look`
> Hi {first}, {reason — e.g. cost per lead is climbing / budget nearly spent}. Swift has a suggestion ready — open the campaign to review and apply it in one tap.

**⚪ New lead captured** — *subject:* `New lead from {campaign}`
> Hi {first}, {lead name} just came in from {campaign} on {platform}. Swift's assistant has drafted a first reply — review and send it from your inbox before they cool off.

**⚪ Payment failed (top-up)** — *subject:* `Your Swift top-up didn't go through`
> Hi {first}, your top-up of {amount} didn't complete, so no credits were added and you weren't charged. Give it another try, or reply if you'd like a hand.

**In-app notifications (short):**
- `{N} credits left — top up →`
- `"{campaign}" is live on {platform}.`
- `New lead from {campaign}. Draft reply ready →`
- `Credits added: +{N}.`

---

## Product updates / announcements (broadcast)

**Structure:** what's new (1 line) → why it helps you (1 line) → try it (link). Keep to ~60 words.

**Example — Pal tiers launch:**
> New: Pal now comes in Free, Pro, and Business. Free keeps the whole workspace; Pro (₦35,000 / $25 a month) unlocks the full AI coworker; Business adds shared team workspaces and admin controls per seat. See what fits →

**Example — Swift bundles:**
> New: bigger Swift credit bundles, cheaper per credit — up to Scale (6,000 credits). Still pay-as-you-go, no subscription. Top up →

---

*Placeholders:* `{first}` first name · `{plan}` Pro/Business · `{amount}` formatted price · `{N}`/`{M}` counts · `{platform}` Meta/Google/etc · `{campaign}` name. Transactional emails are best-effort and never block the underlying action (see `sendUserEmail` in `infra/lambda/index.js`).
