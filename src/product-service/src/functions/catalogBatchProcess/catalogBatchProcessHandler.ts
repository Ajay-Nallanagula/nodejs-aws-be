import { bulkCreateProduct, sendProductsEmail } from "./../utils/productUtils";
import { HTTPSTATUSCODES } from "../utils/productConstants";
import { formatJSONResponse } from "./../../libs/apiGateway";
import { middyfy } from "@libs/lambda";

const catalogBatchProcessHandler = async (event) => {
  console.log({ event });
  console.log({ Records: event.Records });

  if (!event.Records?.length) {
    return await formatJSONResponse(
      { message: "OOPS!, Something went wrong Reading the QUEUE" },
      HTTPSTATUSCODES.INTERNALERROR
    );
  }
  try {
    const results = await bulkCreateProduct(event.Records);
    console.log({ results });

    //Send an email with list of products created ajay_nallanagula1@epam.com
    const publishedResponses = await sendProductsEmail(results);

    const httpResponse = {
      message:
        "Message coming from catalogBatchProcessHandler!!!".toUpperCase(),
      publishedResponses,
      results,
    };
    console.log("CATALOG_BATCH_PROCESS_SUCCESSFUL", { httpResponse });
    return await formatJSONResponse(httpResponse, HTTPSTATUSCODES.OK);
  } catch (error) {
    console.error(error);
    return await formatJSONResponse(
      {
        message: "OOPS!! SOMETHING WENT WRONG.",
        error,
      },
      HTTPSTATUSCODES.INTERNALERROR
    );
  }
};
export const main = middyfy(catalogBatchProcessHandler);
