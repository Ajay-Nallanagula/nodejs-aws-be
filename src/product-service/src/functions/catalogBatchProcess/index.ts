import { handlerPath } from "@libs/handlerResolver";

const sqsTriggerEvent = {
  sqs: {
    arn: {
      "Fn::GetAtt": ["CatalogItemsQueue", "Arn"],
    },
    batchSize: 5,
    maximumBatchingWindow: 30,
  },
};

export default {
  handler: `${handlerPath(__dirname)}/catalogBatchProcessHandler.main`,
  events: [sqsTriggerEvent],
};
