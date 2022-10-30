const axios = require("axios");
require("dotenv").config();
const options = {
  method: "GET",
  url: "https://yahoo-finance15.p.rapidapi.com/api/yahoo/co/collections/most_actives",
  params: { start: "0" },
  headers: {
    "X-RapidAPI-Key": process.env.YAHOO_API,
    "X-RapidAPI-Host": "yahoo-finance15.p.rapidapi.com",
  },
};
// Redis setup
//const redisClient = redis.createClient();
//redisClient.connect().catch((err) => {
//console.log(err);
//});
// AWS Setup
const AWS = require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-2",
  apiVersion: "latest",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

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
        //console.log(response.data.quotes);
        var tickers = [];
        response.data.quotes.forEach((stock) => {
          rule =
            "((" +
            stock.symbol +
            ") OR (" +
            "$" +
            stock.symbol +
            ") OR (" +
            stock.shortName +
            "))" +
            " lang:en";
          tickers.push({
            name: stock.longName,
            symbol: stock.symbol,
            price: stock.regularMarketPrice,
            change: stock.regularMarketChangePercent,
            sentiment: 0,
            storageState: 0,
          });
        });

        console.log(tickers);
      })
      .catch(function (error) {
        console.error(error); //More error handling and maybe relevant error message
      });
  },
};
