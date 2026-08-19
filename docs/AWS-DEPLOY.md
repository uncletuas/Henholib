# Zina on AWS — what exists, and what you need to add

Account **703592322789** (Letify Limited), region **us-east-1**.

## Live now

Zina is deployed and serving:

**https://d3ahwhp77h0afx.cloudfront.net** — usable immediately, no DNS needed.

| Resource | Id |
|---|---|
| S3 bucket | `zina-loopital-com` (private, CloudFront-only) |
| CloudFront distribution | `E29ISRAWH9B0E6` |
| Origin access control | `EJA8PRZS8AN07` |
| ACM certificate | `arn:aws:acm:us-east-1:703592322789:certificate/48c87388-8034-4ffe-aef5-d36702b58bfb` |

The bucket is private — only CloudFront can read it, enforced by a bucket policy
scoped to that one distribution ARN. 403 and 404 both rewrite to `/index.html`
with a 200, so deep links like `/apps/edm73` work on refresh.

## DNS — add these at Hostinger

DNS for loopital.com is at Hostinger, not Route 53 (the account has no hosted
zones). Two records, and **the Host field is the bare label** — `zina`, not
`zina.loopital.com`. That trailing-domain mistake is what broke the Pal record
before.

**1. Certificate validation** — add first; the certificate stays
`PENDING_VALIDATION` until it resolves, and CloudFront won't accept the custom
domain without it.

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME | `_a49f0965bc394a7750b5367f12e5093f.zina` | `_22ada8a4ec0e1124d99408244c90ccf0.jkddzztszm.acm-validations.aws.` | 3600 |

**2. The site itself**

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME | `zina` | `d3ahwhp77h0afx.cloudfront.net` | 3600 |

Once the certificate shows `ISSUED`, attach it to the distribution — until then
`zina.loopital.com` will serve a TLS warning because CloudFront is still on its
default certificate:

```sh
aws acm describe-certificate --certificate-arn <cert-arn> --query 'Certificate.Status'
# when ISSUED:
aws cloudfront get-distribution-config --id E29ISRAWH9B0E6 > dist.json
# add Aliases: {Quantity:1, Items:["zina.loopital.com"]} and
# ViewerCertificate: {ACMCertificateArn:<arn>, SSLSupportMethod:"sni-only",
#                     MinimumProtocolVersion:"TLSv1.2_2021"}
aws cloudfront update-distribution --id E29ISRAWH9B0E6 \
  --distribution-config file://dist.json --if-match <ETag>
```

## Redeploying Zina

```sh
VITE_API_BASE_URL="https://loopital-api-fra.onrender.com" npm run build:zina
aws s3 sync dist-zina/assets s3://zina-loopital-com/assets \
  --cache-control "public,max-age=31536000,immutable"
aws s3 sync dist-zina s3://zina-loopital-com --exclude "assets/*" \
  --cache-control "no-cache,must-revalidate" --delete
aws cloudfront create-invalidation --distribution-id E29ISRAWH9B0E6 --paths "/*"
```

The two-pass sync matters: hashed asset filenames are cached for a year, while
`index.html` is never cached, so a deploy takes effect immediately without
serving a stale shell that points at assets which no longer exist.

## What is NOT on AWS, and why

The API Zina talks to still runs on Render (`loopital-api-fra`), as do Pal and
Swift. That is deliberate, not an oversight:

- **App Runner is not subscribed on this account.** It is the service the old
  account used, and the only cheap way to run a container with a public URL.
  Without it the equivalent is ECS Fargate behind an Application Load Balancer.
- **An ALB alone is ~$18/month, before compute.** Four backends (Loopital API,
  Pal, Swift, Beacon) plus RDS Postgres and Redis lands around **$120–200/month**
  of always-on infrastructure, replacing something that currently runs free and
  works.
- **Postgres is the real migration.** Pal, Swift and Loopital share `pal-db` on
  Render. Moving them means an RDS instance, a dump/restore with downtime, and
  re-pointing every `DATABASE_URL`.

Static frontends are the part where AWS is straightforwardly better and nearly
free — hence Zina moving first. Moving the backends should be a decision with a
budget attached, not a side effect of publishing a portal.

## Security

The keys used to build this are **root access keys** (`arn:aws:iam::…:root`).
Delete them in IAM and issue a scoped user before doing anything else — root
keys cannot be limited, and their compromise is unrecoverable.

```sh
# create a scoped user for the apps, then:
aws iam delete-access-key --access-key-id AKIA2HUK623SY4GDU45Q
```

Once a scoped key exists, store it in Zina under **API keys → Object storage**
(`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`) so Swift and Modus
pick it up at startup without a redeploy.
