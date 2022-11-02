var express = require("express");
var router = express.Router();
const axios = require("axios");
const nlp = require("../nlp_handler");
/* GET home page. */
router.post("/", function (req, res) {
  incoming = req.body;
  tweet = incoming.text.data.text;
  nlp.filterTweet(tweet);
  console.log();

  res.json(req.body);
});

module.exports = router;
