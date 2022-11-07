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
module.exports = {
  //Gets tickers from Yahoo API and stores them
  //Called in the Lambda here arn:aws:lambda:ap-southeast-2:901444280953:function:n10792554
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
            postiveSentimentTotal: 0,
            negativeSentimentTotal: 0,
            postiveSentimentSum: 0,
            negativeSentimentSum: 0,
            neutralSentimentSum: 0,
          };
          tickers.push(stock.symbol);
          storageHandler.storeObject(stockJSON, false);
        });
        return tickers;
      })
      .catch(function (error) {
        console.error(error);
        if (error.response != 200) {
          console.log("Check API Key");
        }
      });
  },
  //Retrieves tickers and converts each one to a twitter stream rule
  makeRules: async function (tickers) {
    const promises = tickers.map(async (ticker) => {
      ticker = ticker.substring(6);
      let rule = await storageHandler.retrieveObject(ticker).then((stock) => {
        //Remove random symbols from name
        stock.name = stock.name.replace("&", "");
        stock.name = stock.name.replace("|", "");
        // Syntax e.g. ($AMD OR Advanced Micro Devices) -is:retweet lang:en
        syntax =
          "((" +
          "$" +
          stock.symbol +
          ") OR (" +
          stock.name +
          "))" +
          " -is:retweet lang:en";

        return { value: syntax, tag: stock.symbol + "/" + stock.name };
      });
      return rule;
    });
    var rules = await Promise.all(promises);
    rules = rules.slice(0, 25);
    return rules;
  },
};
