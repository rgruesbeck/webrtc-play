var shoe = require('shoe');
var dnode = require('dnode');

module.exports = function(uri){
  var stream = shoe(uri);
  var d = dnode();
  d.on('remote', function(remote){
    remote.query(null, function(peers){
      console.log(peers);
    });
  });
  d.pipe(stream).pipe(d);
};
