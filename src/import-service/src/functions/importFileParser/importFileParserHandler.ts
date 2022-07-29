import { getS3FileObject } from "./../utils/importUtils";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";

const parseImportedCsvFile = async (event) => {
  console.log(event);
  try {
    const data = await getS3FileObject(event);
    console.log({ data });
    return await formatJSONResponse({
      message: "PRODUCTS READ SUCCESSFUL",
      data,
    });
  } catch (error) {
    console.log({ error });
    return await formatJSONResponse(
      {
        message: "OOP'S!! something went wrong.",
      },
      500
    );
  }
};

export const parseImportedCsvFileMiddyfied = middyfy(parseImportedCsvFile);
