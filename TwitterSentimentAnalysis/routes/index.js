var express = require("express");
var router = express.Router();
const axios = require("axios");
/* GET home page. */
router.post("/", function (req, res) {
  req.body; // JavaScript object containing the parse JSON
  res.json(req.body);
  console.log(req.body);
});

module.exports = router;
