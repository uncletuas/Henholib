"""
Attach a custom domain and its ACM certificate to a CloudFront distribution.

deploy-site.sh creates the distribution and finds the certificate, but a fresh
distribution answers only on its *.cloudfront.net name: without an alias it will
refuse the custom hostname, and without the matching cert it cannot terminate
TLS for it. That left the last two steps of every restore to be done by hand in
the console, which is exactly where they get forgotten.

Idempotent. Re-running against a distribution that already carries the alias
changes nothing and exits 0, so this is safe to call on every deploy.

    python cf-attach-domain.py <distribution-id> <domain> <cert-arn>
"""

import json
import subprocess
import sys


def aws(*args):
    out = subprocess.run(
        ["aws", *args], capture_output=True, text=True, encoding="utf-8"
    )
    if out.returncode != 0:
        raise SystemExit("aws " + " ".join(args) + "\n" + out.stderr.strip())
    return out.stdout


def main():
    dist_id, domain, cert_arn = sys.argv[1], sys.argv[2], sys.argv[3]

    got = json.loads(aws("cloudfront", "get-distribution-config", "--id", dist_id))
    etag, cfg = got["ETag"], got["DistributionConfig"]

    aliases = cfg.get("Aliases", {}).get("Items", [])
    if domain in aliases and cfg.get("ViewerCertificate", {}).get(
        "ACMCertificateArn"
    ) == cert_arn:
        print("  alias already attached: " + domain)
        return

    if domain not in aliases:
        aliases.append(domain)
    cfg["Aliases"] = {"Quantity": len(aliases), "Items": aliases}

    # Replacing the whole block, not merging: CloudFront rejects a config that
    # still carries CloudFrontDefaultCertificate alongside an ACM arn.
    cfg["ViewerCertificate"] = {
        "ACMCertificateArn": cert_arn,
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021",
        "CertificateSource": "acm",
    }

    path = "cf-update-" + dist_id + ".json"
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(cfg, fh)

    aws(
        "cloudfront", "update-distribution", "--id", dist_id,
        "--distribution-config", "file://" + path, "--if-match", etag,
    )
    print("  alias attached: " + domain)


if __name__ == "__main__":
    main()
