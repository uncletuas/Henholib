"use strict";

const path = require("path");
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const rds = require("aws-cdk-lib/aws-rds");
const lambda = require("aws-cdk-lib/aws-lambda");
const iam = require("aws-cdk-lib/aws-iam");
const secretsmanager = require("aws-cdk-lib/aws-secretsmanager");
const s3 = require("aws-cdk-lib/aws-s3");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const acm = require("aws-cdk-lib/aws-certificatemanager");
const { HttpApi, HttpMethod } = require("aws-cdk-lib/aws-apigatewayv2");
const { HttpLambdaIntegration } = require("aws-cdk-lib/aws-apigatewayv2-integrations");

const DB_NAME = "loopital";

class LoopitalStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // ── Networking ────────────────────────────────────────────────────────
    // Isolated subnets only; no NAT gateways. The auth Lambda reaches the
    // database via the RDS Data API (a public AWS endpoint), so it never
    // needs to live inside the VPC.
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "db", subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // ── Database: Aurora Serverless v2 PostgreSQL with the Data API ───────
    const dbCluster = new rds.DatabaseCluster(this, "Db", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        // 16.6 is available in eu-north-1 and supports the RDS Data API on
        // Aurora Serverless v2. Using .of() avoids depending on a specific
        // CDK constant being present.
        version: rds.AuroraPostgresEngineVersion.of("16.6", "16"),
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      writer: rds.ClusterInstance.serverlessV2("writer"),
      // Scale-to-zero: the cluster auto-pauses when idle (near-zero cost) and
      // resumes on the next query (~15s cold start). The Data API and the
      // migration script tolerate the resume latency.
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: 2,
      defaultDatabaseName: DB_NAME,
      enableDataApi: true,
      credentials: rds.Credentials.fromGeneratedSecret("loopital_admin"),
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // Pause the cluster after ~5 minutes (300s) of inactivity. 300s is the
    // minimum auto-pause window AWS allows.
    dbCluster.node.defaultChild.addPropertyOverride(
      "ServerlessV2ScalingConfiguration.SecondsUntilAutoPause",
      300
    );

    // ── JWT signing secret ────────────────────────────────────────────────
    const jwtSecret = new secretsmanager.Secret(this, "JwtSecret", {
      description: "Loopital auth API JWT signing secret",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "secret",
        passwordLength: 48,
        excludePunctuation: true,
      },
    });

    // ── Auth Lambda ───────────────────────────────────────────────────────
    const authFn = new lambda.Function(this, "AuthFn", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "lambda")),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        CLUSTER_ARN: dbCluster.clusterArn,
        SECRET_ARN: dbCluster.secret.secretArn,
        DB_NAME,
        JWT_SECRET_ARN: jwtSecret.secretArn,
      },
    });
    // Grants rds-data:* on the cluster and read access to the DB credentials.
    dbCluster.grantDataApiAccess(authFn);
    jwtSecret.grantRead(authFn);

    // ── Academy materials bucket (private; browser up/downloads via presigned URLs) ──
    // Manuals, slides, and other course files. Never public — the Lambda mints
    // short-lived presigned PUT/GET URLs. CORS allows direct browser uploads
    // from the site origins.
    const materialsBucket = new s3.Bucket(this, "MaterialsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: [
            "https://www.loopital.com",
            "https://loopital.com",
            "http://localhost:5173",
          ],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3000,
        },
      ],
    });
    materialsBucket.grantReadWrite(authFn);
    authFn.addEnvironment("MATERIALS_BUCKET", materialsBucket.bucketName);

    // ── Email (SES) — used for certificates and confirmations ─────────────
    // Permission is granted now; the sending identity (SES_FROM) must be a
    // verified SES identity, and the account needs SES production access to
    // reach non-verified recipients.
    authFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      })
    );
    authFn.addEnvironment(
      "SES_FROM",
      process.env.SES_FROM || "Loopital <noreply@loopital.com>"
    );

    // Paystack for course payments + Resend for transactional email. Provide
    // these at deploy time (see the deploy memory). Public/test values only in
    // env; nothing secret is committed.
    authFn.addEnvironment("PAYSTACK_SECRET_KEY", process.env.PAYSTACK_SECRET_KEY || "");
    authFn.addEnvironment("PAYSTACK_CALLBACK_URL", process.env.PAYSTACK_CALLBACK_URL || "https://www.loopital.com/payment/callback");
    authFn.addEnvironment("RESEND_API_KEY", process.env.RESEND_API_KEY || "");
    authFn.addEnvironment("RESEND_FROM_EMAIL", process.env.RESEND_FROM_EMAIL || "");

    // ── HTTP API (API Gateway v2) ─────────────────────────────────────────
    const httpApi = new HttpApi(this, "HttpApi", { apiName: "loopital-api" });
    const integration = new HttpLambdaIntegration("AuthIntegration", authFn);
    httpApi.addRoutes({
      path: "/api/{proxy+}",
      methods: [HttpMethod.ANY],
      integration,
    });
    httpApi.addRoutes({ path: "/api", methods: [HttpMethod.ANY], integration });

    // ── Frontend hosting: private S3 bucket fronted by CloudFront ─────────
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const apiDomain = `${httpApi.httpApiId}.execute-api.${this.region}.amazonaws.com`;

    // Optional custom domain. Provide CERT_ARN (an ACM cert in us-east-1) and
    // SITE_DOMAINS (comma-separated) to serve the site on loopital.com.
    const certArn = process.env.CERT_ARN;
    const siteDomains = (process.env.SITE_DOMAINS || "")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const certificate = certArn
      ? acm.Certificate.fromCertificateArn(this, "SiteCert", certArn)
      : undefined;

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: "Loopital marketing site",
      defaultRootObject: "index.html",
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      ...(certificate && siteDomains.length
        ? { domainNames: siteDomains, certificate }
        : {}),
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      additionalBehaviors: {
        // Same-origin API path -> API Gateway. No CORS needed in the browser.
        "/api/*": {
          origin: new origins.HttpOrigin(apiDomain),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      // SPA fallback: serve index.html for client-side routes.
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: "/index.html", ttl: cdk.Duration.minutes(5) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: "/index.html", ttl: cdk.Duration.minutes(5) },
      ],
    });

    // Upload the built frontend and invalidate the CDN on every deploy.
    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "..", "..", "dist"))],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
      prune: true,
    });

    // ── Outputs ───────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "SiteURL", {
      value: `https://${distribution.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, "DistributionId", { value: distribution.distributionId });
    new cdk.CfnOutput(this, "BucketName", { value: siteBucket.bucketName });
    new cdk.CfnOutput(this, "ApiEndpoint", { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, "ClusterArn", { value: dbCluster.clusterArn });
    new cdk.CfnOutput(this, "DbSecretArn", { value: dbCluster.secret.secretArn });
    new cdk.CfnOutput(this, "MaterialsBucketName", { value: materialsBucket.bucketName });
  }
}

module.exports = { LoopitalStack };
