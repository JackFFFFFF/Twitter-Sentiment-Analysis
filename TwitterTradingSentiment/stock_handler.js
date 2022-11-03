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
        console.error(error); //More error handling and maybe relevant error message
      });
  },
  makeRules: async function (tickers) {
    const promises = tickers.map(async (ticker) => {
      ticker = ticker.substring(6);
      let rule = await storageHandler.retrieveObject(ticker).then((stock) => {
        stock.name = stock.name.replace("&", "");
        stock.name = stock.name.replace("|", "");

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
      //console.log(rule);
      return rule;
    });
    var rules = await Promise.all(promises);
    rules = rules.slice(0, 25);
    return rules;
  },
};
