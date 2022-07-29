import { handlerPath } from "@libs/handler-resolver";

const handler = `${handlerPath(
  __dirname
)}/importFileParserHandler.parseImportedCsvFileMiddyfied`;

const s3FileParserEvent = {
  s3: {
    bucket: "node-aws-import-func",
    existing: true,
    event: "s3:ObjectCreated:*",
    rules: [
      {
        prefix: "uploaded/",
      },
    ],
  },
};

export default {
  handler,
  events: [s3FileParserEvent],
};
