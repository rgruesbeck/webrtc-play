var shoe = require('shoe');
var rpc = require('rpc-stream');

module.exports = function(uri){
  var stream = shoe(uri);
  var client = rpc();

  client.pipe(stream).pipe(client);

  var remote = client.wrap([
      'sendICE',
      'sendSDP'
  ]);
  return remote;
};
