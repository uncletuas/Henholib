import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

const region = process.env.AWS_REGION || "eu-north-1";
const sts = new STSClient({ region });
try {
  const id = await sts.send(new GetCallerIdentityCommand({}));
  console.log("OK region=" + region);
  console.log("Account=" + id.Account);
  console.log("Arn=" + id.Arn);
} catch (e) {
  console.log("FAIL: " + e.name + " - " + e.message);
  process.exit(2);
}
