import type { AWS } from "@serverless/typescript";

import importProductsFile from "@functions/importProductsFile";
import importFileParser from "@functions/importFileParser";

const serverlessConfiguration: AWS = {
  service: "import-service",
  frameworkVersion: "3",
  plugins: [
    "serverless-auto-swagger",
    "serverless-offline",
    "serverless-esbuild",
    "serverless-ssm-fetch",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "ap-south-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: "s3:ListBucket",
        Resource: "arn:aws:s3:::node-aws-import-func",
      },
      {
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:PutObject"],
        //Resource can also be array, multiple resources ["arn:aws:s3:::node-aws-import-func/*"]
        Resource: "arn:aws:s3:::node-aws-import-func/*",
      },
      {
        Effect: "Allow",
        Action: ["sqs:SendMessage"],
        Resource: "arn:aws:sqs:ap-south-1:630402272979:catalogItemsQueue",
      },
    ],
  },

  /*
  //To enable Cors using serverless s3 bucket creation
  resources: {
    Resources: {
      NodeAWSImportFuncBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "node-aws-import-func",
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT"],
                AllowedOrigins: ["*"],
              },
            ],
          },
        },
      },
    },
  },*/

  // import the function via paths
  functions: { importProductsFile, importFileParser },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk", "pg-native"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
    autoswagger: {
      //typefiles: ["./src/types/product.d.ts"],
      apiType: "http",
      basePath: "/dev",
    },
    serverlessSsmFetch: {
      SQS_QUEUE_URL_VALUE: "/dev/sqs/shopifyAppSSMParameterQueueName",
    },
    client: {},
  },
};

module.exports = serverlessConfiguration;
