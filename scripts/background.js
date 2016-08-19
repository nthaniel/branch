(() => {

var width;
var height;
var startlength;
var angle;
var linelength;
var squareWait;
var wait;
var color;
var timeouts;
var roots;
var branches;
var numSquares;
var draw;

var initializeVars = () => {
  width = window.innerWidth - 16;
  height = window.innerHeight - 16;
  startlength = squareDimension = 100;
  angle = 2 * Math.PI * Math.random();//460 / (Math.random() * 10);
  linelength = 50; //Math.sqrt(2 * Math.pow(startlength, 2));
  squareWait = 1;
  wait = 40;
  color = '#bdbdbd';
  timeouts = [];
  roots = [];
  branches = [];
  numSquares = calculateSquares()[0] * calculateSquares()[2];
};

initializeVars();
console.log(
  `Refresh or resize the page to see more fractals!\n
Inspired by Stan Allen's 'First 2500 iterations of an infinite series of plan variations'.\n
Icons made by Yannick, Dave Gandy, and Elegant Themes from www.flaticon.com`);

var draw = SVG('root').size(width, height);

// iterative version of helper
// var delayedForEach = (arr, cb, wait) => {
//   for (let i = 0; i < arr.length; i++) {
//     timeouts.push(setTimeout(() => cb(arr[i], i), wait * i));
//   }
// };

// recursive version of helper
var delayedForEach = (arr, cb, wait, i = 0) => {
  if (i >= arr.length) return;
  cb(arr[i], i);
  timeouts.push(setTimeout(() => delayedForEach(arr, cb, wait, i + 1), wait));
};


// for tight fractals
var midpoint = function(line) {
  var x1 = line.attr('x1');
  var x2 = line.attr('x2');
  var y1 = line.attr('y1');
  var y2 = line.attr('y2');

  return [(x1 + x2) / 2, (y1 + y2) / 2];
};


// for loose fractals
var randpoint = function(line, brokenness = 0) {
  var x1 = line.attr('x1');
  var x2 = line.attr('x2');
  var y1 = line.attr('y1');
  var y2 = line.attr('y2');

  var rand = (Math.random() + 1) / 5 * brokenness / (numSquares * 10);

  return [(x1 + x2) / (2 + rand), (y1 + y2) / (2 - rand)];
};


// for finding appropriate endpoint
var endpoint = function([x1, y1], generation = 1) {
  var x2 = x1 + linelength / Math.pow(1.3, generation) * Math.cos(angle * generation);
  var y2 = y1 + linelength / Math.pow(1.3, generation) * Math.sin(angle * generation);
  
  return [x2, y2];
};


// for creating root line of each fractal
var drawRoot = ([xStart, yStart]) => {
  let root = draw.line()
    .plot([[25 + Math.random() * squareDimension / 2 + xStart, (yStart + squareDimension)],
      [Math.random() * squareDimension / 2 + xStart, yStart]])
    .stroke({ width: 1, color});
  roots.push(root);
  return root;
};


// for creating fractals recursively
var branch = function(line, generation = 1, brokenness = 0) {
  if (generation > 10) return;
  var mid = randpoint(line, brokenness);
  var newLine = draw.line()
    .plot([mid, endpoint(mid, generation)])
    .stroke({width: 1, color});
  branches.push(newLine);
  timeouts.push(setTimeout(branch.bind(null, newLine, generation + 1, brokenness), wait));
};


// for figuring out how many squares to draw
function calculateSquares() {
  let xMax = Math.floor(width / squareDimension);
  let xPad = (width % (xMax * squareDimension)) / (xMax - 1);

  while (xPad < 8) {
    xMax--;
    xPad = (width % (xMax * squareDimension)) / (xMax - 1);
  }

  let yMax = Math.floor(height / squareDimension);
  let yPad = (height % (yMax * squareDimension)) / (yMax);

  while (yPad < 8) {
    yMax--;
    yPad = (height % (yMax * squareDimension)) / (yMax);
  }

  return [xMax, xPad, yMax, yPad];
};


// for creating fractal frames
  // returns an array of promises that have resolved to squares
var drawSquares = ([numCols, xPad, numRows, yPad] = calculateSquares()) => {
  var promises = [];

  var drawSquare = (x, y) => {
    let rect = draw.rect(squareDimension, squareDimension)
        .stroke({width: 0.8, color})
        .fill('white')
        .attr({
          "x": (squareDimension + xPad) * x,
          "y": (squareDimension + yPad) * y
        })
        .back();
    return rect;
  };

  for (let y = 0; y < numRows; y++) {
    promises.push(new Promise((resolve, reject) => {
      timeouts.push(setTimeout(() => {
        let innerPromises = [];
        for (let x = 0; x < numCols; x++) {
          innerPromises.push(new Promise((res, rej) => {
            timeouts.push(setTimeout(() => {
              res(drawSquare(x, y));
            }, (x + 1) * squareWait));
          }));
        }
        resolve(Promise.all(innerPromises));
      }, numCols * squareWait * y)); 
    }));
  }

  return Promise.all(promises)
    .then(promises => promises.reduce((memo, curr) => memo.concat(curr), []));
};

// for actually calling all that
var init = () => {
  let rootNode = document.getElementById('root');
  while (rootNode.firstChild) {
    rootNode.removeChild(rootNode.firstChild);
  }
  initializeVars();
  draw = SVG('root').size(width, height);
  drawSquares()
    .then((sqrs) => sqrs.map(sq => [sq.attr('x'), sq.attr('y')]))
    .then((squareCoords) => {
      delayedForEach(squareCoords, (sq, i) => {
        drawRoot(sq);
        branch(roots[i], 1, i);
      }, wait);
    });
};

var stop = () => {
  timeouts.forEach(to => window.clearTimeout(to));
};

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

var debouncedInit = debounce(init, 150, false);

init();

SVG.on(window, 'resize', function() { stop(); debouncedInit(); });

})();