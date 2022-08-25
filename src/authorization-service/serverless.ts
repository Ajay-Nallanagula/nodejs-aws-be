import type { AWS } from "@serverless/typescript";

import basicAuthorizer from "@functions/basicAuthorizer";

const serverlessConfiguration: AWS = {
  service: "basic-authorization-service",
  plugins: [
    "serverless-auto-swagger",
    "serverless-offline",
    "serverless-esbuild",
    "serverless-dotenv-plugin",
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
  },
  resources: {
    Resources: {
      GatewayResponseDefault401: {
        Type: "AWS::ApiGateway::GatewayResponse",
        Properties: {
          ResponseParameters: {
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'*'",
          },
          ResponseType: "401 error",
          RestApiId: {
            Ref: "ApiGatewayRestApi",
          },
        },
      },
    },
  },
  // import the function via paths
  functions: { basicAuthorizer },
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
  },
};

module.exports = serverlessConfiguration;
