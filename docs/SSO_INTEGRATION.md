# Loopital SSO — integration guide for STACK62 & SART34

loopital.com is the **identity provider (IdP)**. A single loopital account signs
a user into the federated apps (**STACK62**, **SART34**). HMS7 and FMS13 are
demo-led and are **not** part of this federation.

This document is the contract the STACK62 and SART34 apps implement to accept a
loopital login. The loopital side (token minting + handoff + exchange) is already
built and live.

## Flow

```
loopital.com (user signed in)
  │  clicks "Launch STACK62" / "Open app"
  │  POST /api/sso/token  (Authorization: Bearer <loopital session JWT>)
  │      body: { product: "stack62" | "sart34" }
  │      ← { ssoToken, expiresIn: 120 }
  ▼
redirect → https://stack62.loopital.com/sso?token=<ssoToken>     (new tab)
  ▼
PRODUCT APP  (the part you implement)
  1. Read `token` from the query string on /sso.
  2. Server-side, call loopital exchange:
       POST https://loopital.com/api/sso/exchange
       body: { token, product: "stack62" }
       ← { user: { id, name, email } }      (401 if invalid/expired)
  3. Find-or-create a local user keyed by `user.id` (the loopital user id),
     storing name/email. This is the link between the loopital identity and
     the app's own database.
  4. Establish your app's normal session for that user and redirect into the app.
```

The SSO token is a JWT, **audience-bound** to the product and **valid for 120s** —
treat it as single-use and never store it. Exchange it immediately, server-side.

## loopital endpoints (already live)

Base URL: `https://loopital.com/api` (same API the marketing site uses).

### `POST /sso/token`  — mint (called by loopital, for reference)
- Auth: `Authorization: Bearer <loopital session JWT>`
- Body: `{ "product": "stack62" | "sart34" }`
- 200: `{ "ssoToken": "<jwt>", "expiresIn": 120 }`

### `POST /sso/exchange`  — **you call this**
- No auth header; the short-lived `token` is the credential.
- Body: `{ "token": "<ssoToken>", "product": "stack62" | "sart34" }`
- 200: `{ "user": { "id": "<uuid>", "name": "...", "email": "..." } }`
- 401: invalid / expired / wrong-audience token.

## What each app must add
1. A `/sso` route that reads `?token=` and runs steps 2–4 above.
2. A server endpoint (or server action) that calls `/sso/exchange` — do **not**
   exchange from the browser; keep it server-to-server.
3. A `users` link: a column/table mapping your local account to the loopital
   `user.id` so repeat logins resolve to the same account.

## Notes / hardening (optional for v1)
- For stronger guarantees we can add a per-app client secret to `/sso/exchange`
  (shared secret check) and rotate the JWT signing key via JWKS. Say the word and
  I'll add it on both sides.
- Same-domain cookies: because all apps are on `*.loopital.com`, we can later add
  a shared-cookie/session option for fully silent SSO. The token handoff above
  works regardless of cookie strategy.
