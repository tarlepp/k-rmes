'use strict';

var Connection = require('./lib/connection');

try {
  // Create new connection
  var connection = new Connection(process.argv[2], process.argv[3], process.argv[4]);

  // And connect, this will start actual playing
  connection.connect();
} catch(error) {
  console.log('Damn gerbils have stopped running again! Someone has been dispatched to poke them with a sharp stick.');
  console.log(error);
}
