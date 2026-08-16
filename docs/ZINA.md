# Zina — the Loopital control plane

One portal at `zina.loopital.com`. One superadmin account. Every Loopital app —
Pal, Swift, Modus, Beacon, Henholib and Loopital itself — seen at a glance and
managed from one place, with the ability to step directly into any of them.

It replaces four separate sign-ins:

| Was | Is now |
|---|---|
| `senate.loopital.com` — Swift admin | Zina → Swift |
| `assembly.loopital.com` — Pal admin | Zina → Pal |
| `ministry.loopital.com` — Modus admin | Zina → Modus |
| `academia.loopital.com` — Beacon platform portal | Zina → Beacon |

The per-app operational roles still exist. What changed is that they are now
rows in one staff table, scoped to one app, and everyone signs in here.

---

## The shape of it

Zina **federates**; it does not absorb.

```
                       ┌──────────────────────────┐
   you ───────────────▶│   zina.loopital.com      │   (static site, dist-zina)
                       │   the portal             │
                       └────────────┬─────────────┘
                                    │  staff JWT (aud: zina)
                       ┌────────────▼─────────────┐
                       │   loopital-api-fra       │
                       │   /zina/*                │
                       │                          │
                       │   owns, in its own       │
                       │   Postgres schema:       │
                       │   · accounts (users)     │
                       │   · the payment ledger   │
                       │   · the notification log │
                       │   · the support queue    │
                       │   · the credential vault │
                       │   · staff, roles, audit  │
                       └────────────┬─────────────┘
                                    │  HMAC-signed ops calls
        ┌──────────────┬────────────┼────────────┬──────────────┐
        ▼              ▼            ▼            ▼              ▼
      Pal            Swift        Modus       Beacon        Henholib
   (stack62)        (sart34)      (fms13)     (edm73)         (hms7)
   own DB           own DB        own DB      own DB          own DB
```

Two rules follow from that picture, and they explain most of the design:

1. **Group-wide facts live in the loopital schema.** Identity, money,
   notification, support and credentials had already converged there, so that is
   where Zina keeps them. There is one `users` table, one `payments` ledger, one
   `zina_notifications` log.

2. **App-specific data stays in the app.** Beacon's students and Modus's work
   orders are read live over each app's ops connector. Zina holds no second
   copy, and — importantly — no credentials for five other databases. A single
   portal that could open every database would be a single thing worth stealing.

---

## What "one Resend" and "one Paystack" mean in practice

**Email.** Every transactional message in the ecosystem now goes out through
`POST /notify/send` on the loopital API, which is the only holder of
`RESEND_API_KEY`, and every send is logged to `zina_notifications` — including
the failures, which are the rows that matter. "Did the customer get it?" is one
question with one place to look.

The exception is deliberate: **a school emailing its own students still goes out
over that institution's own SMTP** (`Beacon src/lib/notify/channels.ts`). A
parent should hear from their child's school, not from a platform they have
never heard of. Only Loopital's own messages travel through the hub.

**Payments.** One Paystack merchant account, one webhook, one ledger.

- Products billed *through* the hub (Pal, Swift) use `POST /billing/checkout`,
  which prices server-side from `BILLING_CATALOG` in `server/app.js` so the
  amount can't be tampered with by a client.
- Products that bill their own customers on the same merchant account (Beacon
  bills institutions; Modus bills companies — neither is a Loopital account)
  report each payment to `POST /zina/ingest/payment`. It lands in the same
  ledger carrying the customer's own name and email.

`payments.user_id` is nullable for exactly this reason.

---

## Live configuration — the portal *is* the environment

This is the part that removes the "start coding to change a key" problem.

Every value in **API keys** that carries an **environment variable name** is
live configuration. Each service pulls its own set from `GET /ops-config` at
startup, overlays it onto `process.env` before anything reads config, and
re-checks a version integer every 60 seconds. Rotating a key, repointing a base
URL, or switching object storage from AWS to Alibaba is an edit in the portal —
no code change, no redeploy.

```
   you edit a value in Zina
            │
            ▼
   zina_secrets (AES-256-GCM)  ──►  version++ for that app
            │
            │   GET /ops-config      (signed, per-app)
            ▼
   the service overlays it onto process.env
```

Three rules make it safe to depend on:

