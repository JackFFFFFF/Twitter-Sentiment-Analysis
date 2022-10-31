require("dotenv").config();
const AWS = require("aws-sdk");
// S3 setup
const bucketName = "10794948-stock-bucket";
AWS.config.update({
  region: "ap-southeast-2",
  apiVersion: "latest",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
s3.createBucket({ Bucket: bucketName })
  .promise()
  .then(() => console.log(`Created bucket: ${bucketName}`))
  .catch((err) => {
    // We will ignore 409 errors which indicate that the bucket already exists
    if (err.statusCode !== 409) {
      console.log(`Error creating bucket: ${err}`);
    }
  });

module.exports = {
  storeObject: function (data) {
    //Create object upload promise
    const key = data.symbol;
    const s3Key = `stock-${key}`;
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      ContentType: "application/json",
      Body: JSON.stringify({ source: "S3 Bucket", ...data }),
    };
    s3.putObject(params)
      .promise()
      .then(() => {
        console.log(`Successfully uploaded data to ${bucketName}/${s3Key}`);
      })
      .catch((err) => {
        console.log(err, err.stack);
      });
  },
  retrieveObject: async function (symbol) {
    const key = symbol;
    const s3Key = `stock-${key}`;
    const params = { Bucket: bucketName, Key: s3Key };
    return await s3
      .getObject(params)
      .promise()
      .then((result) => {
        // Serve from S3
        //console.log(result);
        const resultJSON = JSON.parse(result.Body.toString("utf-8"));
        return resultJSON;
      })
      .catch((error) => {
        console.log(error);
      });
  },
};
