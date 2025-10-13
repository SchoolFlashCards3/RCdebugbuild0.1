// mapt.js  (map data only - 4 wall rectangle, same coordinates as before)

const mapLines = [
  { x1: 400, y1: 100, x2: 400, y2: 400, texture: 'peak' }, // left wall
  { x1: 400, y1: 400, x2: 600, y2: 400, texture: 'peak' }, // bottom
  { x1: 600, y1: 400, x2: 600, y2: 100, texture: 'peak' }, // right
  { x1: 600, y1: 100, x2: 400, y2: 100, texture: 'peak' }  // top
];

// helper for other code to inspect map if needed
function getMapLines() {
  return mapLines;
}
