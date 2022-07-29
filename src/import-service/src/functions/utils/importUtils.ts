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

const getNameOfNewFileAdded = (event) => {
  const newFileName = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  console.log(`Name of New File Added: "${newFileName}"`);
  return newFileName;
};

export const getS3FileObject = async (event) => {
  const s3Bucket = getS3BucketInstance();
  const fileName = getNameOfNewFileAdded(event); //Eg: "uploaded/SampleData_2.csv"
  console.log(`NEW FILE NAME ${fileName}`);
  const params = getS3BucketParams(fileName);
  console.log({ params });
  const results = [];

  return new Promise((resolve, reject) => {
    s3Bucket
      .getObject(params)
      .createReadStream()
      .on("error", (err) => {
        console.log("DURING CREATEREADSTREAM()", err);
        return reject(err);
      })
      .pipe(csv())
      .on("data", (data) => {
        console.log("AFTER PIPE CSV()");
        console.log(data);
        results.push(data);
        return results;
      })
      .on("error", (err) => {
        console.log("CSV() ERROR", err);
        return reject(err);
      })
      .on("end", () => {
        console.log("CSV SUCCESSFUL EXECUTION:", { results });
        return copyUploadedToParsed(event)
          .then(async (copyFileData) => {
            console.log("COPY CSV OPERATION SUCCESSFUL!!!!", { copyFileData });
            try {
              await deleteSourceObject(event);
              console.log(
                `Object ${fileName} Deleted after coping to parsed folder`
              );
              return resolve(results);
            } catch (error) {
              reject(error);
            }
          })
          .catch((error) => {
            console.log("COPY catch() entered");
            return reject(error);
          });
      });
  });
};

export const copyUploadedToParsed = (event) => {
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

export const deleteSourceObject = async (event) => {
  const s3Bucket = getS3BucketInstance();
  const newFilename = getNameOfNewFileAdded(event);
  const params = getS3BucketParams(newFilename);
  console.log({ DELETE_PARAMS: params });
  return s3Bucket.deleteObject(params).promise();
};
