var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/:stockCode', function(req, res, next) {
  res.send(req.params.stockCode);
});

module.exports = router;
