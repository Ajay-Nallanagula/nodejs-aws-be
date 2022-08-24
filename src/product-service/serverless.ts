import type { AWS } from "@serverless/typescript";
import products from "@functions/products";
import catalogBatchProcess from "@functions/catalogBatchProcess";

const serverlessConfiguration: AWS = {
  service: "product-service",
  frameworkVersion: "2",
  plugins: [
    "serverless-auto-swagger",
    "serverless-offline",
    "serverless-esbuild",
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
      host: "<host>",
      port: "<Port>",
      database: "<db>",
      user: "<user>",
      password: "<pwd>",
      SQS_QUEUE_URL: { Ref: "CatalogItemsQueue" },
      SNS_PRODUCTTOPIC_ARN: {
        "Fn::Join": [
          ":",
          [
            "arn",
            "aws",
            "sns",
            { Ref: "AWS::Region" },
            { Ref: "AWS::AccountId" },
            { "Fn::GetAtt": ["CreateProductTopic", "TopicName"] },
          ],
        ],
      },
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["sqs:ListQueues", "sqs:*"],
        Resource: [
          {
            "Fn::GetAtt": ["CatalogItemsQueue", "Arn"],
          },
        ],
      },
      {
        Effect: "Allow",
        Action: ["sns:Publish"],
        Resource: "arn:aws:sns:ap-south-1:630402272979:createProductTopic",
      },
    ],
    lambdaHashingVersion: "20201221",
  },

  //To enable Cors using serverless s3 bucket creation
  resources: {
    Resources: {
      CatalogItemsQueue: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "catalogItemsQueue",
        },
      },
      ShopifyAppSSMParameterQueueName: {
        Type: "AWS::SSM::Parameter",
        Properties: {
          Name: "/dev/sqs/shopifyAppSSMParameterQueueName",
          Type: "String",
          Value: {
            // "Fn::GetAtt": ["CatalogItemsQueue", "Arn"],
            Ref: "CatalogItemsQueue",
          },
        },
      },

      CreateProductTopic: {
        Type: "AWS::SNS::Topic",
        Properties: {
          TopicName: "createProductTopic",
          DisplayName: "Shopify Products Topic Resource",
          /*
          //Inline subscription doesn't take filter policy, See AWS docs 
          //https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sns-subscription.html
          Subscription: [
            {
              Endpoint: "ajay_nallanagula1@epam.com",
              Protocol: "email",
              Filter: {
                count: [{ numeric: [">", 10] }],
              },
            },
            {
              Endpoint: "kumarnajay9@gmail.com",
              Protocol: "email",
              Filter: {
                count: [{ numeric: ["<=", 10] }],
              },
            },
          ],
          */
        },
      },
      EmailEpamSubscription: {
        Type: "AWS::SNS::Subscription",
        Properties: {
          Endpoint: "ajay_nallanagula1@epam.com",
          Protocol: "email",
          TopicArn: { Ref: "CreateProductTopic" },
          FilterPolicy: {
            title: ["A", "B", "C"],
          },
        },
      },
      EmailPersonalSubscription: {
        Type: "AWS::SNS::Subscription",
        Properties: {
          Endpoint: "kumarnajay9@gmail.com",
          Protocol: "email",
          TopicArn: { Ref: "CreateProductTopic" },
          FilterPolicy: {
            title: ["E", "F", "G"],
          },
        },
      },
    },
  },

  // import the function via paths
  functions: { products, catalogBatchProcess },
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
      typefiles: ["./src/types/product.d.ts"],
      apiType: "http",
      basePath: "/dev",
    },
  },
};

module.exports = serverlessConfiguration;