1. **The local environment is the fallback, never the loser.** If Zina is
   unreachable — asleep, redeploying, misconfigured — the service starts on
   whatever its own environment already had. A control plane that can take the
   whole group down when it hiccups is worse than the problem it solves.
2. **Zina wins when it answers.** Otherwise "change it in the portal" is a lie
   the moment a stale variable is left on a host.
3. **An app only ever receives its own values.** Scoped by the signing identity,
   not by a filter the caller supplies.

**A value with no variable name is recorded but never injected.** That's the
escape hatch for keeping track of a credential nothing reads from its
environment — an old provider key, a console password.

### What to put where

| Set in the hosting platform's env | Manage in Zina |
|---|---|
| `ZINA_OPS_SECRET` | everything else |
| `LOOPITAL_API_URL` | API keys, webhook secrets, OAuth credentials |
| `DATABASE_URL` (bootstrap) | base URLs, bucket and region names, provider switches |

The first column is the minimum needed to *reach* Zina, so it can't itself live
in Zina. Everything else belongs in the portal.

### Wiring a service to it

The client is ~150 lines and identical in every app:

| App | Client | Loaded from |
|---|---|---|
| Pal | `src/shared/zina/config.ts` | `src/main.ts`, before `NestFactory.create` |
| Swift | `src/shared/zina/config.ts` | `src/main.ts`, before `NestFactory.create` |
| Beacon | `src/lib/zina/config.ts` | `src/instrumentation.ts` |
| Modus | `src/zina-config.mjs` | top of the Lambda handler |

**It must run before the framework reads the environment.** `@nestjs/config`
snapshots `process.env` when its module initialises, so a load placed inside a
Nest module is invisible to `ConfigService` — hence the call sitting above
`NestFactory.create` rather than in a provider.

### Caveat worth knowing

A value read *once at boot* (a database URL a connection pool already opened, a
client constructed at module load) needs a restart to take effect. The poll
updates `process.env`; it can't reach back into an object that already copied
it. On Render that restart is a button — which is the difference the user was
after, not zero-downtime hot-swapping.

---

## Deploying the portal

The portal is a second Vite app in this repo, building to `dist-zina/`.

```bash
npm run dev:zina     # local, on :5174
npm run build:zina   # production bundle in dist-zina/
```

**On Render** — a new *static site*, free tier:

| Setting | Value |
|---|---|
| Build command | `npm install && npm run build:zina` |
| Publish directory | `dist-zina` |
| Environment | `VITE_API_BASE_URL=https://loopital-api-fra.onrender.com` |
| Rewrite rule | `/*` → `/index.html` (200) — it's a single-page app |

**DNS** — a Hostinger `CNAME`. The host is the bare label, `zina`, **not** the
full domain. (That is the gotcha that broke the Pal record.)

---

## Environment

### On the loopital API (`loopital-api-fra`)

