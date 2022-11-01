var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  rawTweet = req;
  res.render("index", { title: "Express", tweet: rawTweet });
});

module.exports = router;
