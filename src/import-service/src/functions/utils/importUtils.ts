import * as AWS from "aws-sdk";
const csv = require("csv-parser");
//const fs = require("fs");
import * as fs from "fs";
//import csv from "csv-parser";

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
  const fileName = getNameOfNewFileAdded(event);
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
        console.log({ dataSTR: data.toString() });
        results.push(data);
        return results;
      })
      .on("error", (err) => {
        console.log("CSV() ERROR", err);
        return reject(err);
      })
      .on("end", () => {
        console.log("CSV SUCCESSFUL EXECUTION:", { results });
        return resolve(results);
      });
  });
};
