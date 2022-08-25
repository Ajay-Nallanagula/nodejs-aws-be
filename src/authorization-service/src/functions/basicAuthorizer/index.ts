import { handlerPath } from "@libs/handler-resolver";

const handler = `${handlerPath(
  __dirname
)}/basicAuthorizerHandler.basicAuthorizerHandlerMiddyFied`;

export default {
  handler,
};
