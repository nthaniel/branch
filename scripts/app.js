var draw = SVG('root').size(500, 500);
var rect = draw.rect(100, 100).attr({ fill: '#f06' });
var circ = draw.circle(100).x(100).attr({fill: '#aa9'});
var circ = draw.circle(200).x(300).attr({fill: '#c0c'}).animate(1000).attr({fill: '#000'}).x(350);
// document.getElementById('root').appendChild(draw);