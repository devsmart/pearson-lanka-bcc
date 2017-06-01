/**
 * Created by harshana on 6/1/17.
 */

var express = require('express');
var path = require('path');
var fs = require('fs');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.sendfile('index.html');
});
app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});