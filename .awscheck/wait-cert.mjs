import { ACMClient, DescribeCertificateCommand } from "@aws-sdk/client-acm";
const acm = new ACMClient({ region: "us-east-1", maxAttempts: 5 });
const arn = process.argv[2];
const once = process.argv[3] === "--once";
for (;;) {
  try {
    const c = (await acm.send(new DescribeCertificateCommand({ CertificateArn: arn }))).Certificate;
    if (c.Status === "ISSUED") { console.log("CERT_ISSUED"); break; }
    if (c.Status !== "PENDING_VALIDATION") { console.log("CERT_STATUS_" + c.Status); break; }
    if (once) { console.log("CERT_PENDING_VALIDATION"); break; }
  } catch (e) {
    // transient network/DNS error — keep waiting
    if (once) { console.log("CHECK_ERROR " + e.code); break; }
  }
  await new Promise((r) => setTimeout(r, 30000));
}
