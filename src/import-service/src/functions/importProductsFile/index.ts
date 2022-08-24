import { handlerPath } from "@libs/handler-resolver";

const handler = `${handlerPath(
  __dirname
)}/importHandler.importProductsFileMiddyfied`;

const httpImportGet = {
  http: {
    method: "get",
    path: "import",
    cors: true,
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
