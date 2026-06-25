import { RDSClient, DescribeDBClustersCommand } from "@aws-sdk/client-rds";
const c = new RDSClient({ region: "eu-north-1" });
const arn = "arn:aws:rds:eu-north-1:913524947630:cluster:loopitalstack-db5d02a0a9-laaplmg34852";
const r = await c.send(new DescribeDBClustersCommand({ DBClusterIdentifier: arn }));
const cl = r.DBClusters[0];
console.log(JSON.stringify({
  status: cl.Status,
  scaling: cl.ServerlessV2ScalingConfiguration,
}, null, 2));
