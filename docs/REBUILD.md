# Rebuilding the estate from nothing

Everything here assumes you have just cloned into an empty folder and have no
memory of how any of it fits together.

**No credentials are in this file.** This repo is public. The values live in
`C:\Users\USER\.claude\loopital-credentials.md` on the founder's machine, and in
Zina's vault at [zina.loopital.com](https://zina.loopital.com). This file names
what you need and where to get it, never what it is.

---

## Where things run

Two providers, on purpose. Saying "it's on AWS" is half the picture.

**AWS** — account `703592322789`, `us-east-1`. Every front end, as a static
build in S3 behind CloudFront. Nothing else.

| site | bucket | distribution |
|---|---|---|
| www.loopital.com | `loopital-com-site` | `E1PBUW0DUIWZRH` |
| pal.loopital.com | `pal-loopital-com` | `E3Q7WRXKSQP4SW` |
| swift.loopital.com | `swift-loopital-com` | `E2OEWOXKEJSP3N` |
| zina.loopital.com | `zina-loopital-com` | `E29ISRAWH9B0E6` |
| modus.loopital.com | `modus-loopital-com` | — |

**Render** — every API, and the one database the whole group depends on.

| service | id | serves |
|---|---|---|
| `loopital-api-fra` | `srv-da00j2nlk1mc73er6e70` | the hub API *and* Zina, Frankfurt |
| `pal-api` | `srv-d9v35kjm8hqs73dna5dg` | Pal |
| `swift-api` | `srv-d9v0vafqj5pc738nv6q0` | Swift |
| `pal-db` | — | Postgres for all four, in separate schemas |

All three services auto-deploy on push. DNS is at Hostinger — Route 53 has no
hosted zones; the Host field there is the bare label (`swift`), never the FQDN.
See [DNS-RECORDS.md](DNS-RECORDS.md).

> **`pal-db` expires 2026-09-12.** It is a free Render Postgres and it now
> carries Loopital, Zina, Pal and Swift. When it expires every login in the group
> stops. This is the most urgent thing in this document.

## The three repos

```sh
git clone https://github.com/uncletuas/Loopital.git              loopital.com
git clone https://github.com/uncletuas/stack62.com.git           pal-repo
git clone -b swift-live https://github.com/uncletuas/Sart34.git  swift-repo
```

Only `Loopital` is public. Each repo holds a backend and a frontend in one tree,
which is not obvious from the outside:

| repo | backend | frontend |
|---|---|---|
| `loopital.com` | `server/` (Node, on Render) | repo root (Vite) — plus Zina, a second Vite app in `zina/` |
| `pal-repo` | repo root (NestJS) | `workspace/` (Vite) |
| `swift-repo` | repo root (NestJS) | `frontend/` (Vite) |

### Swift's two branches — read this before building Swift

`main` and `swift-live` diverged, and **each holds the newer half**:

| | `main` | `swift-live` |
|---|---|---|
| backend | **newer** — ops connector, credit bundles, the hub credit hook | older |
| frontend | older — 2805-line `App.tsx` | **newer** — 4940 lines, PWA, local logo |

So: Render builds the **backend from `main`**. Build the **frontend from
`swift-live`**. A frontend built from `main` silently regresses the live UI to an
older design, and the only visible tell is the bundle size (~285 KB from `main`,
~371 KB from `swift-live`). Merging them is a real job — roughly 28 conflict
hunks across 10 files — and deserves its own sitting.

## Building and deploying a front end

```sh
npm ci
npm run build          # loopital.com: `npm run build:zina` for the Zina portal
```

**Do not pass `VITE_API_BASE_URL` on the command line.** Each front end commits a
`.env.production` holding its API host, and that file is the source of truth.
This is not a style preference — on 2026-08-25 all three sites were deployed with
a bare `npm run build` that fell back to each app's *default* API base, and
shipped sites whose every API call failed while every page still rendered
perfectly. The committed file is what makes a fresh clone correct.

