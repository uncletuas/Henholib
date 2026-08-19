#!/usr/bin/env bash
# Publish one built static site to S3 + CloudFront on the Letify AWS account.
#
#   deploy-site.sh <bucket> <dist-dir> <comment> [extra-alias]
#
# Idempotent: re-running against an existing bucket/distribution re-uploads and
# invalidates rather than creating duplicates. Every AWS call is retried because
# this machine's network intermittently fails to resolve bucket-scoped and
# regional endpoints — that failure looks like an auth error but isn't.
set -uo pipefail

BUCKET="$1"; DIST="$2"; COMMENT="$3"; DOMAIN="${4:-}"
ACCOUNT=703592322789
WIN_SP='C:\Users\USER\AppData\Local\Temp\claude\c--Users-USER-Downloads-loopital-com\cd4e7f79-5a01-4ea6-a892-d81e9d5b44ab\scratchpad'
SP="/c/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Downloads-loopital-com/cd4e7f79-5a01-4ea6-a892-d81e9d5b44ab/scratchpad"

export AWS_DEFAULT_REGION=us-east-1
export AWS_MAX_ATTEMPTS=10

r() { local o; for i in 1 2 3 4 5 6 7 8; do o=$("$@" 2>&1) && { printf '%s' "$o"; return 0; }; sleep 4; done; printf '%s' "$o"; return 1; }

say() { echo "  $*"; }

[ -d "$DIST" ] || { echo "!! $DIST does not exist — build it first"; exit 1; }

echo "=== $BUCKET ==="

# 1. Bucket (private; CloudFront reads it through OAC)
if r aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
  say "bucket exists"
else
  r aws s3api create-bucket --bucket "$BUCKET" >/dev/null && say "bucket created"
fi
r aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" >/dev/null

# 2. Upload. Two passes: hashed assets cached for a year, entry files never —
#    so a deploy takes effect at once without serving a stale index.html that
#    references assets which no longer exist.
if [ -d "$DIST/assets" ]; then
  r aws s3 sync "$DIST/assets" "s3://$BUCKET/assets" \
    --cache-control "public,max-age=31536000,immutable" --only-show-errors >/dev/null && say "assets uploaded"
fi
r aws s3 sync "$DIST" "s3://$BUCKET" --exclude "assets/*" \
  --cache-control "no-cache,must-revalidate" --delete --only-show-errors >/dev/null && say "entry files uploaded"

# 3. Reuse an existing distribution for this bucket if there is one.
ORIGIN="$BUCKET.s3.us-east-1.amazonaws.com"
DISTID=$(r aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[0].DomainName=='$ORIGIN'].Id | [0]" --output text)

if [ -n "$DISTID" ] && [ "$DISTID" != "None" ]; then
  say "distribution exists: $DISTID"
else
  OAC=$(r aws cloudfront create-origin-access-control --origin-access-control-config \
    "Name=$BUCKET-oac-$(date +%s),Description=$COMMENT,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
    --query 'OriginAccessControl.Id' --output text)
  say "OAC $OAC"

  cat > "$SP/cf-$BUCKET.json" <<JSON
{
  "CallerReference": "$BUCKET-$(date +%s)",
  "Comment": "$COMMENT",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": { "Quantity": 1, "Items": [{
    "Id": "s3", "DomainName": "$ORIGIN",
    "OriginAccessControlId": "$OAC",
    "S3OriginConfig": { "OriginAccessIdentity": "" }
  }]},
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] } },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "CustomErrorResponses": { "Quantity": 2, "Items": [
    { "ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 0 },
    { "ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 0 }
  ]},
  "PriceClass": "PriceClass_100"
}
JSON
  OUT=$(r aws cloudfront create-distribution --distribution-config "file://$WIN_SP\\cf-$BUCKET.json")
  DISTID=$(printf '%s' "$OUT" | python -c "import sys,json;print(json.load(sys.stdin)['Distribution']['Id'])" 2>/dev/null)
  [ -z "$DISTID" ] && { echo "!! could not create distribution:"; printf '%s\n' "$OUT" | head -15; exit 1; }
  say "distribution created: $DISTID"

  cat > "$SP/pol-$BUCKET.json" <<JSON
{ "Version": "2012-10-17", "Statement": [{
  "Sid": "AllowCloudFrontRead", "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject", "Resource": "arn:aws:s3:::$BUCKET/*",
  "Condition": { "StringEquals": {
    "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT:distribution/$DISTID" }}}]}
JSON
  r aws s3api put-bucket-policy --bucket "$BUCKET" --policy "file://$WIN_SP\\pol-$BUCKET.json" >/dev/null && say "bucket policy applied"
fi

CFDOMAIN=$(r aws cloudfront get-distribution --id "$DISTID" --query 'Distribution.DomainName' --output text)
r aws cloudfront create-invalidation --distribution-id "$DISTID" --paths "/*" >/dev/null && say "cache invalidated"

# 4. Certificate, if this site has a custom domain.
CERTARN=""; VALNAME=""; VALVALUE=""
if [ -n "$DOMAIN" ]; then
  CERTARN=$(r aws acm list-certificates --certificate-statuses PENDING_VALIDATION ISSUED \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn | [0]" --output text)
  if [ -z "$CERTARN" ] || [ "$CERTARN" = "None" ]; then
    CERTARN=$(r aws acm request-certificate --domain-name "$DOMAIN" \
      --validation-method DNS --key-algorithm RSA_2048 --query CertificateArn --output text)
    sleep 8
  fi
  REC=$(r aws acm describe-certificate --certificate-arn "$CERTARN" \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord' --output json)
  VALNAME=$(printf '%s' "$REC" | python -c "import sys,json;print(json.load(sys.stdin)['Name'])" 2>/dev/null)
  VALVALUE=$(printf '%s' "$REC" | python -c "import sys,json;print(json.load(sys.stdin)['Value'])" 2>/dev/null)
  say "cert $CERTARN"
fi

echo "$BUCKET|$DISTID|$CFDOMAIN|$DOMAIN|$VALNAME|$VALVALUE|$CERTARN" >> "$SP/deployed.txt"
echo "  --> https://$CFDOMAIN"
echo
