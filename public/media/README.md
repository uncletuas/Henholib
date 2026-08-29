# Site media

Everything the marketing site displays lives here. These ship as part of `dist/`
and are therefore covered by the deploy, which is the whole point of keeping
them in the repo.

They were previously uploaded straight to S3 under `media/`, outside the repo.
A deploy syncs `dist/` with `--delete`, so anything living in the bucket but not
in `dist/` gets removed on the next publish. That is exactly how the original
background clip was lost. Keep media here and that cannot happen again.

## Product screenshots

Supplied by the founder. Do not re-crop, re-colour or regenerate them — the
homepage phone rotation is meant to show the real app exactly as shipped.

| file | used by |
|---|---|
| `henholib-home.jpg` `henholib-care.jpg` `henholib-health.jpg` `henholib-profile.jpg` `henholib-sos.jpg` `henholib-wallet.jpg` | `HenholibShowcase` — the rotating phone in the hero |
| `mission-bg.jpg` | `CommitmentSection` — the full-bleed band |

## Photography

Pexels, free for commercial use, no attribution required. Every one was viewed
before being committed rather than trusted from its search terms, and every one
features Black subjects — this is a Nigerian company and the site should look
like it.

Two rules learned the hard way when picking replacements:

- **No legible branding of a real institution.** A named hospital or company on
  a product landing page reads as a customer logo, which would be a claim we
  cannot make. Two otherwise good frames were dropped for exactly this.
- **Nothing referencing blood**, including signage inside the frame. One
  candidate carried a "Banco de Sangre" sign in the background.

| file | used by |
|---|---|
| `family-newborn.jpg` | Henholib hero |
| `care-ward.jpg` | Henholib split |
| `clinic-team.jpg` | HMS7 hero |
| `ward-visit.jpg` | HMS7 split |
| `school-students.jpg` | Beacon hero, product card |
| `school-study.jpg` | Beacon split |
| `tower-lagos.jpg` | Modus hero, product card |
| `facility-engineer.jpg` | Modus split, Insights |
| `mother-child.jpg` `doctor-tablet.jpg` `office-meeting.jpg` | product cards |
| `office-focus.jpg` | Careers, Insights |
| `lagos-skyline.jpg` | About, Insights |
| `doctor-portrait.jpg` `support-desk.jpg` | Insights |

## Video

Keep each file under ~8MB. Clips are `preload="none"` with a poster, so they
never block first paint.
