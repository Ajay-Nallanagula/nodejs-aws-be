import * as AWS from "aws-sdk";
const csv = require("csv-parser");

const getS3BucketInstance = () => {
  const region = "ap-south-1";
  const s3Bucket = new AWS.S3({ region });
  return s3Bucket;
};

const getS3BucketParams = (csvFileName = "") => {
  return {
    Key: csvFileName,
    Bucket: "node-aws-import-func",
  };
};

const getNameOfNewFileAdded = (event) => {
  const newFileName = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  console.log(`Name of New File Added: "${newFileName}"`);
  return newFileName;
};

const rejectError = (err, reject, message = "") => {
  console.log(message, err);
  return reject(err);
};

const copyUploadedToParsed = async (event) => {
  console.log({ event });
  const s3Bucket = getS3BucketInstance();
  const newFilename = getNameOfNewFileAdded(event);
  const params = getS3BucketParams(newFilename);
  console.log({ COPY_OldParams: params });
  const newParams = {
    Bucket: params.Bucket,
    Key: params.Key.replace("uploaded", "parsed"),
    CopySource: `/${params.Bucket}/uploaded/`,
  };
  console.log({ newParams });
  return s3Bucket.copyObject(newParams).promise();
};

const deleteSourceObject = async (event) => {
  const s3Bucket = getS3BucketInstance();
  const newFilename = getNameOfNewFileAdded(event);
  const params = getS3BucketParams(newFilename);
  console.log({ DELETE_PARAMS: params });
  return s3Bucket.deleteObject(params).promise();
};

const copyToParsedDelete = async (
  fileName,
  event,
  results,
  resolve,
  reject
) => {
  try {
    console.log("CSV SUCCESSFUL EXECUTION:", { results });
    const copyFileData = await copyUploadedToParsed(event);
    console.log("COPY CSV OPERATION SUCCESSFUL!!!!", { copyFileData });
    await deleteSourceObject(event);
    console.log(`Object ${fileName} Deleted after coping to parsed folder`);
    return resolve(results);
  } catch (error) {
    rejectError(error, reject, "ERROR THROWN FROM CATCH");
  }
};

export const getPreSignedUrl = (csvFileName) => {
  return new Promise((resolve, reject) => {
    const signedUrlErrorHandler = (error, url) => {
      if (error) {
        return reject(error);
      }
      return resolve(url);
    };
    const s3Bucket = getS3BucketInstance();
    const params = {
      ...getS3BucketParams(`uploaded/${csvFileName}`),
      Expires: 300,
    };
    return s3Bucket.getSignedUrl("putObject", params, signedUrlErrorHandler);
  });
};

const moveChunkToSqs = async ({ chunk, resolve, reject }) => {
  const QUEUE_URL = process.env.SQS_QUEUE_URL_VALUE;
  var sqs = new AWS.SQS();
  var params = {
    MessageBody: JSON.stringify(chunk),
    QueueUrl: QUEUE_URL,
  };
  try {
    const data = await sqs.sendMessage(params).promise();
    console.log({ SQS_SUCCESS: data });
    return resolve(data);
  } catch (error) {
    return reject(error);
  }
};

export const getS3FileObject = async (event) => {
  const s3Bucket = getS3BucketInstance();
  const fileName = getNameOfNewFileAdded(event); //Eg: "uploaded/SampleData_2.csv"
  console.log(`NEW FILE NAME ${fileName}`);
  const params = getS3BucketParams(fileName);
  console.log({ params });

  return new Promise((resolve, reject) => {
    s3Bucket
      .getObject(params)
      .createReadStream()
      .on("error", (err) =>
        rejectError(err, reject, "DURING CREATEREADSTREAM()")
      )
      .pipe(csv())
      .on("data", async (chunk) => {
        console.log("AFTER PIPE CSV()", chunk);
        //DONE: Move each of the chunk to catalogItemsQueue
        //DONE: From catalogItemsQueue the item will be picked by catalogBatchProcess
        await moveChunkToSqs({ chunk, resolve, reject });
        //DONE: Further each Item will be send to topic, which will trigger notification(mail)
        console.log("Chunks moved to SQS SUCESSFULLYY!!!!!!!!!!!!!");
      })
      .on("error", (err) => rejectError(err, reject, "CSV() ERROR"));
  });
};