Then, from the repo holding that front end:

```sh
aws s3 sync dist/assets s3://<bucket>/assets \
  --cache-control "public,max-age=31536000,immutable"
aws s3 sync dist s3://<bucket> --exclude "assets/*" \
  --cache-control "no-cache,must-revalidate" --delete
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

The two-pass sync is deliberate. Hashed asset names are immutable and cached for
a year; `index.html` is never cached. So a deploy takes effect at once and never
serves a stale shell pointing at assets that no longer exist. Note the asset pass
has no `--delete`: the previous build's chunks stay reachable for anyone
mid-session.

This machine's network intermittently fails on bucket-scoped S3 calls
("Could not connect to the endpoint URL"). It is not an auth problem — retry.

## Verifying a deploy — the check that matters

A screenshot proves the page painted. It does not prove the page can reach
anything, and a marketing landing page calls no API at all. **Assert on the
compiled API base:**

```sh
site=https://www.loopital.com
asset=$(curl -s "$site/" | grep -o '/assets/index-[A-Za-z0-9_-]*\.js' | head -1)
curl -s "$site$asset" | grep -o 'https://[a-z0-9.-]*onrender[a-z0-9./-]*' | sort -u
```

Expected:

| site | must contain |
|---|---|
| www.loopital.com | `https://loopital-api-fra.onrender.com` |
| zina.loopital.com | `https://loopital-api-fra.onrender.com` |
| pal.loopital.com | `https://pal-api-bypy.onrender.com/v1` |
| swift.loopital.com | `https://swift-api-cxfi.onrender.com/api/v1` |

Then one real round trip, to prove JSON comes back rather than `index.html`:

```sh
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' \
  -X POST https://loopital-api-fra.onrender.com/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"nobody@example.com","password":"wrong"}'
# expect: 401 application/json
```

## Credentials — what exists, and where

Values are in the founder's local sheet and in Zina. This is the inventory.

| what | where it lives | notes |
|---|---|---|
| Render API key | local sheet | deploys, logs, env vars for all three services |
| AWS access key + secret | local sheet | **root keys** — replace with a scoped IAM user |
| `ZINA_OPS_SECRET` | Render env, every service | signs every connector call; must match across all |
| `ZINA_ENCRYPTION_KEY` | Render env, `loopital-api-fra` | AES-256-GCM key for the vault. **Lose it and every stored credential is unreadable.** |
| `JWT_SECRET`, `ZINA_JWT_SECRET` | Render env, `loopital-api-fra` | rotating them signs everyone out |
| `BILLING_HOOK_SECRET` | Render env, hub **and** Swift | must match on both or credits are never delivered |
| everything else | **Zina → API keys** | Paystack, Resend, Google, per-app URLs |

The point of Zina is that the last row is not a code change. Each service pulls
its own values at boot and re-checks every 60 seconds, so rotating a key is an
edit in the portal. Read [ZINA.md](ZINA.md) — especially "Live configuration",
and the table of settings still unset.

Two things that are true today and easy to forget:

- The AWS keys are **root** keys. They cannot be scoped and their compromise is
  unrecoverable. Issue a scoped IAM user and delete them.
- **No transactional email is being sent at all** — `RESEND_API_KEY` is unset, so
  every send is logged and marked failed. Zina → Notifications shows them.

## Where to look when something is wrong

| symptom | first place to look |
|---|---|
| a site loads but nothing works | compiled API base — run the check above |
| "payments aren't configured yet" | `PAYSTACK_SECRET_KEY` unset in Zina, against Loopital |
| no email arriving | `RESEND_API_KEY` unset; Zina → Notifications will say so |
| Zina shows an app but no users or metrics | that app's ops connector — see the contract in [ZINA.md](ZINA.md) |
| Google sign-in fails mid-redirect | the redirect URI is missing from the Google console |
| every login in the group fails | `pal-db` — check it still exists |
