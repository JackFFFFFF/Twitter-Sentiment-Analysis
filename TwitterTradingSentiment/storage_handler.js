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

const redis = require("redis");
const redisClient = redis.createClient();
redisClient.connect().catch((err) => {
  console.log(err);
});

s3.createBucket({ Bucket: bucketName })
  .promise()
  .then(() => console.log(`Created bucket: ${bucketName}`))
  .catch((err) => {
    // We will ignore 409 errors which indicate that the bucket already exists
    if (err.statusCode !== 409) {
      console.log(`Error creating bucket: ${err}`);
    }
  });

async function storeObject(data, update) {
  //Create object upload promise
  const key = data.symbol;
  const s3Key = `stock-${key}`;
  const redisKey = s3Key;
  redisClient
    .get(redisKey)
    .then((result) => {
      if (result && !update) {
        return true;
      } else {
        if (update) {
          console.log("Updated redis");
        }
        redisClient.setEx(
          redisKey,
          3600,
          JSON.stringify({ source: "Redis Cache", ...data })
        );
      }
    })
    .catch((err) => {
      console.log(err); //Error handle
    });
  const params = {
    Bucket: bucketName,
    Key: s3Key,
    ContentType: "application/json",
    Body: JSON.stringify({ source: "S3 Bucket", ...data }),
  };
  await s3
    .putObject(params)
    .promise()
    .then(() => {
      console.log(`Successfully uploaded data to ${bucketName}/${s3Key}`);
    })
    .catch((err) => {
      console.log(err, err.stack);
    });
}

async function retrieveObject(symbol) {
  const key = symbol;
  const s3Key = `stock-${key}`;
  const redisKey = s3Key;

  redisClient
    .get(redisKey)
    .then((result) => {
      if (result) {
        const resultJSON = JSON.parse(result);
        resultJSON["source"] = "Redis Cache";
        return resultJSON;
      } //if found in redis do the thing, otherwise move on
    })
    .catch((err) => {
      console.log(err);
    });

  const params = { Bucket: bucketName, Key: s3Key };
  return await s3
    .getObject(params)
    .promise()
    .then((result) => {
      const resultJSON = JSON.parse(result.Body.toString("utf-8"));
      return resultJSON;
    })
    .catch((error) => {
      console.log(error);
    });
}

function retreiveKeys() {
  //copied from here https://stackoverflow.com/a/69754448/8096569
  return new Promise((resolve, reject) => {
    try {
      let params = {
        Bucket: bucketName,
        MaxKeys: 1000,
      };
      const allKeys = [];
      listAllKeys();
      function listAllKeys() {
        s3.listObjectsV2(params, function (err, data) {
          if (err) {
            reject(err);
          } else {
            var contents = data.Contents;
            contents.forEach(function (content) {
              allKeys.push(content.Key);
            });

            if (data.IsTruncated) {
              params.ContinuationToken = data.NextContinuationToken;
              console.log("get further list...");
              listAllKeys();
            } else {
              resolve(allKeys);
            }
          }
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  storeObject,
  retrieveObject,
  retreiveKeys,
};
