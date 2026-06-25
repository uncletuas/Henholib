import { RDSClient, DescribeDBEngineVersionsCommand } from "@aws-sdk/client-rds";
const c = new RDSClient({ region: "eu-north-1" });
let marker, all = [];
do {
  const r = await c.send(new DescribeDBEngineVersionsCommand({
    Engine: "aurora-postgresql", Marker: marker, MaxRecords: 100,
  }));
  all.push(...(r.DBEngineVersions || []));
  marker = r.Marker;
} while (marker);

const rows = all.map(v => {
  const feats = (v.SupportedFeatureNames || []);
  const dataApi = feats.includes("DataAPI") || feats.includes("data-api") || feats.includes("aurora-data-api");
  const sv2 = (v.SupportedEngineModes || []).length >= 0; // serverless v2 is instance-class based
  return { ver: v.EngineVersion, dataApi, feats: feats.join(",") };
});
// Show 14/15/16/17 latest few
const interesting = rows.filter(r => /^(14|15|16|17)\./.test(r.ver));
for (const r of interesting.slice(-40)) console.log(`${r.ver}\tDataAPI=${r.dataApi}\t[${r.feats}]`);
