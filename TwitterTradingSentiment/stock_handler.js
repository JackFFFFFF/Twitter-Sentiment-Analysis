const axios = require("axios");
const storageHandler = require("./storage_handler");
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
  getTickers: async function () {
    const axios = require("axios");
    return await axios
      .request(options)
      .then(async function (response) {
        //console.log(response.data.quotes);
        var tickers = [];
        await response.data.quotes.forEach((stock) => {
          let stockJSON = {
            name: stock.longName,
            symbol: stock.symbol,
            price: stock.regularMarketPrice,
            changePercent: stock.regularMarketChangePercent,
            sentiment: 0,
            storageState: 0,
          };
          tickers.push(stock.symbol);
          storageHandler.storeObject(stockJSON);
        });
        return tickers;
      })
      .catch(function (error) {
        console.error(error); //More error handling and maybe relevant error message
      });
  },
  makeRules: async function (tickers) {
    var rules = [];
    await tickers.forEach(async (ticker) => {
      await storageHandler.retrieveObject(ticker).then((stock) => {
        rule =
          "((" +
          stock.symbol +
          ") OR (" +
          "$" +
          stock.symbol +
          ") OR (" +
          stock.name +
          "))" +
          " lang:en";
        rules.push(rule);
      });
      console.log(rules);
    });
  },
};
