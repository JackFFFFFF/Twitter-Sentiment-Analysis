var express = require("express");
var router = express.Router();
var stockHandler = require("../stock_handler");
var twitterHandler = require("../twitter_handler");
/* GET home page. */
router.get("/", function (req, res, next) {
  stockHandler.getTickers();
  //twitterHandler.startStream();
  res.render("index", { title: "Express" });
});

module.exports = router;
