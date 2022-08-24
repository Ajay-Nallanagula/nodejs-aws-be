import { getPreSignedUrl } from "../utils/importUtils";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";

const importProductsFile = async (event) => {
  console.log({ event });
  const { queryStringParameters } = event;

  if (!queryStringParameters || !queryStringParameters.name) {
    return await formatJSONResponse(
      {
        message: "OOPS!! Something went wrong",
        event,
      },
      500
    );
  }

  //generate Presigned URL here
  try {
    const preSignedPutUrl = await getPreSignedUrl(queryStringParameters.name);
    console.log({ preSignedPutUrl });
    return await formatJSONResponse({
      preSignedPutUrl,
    });
  } catch (error) {
    console.log({ error });
    return await formatJSONResponse(
      { message: "OOPS!! Something went wrong" },
      500
    );
  }
};

export const importProductsFileMiddyfied = middyfy(importProductsFile);
