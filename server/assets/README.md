# Server-side assets

Files here are served **through the API, behind a gate** — never from the CDN.

`loopital-team-handbook.pdf` is the one that matters. It is not in `public/`
on purpose: anything in `public/` ships to CloudFront and is downloadable by
anyone who guesses the URL, and this handbook contains the salary and equity
policy, the real SWOT including the uncomfortable half, the funding stage, and
the product hierarchy. Section 9 of the portal spec is explicit that files must
never be publicly addressable, and the handbook is only meant to be reachable
once someone has finished onboarding.

It is served by `GET /onboarding/handbook.pdf`, which requires a signed-in team
member whose form is complete.
