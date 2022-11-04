const e = require("express");
var express = require("express");
var router = express.Router();
var storageHandler = require("../storage_handler");
var stockHandler = require("../stock_handler");
var twitterHandler = require("../twitter_handler");

/* GET home page. */
router.get("/:stockIndex", async function (req, res, next) {
  await stockHandler.getTickers().then((result)=>{})
  await storageHandler.retreiveKeys().then(async (keys) => {
    await stockHandler.makeRules(keys).then(async (rules) => {
      const stockCode = rules[req.params.stockIndex].tag;
      const stockCode2 = stockCode.split("/")[0];
      await storageHandler.retrieveObject(stockCode2).then((stockVals) => {
        console.log(rules);
        total = stockVals["postiveSentimentTotal"] + stockVals["neutralSentimentTotal"] + stockVals["negativeSentimentTotal"]
        console.log()
        if(! total >= 0){
          total = 0;
        }
        if(total == 0){
          posrat = 33;
          negrat = 33;
          neutrat = 33;
        }else{
          posrat = 100 * stockVals["postiveSentimentTotal"] / total;
          neutrat = 100 * stockVals["neutralSentimentTotal"] / total;
          negrat = 100 * stockVals["negativeSentimentTotal"] / total;
        }

        res.render("specific", { ruleList: rules, index: req.params.stockIndex, data: stockVals, total: total, posrat: posrat, negrat: negrat, neutrat:neutrat });

        twitterHandler.startStream(rules);
      });
      
    });
  });

  
});
function PrintJSON(json) {
  console.log(json);
}
module.exports = router;
