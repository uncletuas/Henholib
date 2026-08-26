# Background footage

Drop the marketing loops in this folder. They ship as part of `dist/` and are
therefore covered by the deploy, which is the whole point of keeping them here.

Expected files, referenced from the components by these exact names:

| file | used by |
|---|---|
| `commitment.mp4` | `CommitmentSection` — the full-bleed band |
| `hero.mp4` | `HomePage` hero wash (optional) |

They were previously uploaded straight to S3 under `media/`, outside the repo.
A deploy syncs `dist/` with `--delete`, so anything living in the bucket but not
in `dist/` gets removed on the next publish. That is exactly how the original
clip was lost. Keep footage here and that cannot happen again.

Keep each file under ~8MB. They are `preload="none"` with a poster, so they
never block first paint.
