'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

app.get('/model.json', function (req, res) {
  var params = {
    username: process.env.GEO_USERNAME,
    maxRows: 5,
    q: req.query.q
  };
  var GEO_URL = 'http://api.geonames.org/searchJSON';
  (0, _request2.default)({ url: GEO_URL, qs: params }, function (error, response, body) {
    if (error) {
      // TODO: send down the error so the UI can reflect it
      return console.log(error);
    }
    // TODO: send just what we need
    res.send(JSON.parse(body));
  });
});

app.use(_express2.default.static('dist'));

app.listen(process.env.PORT || 3000);
