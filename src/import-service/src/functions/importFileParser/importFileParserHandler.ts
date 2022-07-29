import { getS3FileObject } from "./../utils/importUtils";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";

const parseImportedCsvFile = async (event) => {
  console.log(event);
  try {
    const response = await getS3FileObject(event);
    console.log({ response });

    return formatJSONResponse({
      message: "PRODUCTS READ SUCCESSFUL",
      response,
    });
  } catch (error) {
    console.log({ error });
    return formatJSONResponse(
      {
        message: "OOP'S!! something went wrong.",
      },
      500
    );
  }
};

export const parseImportedCsvFileMiddyfied = middyfy(parseImportedCsvFile);
