# Loopital

Marketing site for Loopital — a technology company building software products,
AI solutions, and enterprise platforms (STACK62, SART34, HMS7, FMS13).

Built with **Vite + React 18 + React Router 7 + Tailwind v4**. Authentication is
backed by an **AWS Lambda + Aurora Serverless v2 PostgreSQL** API. Infrastructure
is defined with the **AWS CDK** and hosted on **S3 + CloudFront**.

## Local development

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # production build to ./dist
```

To run against a deployed API locally, set `VITE_API_BASE_URL` (e.g. the
CloudFront URL) in a `.env.local` file. By default the app calls the same-origin
`/api`, which works in production where CloudFront proxies `/api/*` to the API.

## Products

- **STACK62** — AI coworker platform (web + desktop) — https://stack62.loopital.com — account-linked
- **SART34** — AI ads & CRM (web + desktop + mobile) — https://sart34.loopital.com — account-linked
- **HMS7** — Hospital management system (web/desktop, demo-led, in-site page)
- **FMS13** — Vendor & contractor management (web/desktop, demo-led, in-site page)

A single loopital.com account is the unified identity for the account-linked
products (STACK62, SART34); their subscriptions are managed in the in-app
account portal and kept separate per product. HMS7 and FMS13 are sales/demo-led
and are not tied to a loopital account.

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full AWS architecture and deployment runbook.
Infrastructure lives in [`infra/`](infra/); the auth Lambda in
[`infra/lambda/`](infra/lambda/).

```bash
npm run build
cd infra && npm install && npm run deploy && npm run migrate
```
