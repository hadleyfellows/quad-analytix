var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('./public/ng/index');
});

module.exports = router;