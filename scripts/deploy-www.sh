#!/usr/bin/env bash
#
# Publish www.loopital.com.
#
# Run `npm run build` first. That produces dist/ and, from the prerender step,
# dist-seo/ holding one metadata-baked HTML file per route plus a manifest.
#
# Three passes, and the order matters:
#
#   1. Hashed assets, immutable for a year, NO --delete. The previous build's
#      chunks stay reachable for anyone mid-session.
#   2. Everything else, never cached, WITH --delete. This is the pass that once
#      deleted a background video that lived in the bucket but not in the repo.
#      Anything that must survive belongs in public/, which ships inside dist/.
#   3. The prerendered routes, uploaded to extensionless keys with an explicit
#      content type, since there is no extension for S3 to infer one from.
#
# Pass 3 reads the manifest through `tr -d '\r'`. Without it, Windows line
# endings leave a carriage return on the end of every key, and the objects land
# at `products/henholib\r` while CloudFront asks for `products/henholib` and
# falls back to index.html. That failure looks exactly like prerendering not
# working, so the fix lives here rather than in a comment somewhere.
set -euo pipefail

BUCKET="loopital-com-site"
DIST_ID="E1PBUW0DUIWZRH"

export AWS_MAX_ATTEMPTS="${AWS_MAX_ATTEMPTS:-12}"
export AWS_RETRY_MODE="${AWS_RETRY_MODE:-adaptive}"

if [ ! -f dist/index.html ]; then
  echo "deploy: dist/index.html missing. Run: npm run build" >&2
  exit 1
fi
if [ ! -f dist-seo/manifest.json ]; then
  echo "deploy: dist-seo/manifest.json missing. Run: npm run build" >&2
  exit 1
fi

# This machine's network intermittently drops bucket-scoped S3 calls. It is not
# an auth problem; retrying clears it.
retry() {
  local n=0
  until "$@"; do
    n=$((n + 1))
    if [ "$n" -ge 5 ]; then
      echo "deploy: giving up after $n attempts: $*" >&2
      return 1
    fi
    sleep 4
  done
}

echo "[1/4] hashed assets"
retry aws s3 sync dist/assets "s3://$BUCKET/assets" \
  --cache-control "public,max-age=31536000,immutable"

echo "[2/4] shell and static files"
retry aws s3 sync dist "s3://$BUCKET" \
  --exclude "assets/*" \
  --cache-control "no-cache,must-revalidate" \
  --delete

echo "[3/4] prerendered routes"
python -c "
import json
for r in json.load(open('dist-seo/manifest.json')):
    print(r['file'] + '|' + r['key'])
" | tr -d '\r' | while IFS='|' read -r file key; do
  [ -z "$key" ] && continue
  retry aws s3 cp "dist-seo/$file" "s3://$BUCKET/$key" \
    --content-type "text/html; charset=utf-8" \
    --cache-control "no-cache,must-revalidate" </dev/null >/dev/null
  echo "      /$key"
done

echo "[4/4] invalidating"
retry aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" >/dev/null
echo "done. https://www.loopital.com/"
