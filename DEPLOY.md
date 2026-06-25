# Loopital — AWS Deployment Guide

This document describes how the loopital.com marketing site and its
authentication API are hosted on AWS, and how to deploy, migrate, and operate them.

## Architecture

```
                         ┌──────────────────────────────┐
   Browser ── HTTPS ──►  │          CloudFront          │
                         │  (CDN, TLS, SPA fallback)    │
                         └───────┬───────────────┬──────┘
                     default /*  │               │  /api/*
                                 ▼               ▼
                       ┌──────────────┐   ┌─────────────────┐
                       │  S3 (private)│   │ API Gateway      │
                       │  static site │   │ HTTP API         │
                       │  (OAC)       │   └────────┬─────────┘
                       └──────────────┘            │
                                                   ▼
                                          ┌─────────────────┐
                                          │ Lambda (auth)    │
                                          │ JWT + bcrypt     │
                                          └────────┬─────────┘
                                              RDS Data API
                                                   ▼
                                          ┌─────────────────┐
                                          │ Aurora Serverless│
                                          │ v2 PostgreSQL    │
                                          └─────────────────┘
       Secrets Manager: DB credentials + JWT signing secret
```

- **Frontend**: Vite/React SPA built to `dist/`, stored in a private S3 bucket,
  served through CloudFront with Origin Access Control. Client-side routes fall
  back to `index.html` (403/404 → 200 `/index.html`).
- **API**: The browser calls `/api/*` on the **same origin**. CloudFront routes
  `/api/*` to an API Gateway HTTP API, which invokes a single Node.js Lambda.
  Because it's same-origin, there is **no CORS** in the browser.
- **Auth**: `POST /api/auth/signup`, `POST /api/auth/signin`, `GET /api/auth/me`.
  Passwords are hashed with bcrypt; sessions are stateless JWTs (7‑day expiry).
- **Database**: Aurora Serverless v2 PostgreSQL accessed via the **RDS Data API**,
  so the Lambda needs no VPC wiring. Credentials and the JWT signing key live in
  AWS Secrets Manager.

All infrastructure is defined as code with the AWS CDK in [`infra/`](infra/).

## Prerequisites

- Node.js 18+ and npm
- AWS credentials with permissions to deploy (configured via `~/.aws/credentials`
  or environment variables). Region defaults to `eu-north-1`.

## First-time deploy

```bash
# 1. Build the frontend (the CDK uploads ./dist)
npm install
npm run build

# 2. Install infra + Lambda dependencies
cd infra
npm install
cd lambda && npm install --omit=dev && cd ..

# 3. Bootstrap the AWS environment (once per account/region)
npx cdk bootstrap aws://<ACCOUNT_ID>/eu-north-1

# 4. Deploy everything
npm run deploy          # writes stack outputs to infra/outputs.json

# 5. Create the database schema (one time, and after schema changes)
npm run migrate
```

After deploy, `infra/outputs.json` contains:

| Output           | Meaning                                            |
| ---------------- | -------------------------------------------------- |
| `SiteURL`        | Public CloudFront URL of the site                  |
| `DistributionId` | CloudFront distribution id (for invalidations)     |
| `BucketName`     | S3 bucket holding the built site                   |
| `ApiEndpoint`    | API Gateway endpoint (proxied via CloudFront)      |
| `ClusterArn`     | Aurora cluster ARN (used by the migration script)  |
| `DbSecretArn`    | Secrets Manager ARN for the DB master credentials  |

## Redeploying

```bash
npm run build          # from repo root, rebuild the site
cd infra && npm run deploy
```

`BucketDeployment` re-uploads `dist/` and invalidates CloudFront automatically.

## Custom domain (loopital.com)

The stack ships with the default CloudFront domain. To serve `loopital.com`:

1. Request/validate an ACM certificate for `loopital.com` (and `www`) in
   **us-east-1** (CloudFront requires certs in us-east-1).
2. Add `domainNames` + `certificate` to the `Distribution` in
   [`infra/lib/loopital-stack.js`](infra/lib/loopital-stack.js) and redeploy.
3. Point the apex/`www` DNS records at the CloudFront distribution
   (Route 53 alias, or a CNAME/ALIAS at your registrar).

> `stack62.loopital.com` and `sart34.loopital.com` are separate apps hosted
> elsewhere — they are not managed by this stack.

## Cost notes

- **Aurora Serverless v2** is configured for **scale-to-zero**
  (`serverlessV2MinCapacity: 0`, auto-pause after 300s idle). It costs ~$0 while
  paused; the first request after idle pays a short (~15s) resume latency.
  Storage is still billed (a few cents/GB‑month). To keep it always-warm instead,
  raise `serverlessV2MinCapacity` to `0.5` (~$43/month).
- **CloudFront + S3 + Lambda + API Gateway** are pay-per-use and effectively
  free at low traffic.

## Teardown

```bash
cd infra && npm run destroy
```

The S3 site bucket auto-empties and deletes. The Aurora cluster has a
`SNAPSHOT` removal policy, so a final snapshot is taken on delete (delete the
snapshot manually to stop storage charges).

## Security follow-ups

- The initial deploy used **root** access keys. Replace them with a dedicated IAM
  user/role scoped to the needed services, and delete the root access keys.
- Rotate the Secrets Manager secrets periodically.
