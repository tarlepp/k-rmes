/**
 * Created by wunder on 18.3.2015.
 */
'use strict';

var _ = require('lodash');
var Utils = require('./lib/utils');
var Constants = require('./lib/constants');

// To left
var direction = 4;
var posX = 11;
var posY = 10;

// To up
/*
var direction = 1;
var posX = 5;
var posY = 0;
*/

var levelWidth = 12;
var levelHeight = 12;
var reservedPoints = [
  [5, 5], [3, 10], [7, 9], [8, 9]
];

var reservedPointsFlatten = _.map(reservedPoints, Utils.getPointString);

var paths = [
  [], // right OR down
  [] // left OR up
];

/*
if (direction === Constants.directionUp || direction === Constants.directionDown) {
  // Possible routes from current position
  var positions = [
    [[1, 2, 3, 4], [0, 0, 0, 0]],
    [[1, 2, 3, 3], [0, 0, 0, 1]],
    [[1, 2, 2, 2], [0, 0, 1, 2]],
    [[1, 2, 2, 3], [0, 0, 1, 1]],
    [[1, 2, 2, 1], [0, 0, 1, 1]],
    [[1, 1, 1, 1], [0, 1, 2, 3]],
    [[1, 1, 2, 3], [0, 1, 1, 1]],
    [[1, 1, 2, 2], [0, 1, 1, 2]],
    [[1, 1, 1, 2], [0, 1, 2, 2]]
  ];

  // Iterate positions X coordinate
  for (var x = 0; x < positions.length; x++) {
    // Get X and Y coordinate sets
    var positionsX = positions[x][0];
    var positionsY = positions[x][1];

    // Initialize used temp arrays
    var right = [];
    var left = [];

    // Iterate actual coordinates
    for (var y = 0; y < positionsX.length; y++) {
      // Determine toX and toY coordinates
      var toX = posX + positionsX[y];
      var toY = (direction === Constants.directionUp) ? posY + positionsY[y] : posY - positionsY[y];

      // And push coordinates to new arrays
      right.push([toX, toY]); // Movement to right
      left.push([posX - positionsX[y], toY]); // Movement to left
    }

    // And push those results to main paths.
    paths[0].push(right);
    paths[1].push(left);
  }
}
*/

var positions = [
  [[1, 2, 3, 4], [0, 0, 0, 0]],
  [[1, 2, 3, 3], [0, 0, 0, 1]],
  [[1, 2, 2, 2], [0, 0, 1, 2]],
  [[1, 2, 2, 3], [0, 0, 1, 1]],
  [[1, 2, 2, 1], [0, 0, 1, 1]],
  [[1, 1, 1, 1], [0, 1, 2, 3]],
  [[1, 1, 2, 3], [0, 1, 1, 1]],
  [[1, 1, 2, 2], [0, 1, 1, 2]],
  [[1, 1, 1, 2], [0, 1, 2, 2]]
];

// Iterate positions X coordinate
for (var x = 0; x < positions.length; x++) {
  // Get X and Y coordinate sets
  var positionsX = (direction === Constants.directionUp || direction === Constants.directionDown) ?
    positions[x][0] : positions[x][1];
  var positionsY = (direction === Constants.directionUp || direction === Constants.directionDown) ?
    positions[x][1] : positions[x][0];

  // Initialize used temp arrays
  var rightOrDown = [];
  var leftOrUp = [];

  // Iterate actual coordinates
  for (var y = 0; y < positionsX.length; y++) {
    // Determine toX and toY coordinates
    var toX = (direction === Constants.directionRight) ? posX + positionsX[y] : posX - positionsX[y];
    var toY = (direction === Constants.directionUp) ? posY + positionsY[y] : posY - positionsY[y];

    // And push coordinates to new arrays
    rightOrDown.push([toX, toY]); // Movement to right or down

    if ((direction === Constants.directionUp || direction === Constants.directionDown)) {
      leftOrUp.push([posX - positionsX[y], toY]); // Movement to left or up
    } else {
      leftOrUp.push([posX, toY - positionsY[y]]); // Movement to left or up
    }
  }

  // And push those results to main paths.
  paths[0].push(rightOrDown);
  paths[1].push(leftOrUp);
}


console.log('----a');
console.log(paths[0]);
console.log(paths[1]);


paths = _.map(paths, function iterator(pathSet) {
  return _.compact(_.map(pathSet, function iterator(routes) {
    _.remove(routes, function iterator(point) {

      if (point[0] < 0 || point[0] >= levelWidth ||
        point[1] < 0 || point[1] >= levelHeight ||
        (reservedPointsFlatten.indexOf(Utils.getPointString(point)) !== -1)
      ) {
        return true;
      }
    });

    if (routes.length === 4) {
      return routes;
    } else {
      return false;
    }
  }));
});


var paths2 = [];

paths2.push([
  [posX - 1, posY],
  [posX - 2, posY],
  [posX - 3, posY],
  [posX - 4, posY]
]);

paths2.push([
  [posX - 1, posY],
  [posX - 2, posY],
  [posX - 3, posY],
  [posX - 3, posY + 1]
]);

paths2.push([
  [posX - 1, posY],
  [posX - 2, posY],
  [posX - 2, posY + 1],
  [posX - 2, posY + 2]
]);

paths2.push([
  [posX - 1, posY],
  [posX - 2, posY],
  [posX - 2, posY + 1],
  [posX - 3, posY + 1]
]);

paths2.push([
  [posX - 1, posY],
  [posX - 2, posY],
  [posX - 2, posY + 1],
  [posX - 1, posY + 1]
]);

paths2.push([
  [posX - 1, posY],
  [posX - 1, posY + 1],
  [posX - 1, posY + 2],
  [posX - 1, posY + 3]
]);

paths2.push([
  [posX - 1, posY],
  [posX - 1, posY + 1],
  [posX - 2, posY + 1],
  [posX - 3, posY + 1]
]);

paths2.push([
  [posX - 1, posY],
  [posX - 1, posY + 1],
  [posX - 2, posY + 1],
  [posX - 2, posY + 2]
]);

paths2.push([
  [posX - 1, posY],
  [posX - 1, posY + 1],
  [posX - 1, posY + 2],
  [posX - 2, posY + 2]
]);

console.log('----');
console.log(paths2);
console.log('----');
console.log(paths[0]);
console.log(paths[1]);
console.log('----');
console.log(paths[0].length);
console.log(paths[1].length);
