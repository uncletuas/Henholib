# DNS records to add at Hostinger

AWS account **703592322789** (Letify Limited), region **us-east-1**.
DNS stays at Hostinger — the account has no Route 53 hosted zones.

> **The Host field is the bare label.** `swift`, not `swift.loopital.com`.
> Hostinger appends the domain itself; typing the full name produces
> `swift.loopital.com.loopital.com`, which is the mistake that broke the Pal
> record before. Same for the long `_abc123.swift` validation hosts — the
> `.loopital.com` part is already stripped below.

## Step 1 — certificate validation (add these first)

Each certificate stays `PENDING_VALIDATION` until its record resolves, and
CloudFront will not accept the custom domain until the certificate is `ISSUED`.
All are CNAME, TTL 3600.

| Host | Value |
|---|---|
| `_a49f0965bc394a7750b5367f12e5093f.zina` | `_22ada8a4ec0e1124d99408244c90ccf0.jkddzztszm.acm-validations.aws.` |
| `_65f7dc3434fe21ea2fff2d0a022af751.www` | `_effed30f76ac74b5730ccaa2d3244c30.jkddzztszm.acm-validations.aws.` |
| `_371fdaac5624025476cbf0043397cfaf` *(apex)* | `_b9e6f45e89e33c1bef7a446573d002c1.jkddzztszm.acm-validations.aws.` |
| `_602002bcc3bd77239b4cf526f6da4f71.swift` | `_c3f5f99bbea9897b067103e156492325.jkddzztszm.acm-validations.aws.` |
| `_0a5953f54454ac15756ec0032a2df71f.pal` | `_b15445870bf518a217ae72a0f6455438.jkddzztszm.acm-validations.aws.` |
| `_af5f42c51b470da1c570df6b1c6dae53.modus` | `_4bd9eccc9caff9a62a29b38f7bdf0c83.jkddzztszm.acm-validations.aws.` |

## Step 2 — point the names at CloudFront

Add these **after** the certificates show `ISSUED` and the aliases have been
attached (see below). Adding them earlier serves a TLS warning, because the
distribution is still on CloudFront's default certificate.

| Type | Host | Value |
|---|---|---|
| CNAME | `zina` | `d3ahwhp77h0afx.cloudfront.net` |
| CNAME | `www` | `d2ghi415n55ybx.cloudfront.net` |
| CNAME | `swift` | `d1xys9q3rm8esr.cloudfront.net` |
| CNAME | `pal` | `d12uk9pozt4c5w.cloudfront.net` |
| CNAME | `modus` | `duzbjy60tt1hq.cloudfront.net` |

**The apex** (`loopital.com`, no subdomain) cannot be a CNAME — DNS forbids it
at a zone apex. Use Hostinger's URL-forwarding / redirect feature to send
`loopital.com` → `https://www.loopital.com`, which is what it already does
today.

## Live now, before any DNS

Every site is already serving on its CloudFront domain and can be tested
immediately:

| Site | URL | Distribution |
|---|---|---|
| Zina | https://d3ahwhp77h0afx.cloudfront.net | `E29ISRAWH9B0E6` |
| Loopital | https://d2ghi415n55ybx.cloudfront.net | `E1PBUW0DUIWZRH` |
| Swift | https://d1xys9q3rm8esr.cloudfront.net | `E2OEWOXKEJSP3N` |
| Pal | https://d12uk9pozt4c5w.cloudfront.net | `E3Q7WRXKSQP4SW` |
| Modus | https://duzbjy60tt1hq.cloudfront.net | `E3QUR5M6JBTA6C` |

## Status after attaching (2026-08-19)

| Domain | Certificate | Alias attached | Live |
|---|---|---|---|
| `zina.loopital.com` | ISSUED | yes | **yes — HTTPS 200** |
| `pal.loopital.com` | ISSUED | yes | needs the CNAME |
| `modus.loopital.com` | ISSUED | yes | needs the CNAME |
| `loopital.com` | ISSUED | **blocked** | no |
| `www.loopital.com` | ISSUED | **blocked** | no |
| `swift.loopital.com` | ISSUED | **blocked** | no |
| `beacon.loopital.com` | pending | n/a (Amplify) | no |

## The three blocked names

`loopital.com`, `www.loopital.com` and `swift.loopital.com` fail to attach with:

```
CNAMEAlreadyExists: One or more of the CNAMEs you provided are
already associated with a different resource.
```

Nothing in **this** account holds them — all five distributions here were listed
and only zina/pal/modus have aliases. The names are still claimed by CloudFront
distributions in the **old, suspended AWS account**, which is exactly the set of
domains that account served. CloudFront refuses to let two distributions claim
the same CNAME, across accounts included, and a suspended account's
distributions do not release their claims.

The subdomains that *did* attach — zina, pal, modus — are the ones that were
never on CloudFront in the old account.

**This needs AWS Support.** They can release a CNAME held by an account you no
longer control, given proof you own the domain. Open a case under
*Account and billing → Service: CloudFront → Alternate domain names*, quote the
error, and list the three names plus the old account id if you have it. Proof of
ownership is usually a TXT record they will ask you to add — which you can do at
Hostinger.

Until then those three stay on Render, which is where they currently work:
`loopital.com` and `www` resolve to Render, and `swift.loopital.com` likewise.
Nothing is broken; the AWS copies simply sit unused on their CloudFront domains.

## Step 3 — attach each alias once its certificate is ISSUED

