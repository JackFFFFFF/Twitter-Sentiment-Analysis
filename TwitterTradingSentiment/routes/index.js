const e = require("express");
var express = require("express");
var router = express.Router();
var storageHandler = require("../storage_handler");
var stockHandler = require("../stock_handler");
var twitterHandler = require("../twitter_handler");
/* GET home page. */
router.get("/", async function (req, res, next) {
  await storageHandler.retreiveKeys().then(async (keys) => {
    await stockHandler.makeRules(keys);
  });
  //twitterHandler.startStream();
  res.render("index", { title: "Express" });
});
function PrintJSON(json) {
  console.log(json);
}
module.exports = router;
