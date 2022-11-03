var express = require("express");
var router = express.Router();
const axios = require("axios");
const nlp = require("../nlp_handler");
/* GET home page. */
router.post("/", function (req, res) {
  incoming = req.body;
  tweet = incoming.text.data.text;
  let symbolRaw = incoming.text.matching_rules[0].tag;
  let symbol = symbolRaw.split("/").slice(0, 1)[0];
  //console.log(symbol);
  if (Object.keys(incoming.text.matching_rules).length < 5) {
    nlp.filterTweet(tweet, symbol);
  } else {
    console.log("Too many rules");
  }

  res.json(req.body);
});

module.exports = router;
