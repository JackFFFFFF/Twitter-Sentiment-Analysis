const axios = require("axios");
const app = express();
const options = {
  method: "GET",
  url: "https://yh-finance.p.rapidapi.com/market/get-trending-tickers",
  params: { region: "US" },
  headers: {
    "X-RapidAPI-Key": "9a9ba72e2fmsh96a9c4e1f101546p1e8695jsn89dd50fb4425",
    "X-RapidAPI-Host": "yh-finance.p.rapidapi.com",
  },
};
// Redis setup
const redisClient = redis.createClient();
redisClient.connect().catch((err) => {
  console.log(err);
});
// AWS Setup
AWS.config.update({
  region: "ap-southeast-2",
  apiVersion: "latest",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});
const AWS = require("aws-sdk");
// Cloud Services Set-up

// Create unique bucket name
const bucketName = "stock-tickers-store";
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
s3.createBucket({ Bucket: bucketName })
  .promise()
  .then(() => console.log(`Created bucket: ${bucketName}`))
  .catch((err) => {
    // Ignore 409 errors which indicate that the bucket already exists
    if (err.statusCode !== 409) {
      console.log(`Error creating bucket: ${err}`);
    }
  });
module.exports = {
  getTickers: function () {
    const axios = require("axios");
    axios
      .request(options)
      .then(function (response) {
        console.log(response.data); //Change to return value
      })
      .catch(function (error) {
        console.error(error); //More error handling and maybe relevant error message
      });
  },
};