```sh
aws acm list-certificates --region us-east-1 \
  --query 'CertificateSummaryList[].[DomainName,Status]' --output table

# then per distribution: fetch config, add Aliases + ViewerCertificate, update
aws cloudfront get-distribution-config --id <DIST_ID> > d.json
#   Aliases:           { "Quantity": 1, "Items": ["swift.loopital.com"] }
#   ViewerCertificate: { "ACMCertificateArn": "<arn>", "SSLSupportMethod": "sni-only",
#                        "MinimumProtocolVersion": "TLSv1.2_2021" }
aws cloudfront update-distribution --id <DIST_ID> \
  --distribution-config file://d.json --if-match <ETag>
```

Tell me when they're issued and I'll do this pass.

## What each site talks to

The frontends are on AWS; their backends are still on Render. The API base is
baked in at build time, so it is fixed per build, not per environment.

| Site | Backend it calls | Working? |
|---|---|---|
| Zina | `loopital-api-fra.onrender.com` | yes |
| Loopital | `loopital-api-fra.onrender.com` | yes |
| Swift | `swift-api-cxfi.onrender.com/api/v1` | yes |
| Pal | `pal-api-bypy.onrender.com/v1` | yes |
| Modus | `hj929wm2mk.execute-api.us-east-1.amazonaws.com` | **no — dead** |

**Modus has no live backend.** Its default API base points at an API Gateway on
the old, suspended AWS account. The frontend will load and then fail every
request until a Modus API is deployed somewhere and the site is rebuilt with
`VITE_API_BASE` pointing at it.

## Beacon — hosting created, still needs a database

`beacon.loopital.com` is **Next.js 16 with server actions, API routes and
Prisma**, so it cannot be a static site: there is no `dist/` to put in a bucket,
and `output: "export"` would break authentication, the payment webhooks and
every server action.

An **Amplify Hosting** app has been created for it (Amplify supports Next SSR
and bills per request rather than per hour):

| | |
|---|---|
| App id | `d2em8xn2cx0h33` |
| Branch | `main` (platform `WEB_COMPUTE`) |
| Domain | `beacon.loopital.com`, status `PENDING_VERIFICATION` |

Amplify issues and renews its own certificate, so it needs its own two records —
these are **not** the CloudFront ones:

| Type | Host | Value |
|---|---|---|
| CNAME | `_fbb4bf28a906f019e956c5c433af784b` | `_117a40da6951dfc0d2d3b2c24709e043.jkddzztszm.acm-validations.aws.` |
| CNAME | `beacon` | `d1tul2pfahlhr9.cloudfront.net` |

**It still will not serve, because Beacon has no database.** Its `.env` carries a
placeholder (`postgresql://user:pass@host:5432/beacon`) and local development
runs on SQLite — Beacon has never been deployed to production anywhere. Before
it can start it needs:

1. A Postgres. On a new AWS account RDS `db.t4g.micro` is free for 12 months
   (~$15/month after), or Supabase/Neon have free tiers that need no VPC work.
2. `prisma migrate deploy` run against it.
3. Env vars set on the Amplify branch: `DATABASE_URL`, `DATABASE_PROVIDER`,
   `AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `APP_URL`, `ZINA_OPS_SECRET`,
   `LOOPITAL_API_URL`, `LOOPITAL_PAYSTACK_SECRET_KEY`.
4. A first deployment — either connect the GitHub repo in the Amplify console
   (an OAuth flow, so it needs a person) or push a manual `.amplify-hosting`
   bundle.

Provisioning a database is a cost and data-residency decision, so it is not
something to do silently. Say which you want and it takes one pass.

## The original note on why Beacon is not static

`beacon.loopital.com` is **Next.js 16 with server actions, API routes and
Prisma**. It is not a static site — there is no `dist/` to put in a bucket, and
`output: "export"` would break authentication, the payment webhooks and every
server action. It needs a Node server.

The cheap option on this account is **AWS Amplify Hosting**, which supports
Next SSR and bills per request rather than per hour (an ALB is ~$18/month
before compute). Amplify is available on this account — I confirmed it — but
creating an app requires connecting the GitHub repo through an OAuth flow in
the console, which needs a human. Once connected:

- Repo `github.com/uncletuas/beacon`, branch `main`
- Amplify auto-detects Next.js; no build config needed
- Set `DATABASE_URL`, `AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `ZINA_OPS_SECRET`,
  `LOOPITAL_API_URL`, `APP_URL` in Amplify → Environment variables
- Beacon still needs a Postgres. It currently has none on this account.

Beacon also needs an RDS instance or an external Postgres before it will start
at all — that is the same backend-migration decision as the rest, not a hosting
detail.

## Redeploying any site

```sh
# from the site's repo, with its own API base
VITE_API_BASE_URL="<backend>" npm run build

aws s3 sync dist/assets s3://<bucket>/assets \
  --cache-control "public,max-age=31536000,immutable"
aws s3 sync dist s3://<bucket> --exclude "assets/*" \
  --cache-control "no-cache,must-revalidate" --delete
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

The two-pass sync is deliberate: hashed asset filenames are immutable and cached
for a year, while `index.html` is never cached — so a deploy takes effect at
once and never serves a stale shell pointing at assets that no longer exist.

`scratchpad/deploy-site.sh` does all of this and is idempotent; re-running it
against an existing bucket re-uploads and invalidates rather than creating a
second distribution.

## Cost

Five CloudFront distributions + five S3 buckets at this traffic is roughly
**$1–3/month total**, mostly CloudFront requests. `PriceClass_100` (North
America + Europe edges only) keeps it at the cheaper tier; if most users are in
Nigeria, moving to `PriceClass_All` adds African edge locations and a little
cost.

## Security

The credentials used to build this are **root access keys**
(`arn:aws:iam::703592322789:root`). Delete them and issue a scoped IAM user:

```sh
aws iam delete-access-key --access-key-id AKIA2HUK623SY4GDU45Q
```
