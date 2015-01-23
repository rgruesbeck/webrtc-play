var http = require('http');
var ecstatic = require('ecstatic');

var port = 6789;

http.createServer(
  ecstatic({ root: __dirname + '/build' })
).listen(port);

console.log('Listening on :' + port);