| Variable | Required | What it does |
|---|---|---|
| `ZINA_SUPERADMINS` | to bootstrap | Comma-separated emails that become superadmin on first sign-in. This is the only way to create the first staff row, and the recovery path if the last one is ever deleted. |
| `ZINA_JWT_SECRET` | yes | Signs staff sessions and the short-lived assertions used to step into an app. **Keep it distinct from `JWT_SECRET`** — that separation is what stops a stolen customer token being presentable as a staff token. Each app that accepts a step-in needs the same value. |
| `ZINA_ENCRYPTION_KEY` | for the vault | 32 bytes, as 64 hex characters or base64. Encrypts stored credentials (AES-256-GCM). Without it the API keys screen is read-only and says so. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `ZINA_OPS_SECRET` | for connectors | Fallback shared secret for signing calls to apps that have no per-app secret set. Prefer a per-app secret, set in the portal. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | for email | The one sending account. |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_CALLBACK_URL` | for billing | The one merchant account. |
| `OPS_URL_PAL`, `OPS_URL_SWIFT`, `OPS_URL_MODUS`, `OPS_URL_BEACON`, `OPS_URL_HENHOLIB` | optional | Seeds each app's connector URL on boot. Editing an app in the portal is the normal way to set these; the environment only fills in what's blank. |
| `ZINA_OPS_TIMEOUT_MS` | optional | Per-connector request budget, default 8000. Free-tier services that sleep need the headroom. |

### On each product app

| Variable | What it does |
|---|---|
| `ZINA_OPS_SECRET` | The shared secret for that app. Must match what's stored against the app in Zina. |
| `ZINA_JWT_SECRET` | Only needed to accept a step-in, so the app can verify Zina's assertion. |
| `LOOPITAL_API_URL` | Where to reach the hub for email, tickets and payment reports. |

### First sign-in

1. Set `ZINA_SUPERADMINS=you@loopital.com` and `ZINA_JWT_SECRET` on the API.
2. Make sure that email has an ordinary Loopital account (sign up on
   loopital.com if not — Zina grants standing, it does not create identities).
3. Sign in at `zina.loopital.com` with that account's own password.

The staff row is created on that first successful sign-in. After that, add
everyone else from **Staff & roles**.

---

## Roles

A role says what kind of work someone does; the app scope says where. Both are
enforced on the server, on every route — the sidebar hiding a link is a
convenience, not the control.

| Role | Holds |
|---|---|
| **Superadmin** | Everything, everywhere, including staff, credentials and stepping into any app. |
| **Operations** | Users, subscriptions, support and the day-to-day running of the apps. |
| **Finance** | Payments, plans and revenue. Reads users; changes no accounts. |
| **Engineering** | Health, databases, connectors and credentials. No customer money. |
| **Support** | The support queue, and enough of a customer's account to help them. |
| **Analyst** | Reads usage and growth. Changes nothing — an analyst who can also change what they measure is measuring something else. |

**App scope** is the "per-app operational roles continue to exist" mechanism.
Empty scope means the whole ecosystem. A scope of `{fms13}` means every query
that person makes is filtered to Modus: their ticket list, their app registry,
their payments, their analytics.

---

## The connector contract

Each app exposes a small set of `/ops/*` routes. Everything except `/health` is
optional — an unimplemented route returns **404**, which Zina renders as "not
available for this app" rather than as a failure. The ecosystem is not uniform,
and pretending otherwise would mean shipping nothing until every app caught up.

```
GET  {ops}/health            → { status, version?, db?: {status, latencyMs}, detail? }
GET  {ops}/summary           → { any: number|string, … }   shown on the app's tile
GET  {ops}/users?q&limit     → { users: [{ id, name, email, status, createdAt }] }
POST {ops}/users/:id/action  → { ok }        suspend | restore | reset-password
GET  {ops}/keys              → { keys: [{ id, label, envVar, hint, rotatedAt }] }
GET  {ops}/metrics?days      → { metrics: [{ metric, day, value }] }
GET  {ops}/tickets?since     → { tickets: [{ id, subject, email, status, createdAt }] }
POST {ops}/admin-session     → { url }       where to land the operator
```

### Signing

Every call in either direction carries:

```
x-zina-app:        <app id>
x-zina-timestamp:  <epoch ms>
x-zina-signature:  HMAC-SHA256( `${timestamp}.${METHOD}.${path}.${body}` , secret )
```

`path` is the route **as signed** — `/summary`, not `/api/ops/summary`. The
`/api/ops` part is the base URL configured on the Zina side. Anything older than
five minutes is refused.

A signature rather than a bearer token, deliberately: there is no long-lived
credential to leak into a log or a proxy, and a captured request stops being
useful the moment the window closes.

The canonical implementation is `server/connectors.js`. Working ports:

- **Beacon** (Next.js) — `src/lib/zina/signature.ts`, `src/app/api/ops/[...path]/route.ts`
- **Modus** (Hono) — `services/api/src/zina-ops.mjs`

### Stepping into an app

"Manage directly" must not ask the operator to sign in again, but the cookie
can't be set by the connector call — that's server-to-server, so nothing in its
response reaches the browser.

So the flow is:

1. Zina mints an assertion: a JWT valid for **120 seconds**, audience-bound to
   `zina:<appId>` so one minted for Modus cannot open Beacon.
2. Zina POSTs it to `{ops}/admin-session`; the app returns a one-time URL with
   the assertion in it.
3. The browser opens that URL. The app verifies the assertion **in a request
   that has a browser attached**, and establishes its own session there.

**The app keeps the final say.** Zina vouches for who is asking; it does not get
to grant standing. Beacon's handoff requires a real `PlatformStaff` row, so
removing someone there locks them out of Beacon whatever Zina believes about
them. That property is what makes it safe for one portal to hold the way into
five apps.

An app with no connector falls back to its plain admin URL, and Zina says why
you'll be asked to log in.

### Calling the hub

```
GET  /ops-config             → { version, config: { VAR: value }, unreadable? }
GET  /ops-config/version     → { version }
POST /notify/send            { to, subject, body, recipientName?, linkUrl?, template? }
POST /zina/ingest/ticket     { subject, message, email, name?, externalId?, priority? }
POST /zina/ingest/payment    { reference, amountMinor, currency?, status, plan?,
                               customerEmail?, customerName?, product? }
POST /zina/ingest/metrics    { metrics: [{ metric, day, value }] }
```

All signed the same way. `externalId` makes ticket ingest idempotent — a webhook
retry lands on the existing ticket instead of opening a second one. Payment
ingest is idempotent on `reference`.

Beacon's client for these is `src/lib/zina/client.ts`; copy it.

---

## Connecting a new app

1. Implement `/ops/health` at minimum. Add `/summary` to get figures on the tile.
2. Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Set it as `ZINA_OPS_SECRET` on the app.
4. In Zina → **Apps** → *Configure*: set the ops base URL and paste the same
   secret. Leaving the secret box blank on a later edit keeps the stored one, so
   renaming an app never silently wipes its credentials.
5. Hit **Re-check**. The app should go green.

New products can be added to the seed list in `server/connectors.js`, but the
registry is the source of truth once seeded — editing an app in the portal is
not undone by the next restart.

---

## Where things live

| | |
|---|---|
| `server/zina.js` | Every `/zina/*` route: auth, overview, apps, users, payments, notifications, support, vault, databases, analytics, staff, audit. |
| `server/connectors.js` | The ops contract, signing, fan-out, health. Seed registry. |
| `server/notify.js` | The one notifier — Resend, the branded template, the log. |
| `server/vault.js` | AES-256-GCM sealing for stored credentials. |
| `server/zina-schema.js` | Zina's DDL, applied idempotently on boot. |
| `zina/` | The portal. `src/pages/*` is one file per screen. |
| `vite.zina.config.ts` | Its build. |

---

## Current state

**Connected and working**

- Loopital itself — accounts, ledger, notifications, support, vault, audit,
  analytics, staff and roles, all live.
- **Beacon** — full connector (health, summary, users, tickets, metrics), the
  step-in handoff at `/academia/handoff`, and its subscription invoices reported
  into the unified ledger on settlement.
- **Modus** — connector at `/ops/*` (health, summary, users, metrics) plus the
  step-in handshake. The Ministry frontend still needs a `/handoff` route to
  exchange the assertion for its own session.

- **Pal (stack62)** — connector at `/ops/*` (health, summary, users, metrics),
  step-in handshake, and live config loaded in `src/main.ts`. Repo:
  `github.com/uncletuas/stack62.com`.
- **Swift (sart34)** — the same, in `src/modules/ops/`. Repo:
  `github.com/uncletuas/Sart34`.

Every app now pulls its keys and URLs from Zina at startup.

**Worth knowing**

- **The step-in needs a `/handoff` route in each app's own admin frontend**
  before "Manage" lands you already signed in. The backend half is done for
  Beacon (working), Modus, Pal and Swift; the frontends for the last three still
  need to exchange the assertion for their own session. Until then "Manage"
  degrades to that portal's own login and says why.
- **This is deliberately centralised.** One portal reaching five apps is a
  concentration of risk, taken knowingly because a two-person team cannot staff
  four separate consoles. The mitigations that make it defensible are in place:
  per-app connector secrets, role and app scoping enforced server-side, an audit
  row for every action including credential reveals, encrypted values at rest,
  and each app keeping the final say on who may administer it. Splitting back
  out later means giving people narrower `app_scope` values — the model already
  supports it.
- Beacon's subscription billing still *originates* in Beacon, on the shared
  Paystack account, and reports into the unified ledger once settled. That is
  deliberate: the plan and period logic is Beacon's, and moving it to the hub
  would mean the hub knowing about institutions.
- The old portals' own login pages still exist. Nothing points at them any more,
  but they aren't removed — worth doing once each app's step-in is verified in
  production, so there's a way back in if a handoff misbehaves.
