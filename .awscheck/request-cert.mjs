import {
  ACMClient,
  RequestCertificateCommand,
  DescribeCertificateCommand,
  ListCertificatesCommand,
} from "@aws-sdk/client-acm";

// CloudFront certs MUST live in us-east-1.
const acm = new ACMClient({ region: "us-east-1" });
const DOMAIN = "loopital.com";
const SANS = ["www.loopital.com"];

// Reuse an existing cert for this domain if one was already requested.
async function findExisting() {
  const r = await acm.send(
    new ListCertificatesCommand({ CertificateStatuses: ["PENDING_VALIDATION", "ISSUED"] })
  );
  return (r.CertificateSummaryList || []).find((c) => c.DomainName === DOMAIN);
}

let arn;
const existing = await findExisting();
if (existing) {
  arn = existing.CertificateArn;
  console.log("Reusing existing certificate:", arn);
} else {
  const req = await acm.send(
    new RequestCertificateCommand({
      DomainName: DOMAIN,
      SubjectAlternativeNames: SANS,
      ValidationMethod: "DNS",
    })
  );
  arn = req.CertificateArn;
  console.log("Requested new certificate:", arn);
}

// Validation records can take a few seconds to appear.
let desc;
for (let i = 0; i < 15; i++) {
  desc = (await acm.send(new DescribeCertificateCommand({ CertificateArn: arn })))
    .Certificate;
  const opts = desc.DomainValidationOptions || [];
  if (opts.every((o) => o.ResourceRecord)) break;
  await new Promise((r) => setTimeout(r, 3000));
}

console.log("\nCERT_ARN=" + arn);
console.log("STATUS=" + desc.Status);
console.log("\n=== DNS VALIDATION RECORDS (add these at Hostinger) ===");
const seen = new Set();
for (const o of desc.DomainValidationOptions || []) {
  const rr = o.ResourceRecord;
  if (!rr || seen.has(rr.Name)) continue;
  seen.add(rr.Name);
  console.log(JSON.stringify({ for: o.DomainName, type: rr.Type, name: rr.Name, value: rr.Value }));
}
