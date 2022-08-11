import {
  HTTPMETHODS,
  PATHS,
  HTTPSTATUSCODES,
  QUERIES,
  TRANSACTIONCONSTANTS,
} from "./productConstants";
import { formatJSONResponse } from "@libs/apiGateway";
const { Client } = require("pg");
import * as AWS from "aws-sdk";

const genericCatchTrap = async (error) => {
  console.error("genericCatchTrap", error.stack);
  return await formatJSONResponse(
    { message: error.stack },
    HTTPSTATUSCODES.INTERNALERROR
  );
};

const disconnectDb = (client) => {
  if (client) {
    return client.end().then(() => {
      console.log("Db disconnected successfully!!");
    });
  }
  //client.release();
};

const connectDb = async () => {
  let isDbConnected = false;
  let client = null;
  try {
    const { host, port, user, password, database } = process.env;
    const dbConfig = {
      host,
      port,
      user,
      password,
      database,
    };
    client = new Client(dbConfig);
    await client.connect();
    return { client, isDbConnected: !isDbConnected };
  } catch (error) {
    console.error(error);
    return { error, isDbConnected };
  }
};

const getProducts = async () => {
  const postgressClient = await connectDb();
  if (!postgressClient.isDbConnected) {
    return await genericCatchTrap(postgressClient);
  }
  try {
    const { client } = postgressClient;

    const { rows: products } = await client.query(QUERIES.allProducts);
    if (!products?.length) {
      return await formatJSONResponse({ message: "No products exist" });
    }

    return await formatJSONResponse(products);
  } catch (error) {
    return await genericCatchTrap(error);
  }
};

const getProductById = async (productId) => {
  const postgressClient = await connectDb();

  if (!postgressClient.isDbConnected) {
    return await genericCatchTrap(postgressClient);
  }

  try {
    if (!productId) {
      return await formatJSONResponse(
        { message: "Product doesn't exist." },
        HTTPSTATUSCODES.NOTFOUND
      );
    }

    const { client } = postgressClient;
    const { rows: product } = await client.query(QUERIES.selectedProduct, [
      productId,
    ]);

    if (!product) {
      return await formatJSONResponse({ message: "No product exist" });
    }

    return await formatJSONResponse(product);
  } catch (error) {
    return await genericCatchTrap(error);
  }
};

const productInternalServerError = async (client) => {
  await client.query(TRANSACTIONCONSTANTS.ROLLBACK);
  return await formatJSONResponse(
    { message: "Product Details not present or not correct!!" },
    HTTPSTATUSCODES.INVALIDDATA
  );
};

const createProduct = async (newProduct) => {
  const postgressClient = await connectDb();

  if (!postgressClient.isDbConnected) {
    return await genericCatchTrap(postgressClient);
  }

  if (!newProduct) {
    return await formatJSONResponse(
      { message: "Product Details not present or not correct!!" },
      HTTPSTATUSCODES.INVALIDDATA
    );
  }

  const { client } = postgressClient;
  try {
    console.log({ newProduct });
    await client.query(TRANSACTIONCONSTANTS.BEGIN);
    const { count, title, description, price } = newProduct;

    const { rowCount, rows } = await client.query(QUERIES.createProduct, [
      title,
      description,
      price,
    ]);

    if (!rowCount) {
      return await productInternalServerError(client);
    }

    const newProductId = rows?.[0]?.id;
    console.log({ newProductId });
    const stockResp = await client.query(QUERIES.createStock, [
      newProductId,
      count,
    ]);

    if (!stockResp.rowCount) {
      return await productInternalServerError(client);
    }

    await client.query(TRANSACTIONCONSTANTS.COMMIT);
    return await formatJSONResponse(
      {
        message: `${rowCount} Products Created with Id:${newProductId}`,
        newProduct,
      },
      HTTPSTATUSCODES.OK
    );
  } catch (error) {
    await client.query(TRANSACTIONCONSTANTS.ROLLBACK);
    return await genericCatchTrap(error);
  } finally {
    disconnectDb(client);
  }
};

export const bulkCreateProduct = async (newProducts) => {
  const resultPromises = [];
  console.log({ newProducts });
  newProducts.forEach(({ body }) => {
    resultPromises.push(createProduct(JSON.parse(body)));
  });

  return await Promise.all(resultPromises);
};

const publishToSns = async (sns, newProduct) => {
  var params = {
    Message: JSON.stringify(newProduct),
    TopicArn: process.env.SNS_PRODUCTTOPIC_ARN,
    //FilterPolicy doesn't work without MessageAttributes,
    //filter conditions are searched based on MessageAttributes
    MessageAttributes: {
      title: {
        DataType: "String",
        StringValue: newProduct.title,
      },
    },
  };
  var data = await sns.publish(params).promise();
  if (data?.MessageId) {
    return { newAddedTitle: newProduct.title, isMailSent: true };
  }
  return { newAddedTitle: "TITLE NOT ADDED", isMailSent: false };
};

//Todo fix the rawMessage Delivery issue
// const enableRawMessageDelivery = async (sns, isEnableRawMessage = true) => {
//   if (!isEnableRawMessage) {
//     return sns;
//   }
//   let p1 = {
//     AttributeName: "RawMessageDelivery" /* required */,
//     SubscriptionArn: process.env.SUBSCRIPTION_ARN_EPAM /* required */,
//     AttributeValue: "true",
//   };
//   const rawMessageDeliveryStatus = await sns
//     .setSubscriptionAttributes(p1)
//     .promise();

//   console.log({ rawMessageDeliveryStatus });
//   return sns;
// };

export const sendProductsEmail = async (resultsArray) => {
  const sns = new AWS.SNS();
  const publishedResponsePromises = [];
  resultsArray.forEach((item) => {
    const parsedBody = JSON.parse(item.body);
    console.log("sendProductsEmail", { parsedBody });
    publishedResponsePromises.push(publishToSns(sns, parsedBody.newProduct));
  });

  return await Promise.all(publishedResponsePromises);
};

export const buildProductResponse = async (event) => {
  const { httpMethod, path, pathParameters } = event;
  console.log({ httpMethod }, { path }, { pathParameters });
  const isGet = httpMethod === HTTPMETHODS.GET;
  const isPost = httpMethod === HTTPMETHODS.POST;

  switch (true) {
    case isGet && path === PATHS.PRODUCTS:
      return await getProducts();

    case isGet && path === `${PATHS.PRODUCTBYID}${pathParameters?.productId}`: {
      console.log({ productId: pathParameters?.productId });
      return await getProductById(pathParameters?.productId);
    }

    case isPost: {
      console.log({ body: event.body });
      return await createProduct(event.body);
    }

    default:
      return formatJSONResponse(
        { message: "This is not valid Operation" },
        HTTPSTATUSCODES.NOTFOUND
      );
  }
};
