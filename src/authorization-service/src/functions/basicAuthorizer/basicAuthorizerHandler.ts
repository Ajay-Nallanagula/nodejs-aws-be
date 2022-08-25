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
          message: `FORBIDDEN, WRONG CREDENTIALS`,
        },
        HTTPSTATUSCODES.FORBIDDEN
      );
    }
    console.log("************ SUCCESS *****************");
    console.log({ methodArn });
    return generatePolicy("ProdOwnerAjay", "Allow", methodArn);
  } catch (error) {
    console.log(error.stack);
    console.log({ message: error.message });
    return formatJSONResponse(
      {
        message: `Internal Server error`,
        error,
      },
      HTTPSTATUSCODES.INTERNALERROR
    );
  }
};

const generatePolicy = (principalId, effect, resource) => {
  let authResponse = { principalId: principalId };
  if (effect && resource) {
    var policyDocument = {};
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    let statementOne = {};
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  console.log({ authResponse });
  console.log(JSON.stringify(authResponse));
  return authResponse;
};

export const basicAuthorizerHandlerMiddyFied = middyfy(basicAuthorizerHandler);
