import { handlerPath } from "@libs/handler-resolver";

const handler = `${handlerPath(
  __dirname
)}/importHandler.importProductsFileMiddyfied`;

const httpImportGet = {
  http: {
    method: "get",
    path: "import",
    cors: true,
    authorizer: {
      type: "token",
      arn: "arn:aws:lambda:${self:provider.region}:${aws:accountId}:function:basic-authorization-service-dev-basicAuthorizer",
      resultTtlInSeconds: 0,
      //identitySource: method.request.header.Authorization //Another header can be choosen, instead of token
    },
    request: {
      parameters: {
        querystrings: { name: true },
      },
    },
    responses: {
      200: {
        description: "Successful API Response",
        // bodyType: "Imports",
      },
      404: {
        description: "SEARCHING IN MARS SERVERS, NOT FOUND ON EARTH!!!",
      },
      500: {
        description: "CONFLICTS ON EARTH, RESULTED IN INTERNAL SERVER ERROR",
      },
    },
  },
};

export default {
  handler,
  events: [httpImportGet],
};
