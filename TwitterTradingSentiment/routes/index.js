const e = require("express");
var express = require("express");
var router = express.Router();
var stockHandler = require("../stock_handler");
var twitterHandler = require("../twitter_handler");
/* GET home page. */
router.get("/", async function (req, res, next) {
  await stockHandler.getTickers().then((tickers) => {
    stockHandler.makeRules(tickers);
  });

  //twitterHandler.startStream();
  res.render("index", { title: "Express" });
});

module.exports = router;
