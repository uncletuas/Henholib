#!/usr/bin/env node
"use strict";

const cdk = require("aws-cdk-lib");
const { LoopitalStack } = require("../lib/loopital-stack");

const app = new cdk.App();

new LoopitalStack(app, "LoopitalStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "eu-north-1",
  },
  description: "Loopital marketing site (S3+CloudFront) and auth API (Lambda + Aurora Serverless v2).",
});
