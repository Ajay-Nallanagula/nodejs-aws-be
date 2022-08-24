import { HTTPSTATUSCODES } from "./constants";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { isTokenValid } from "./utils";

const basicAuthorizerHandler = async (event) => {
  try {
    const { authorizationToken, methodArn } = event;

    if (!authorizationToken) {
      return formatJSONResponse(
        {
          message: `UNAUTHORIZED, TOKEN MISSING!!`,
        },
        HTTPSTATUSCODES.UNAUTH
      );
    }

    if (!isTokenValid(authorizationToken)) {
      return formatJSONResponse(
        {
          message: `FORBIDDEN, WRONG TOKEN!!`,
        },
        HTTPSTATUSCODES.FORBIDDEN
      );
    }
    console.log("************ SUCCESS *****************");
    return formatJSONResponse({
      message: `AUTHENTICATION IS SUCESSFULL!!!`,
      methodArn,
    });
  } catch (error) {
    return formatJSONResponse(
      {
        message: `Internal Server error`,
        error,
      },
      HTTPSTATUSCODES.INTERNALERROR
    );
  }
};

export const basicAuthorizerHandlerMiddyFied = middyfy(basicAuthorizerHandler);
