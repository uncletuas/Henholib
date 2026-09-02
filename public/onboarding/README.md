# Onboarding public assets

Deliberately empty.

The handbook is **not** here. Anything in `public/` ships to CloudFront and is
downloadable by anyone who guesses the URL, and the Loopital Handbook carries
the salary and equity policy, the real SWOT, and the funding position. It lives
in `server/assets/` and is served by `GET /onboarding/handbook.pdf`, which
requires a signed-in team member whose onboarding form is complete.

Section 9 of the portal spec: "Private file storage with signed, expiring URLs.
Files must never be publicly addressable."
