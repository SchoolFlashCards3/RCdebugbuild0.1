// === BASIC RAYCAST ENGINE WITH PAUSE MENU ===

// === CONFIG ===
const FOV = 105 * Math.PI / 180; // wider view
const HALF_FOV = FOV / 2;
let PROJ_COEFF;
let SCREEN_WIDTH, SCREEN_HEIGHT;
const NUM_RAYS = 200;
const MAX_DEPTH = 15;

// === PLAYER ===
const player = {
  x: 1.5,
  y: 1.5,
  angle: 0,
  moveSpeed: 2,
  hrotSpeed: 2,
  vrotSpeed: 1.5
};

let lookOffsetY = 0; // vertical look
const MAX_LOOK = Math.PI / 4; // ±45° vertical

// === CANVAS SETUP ===
const canvas = document.createElement('canvas');
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.height = '100vh';
canvas.style.display = 'block';
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resize() {
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;
  PROJ_COEFF = (SCREEN_WIDTH / 2) / Math.tan(HALF_FOV);
}
window.addEventListener('resize', resize);
resize();

// === TEXTURE LOADING ===
const texture = new Image();
texture.src = "peakmeter100.jpeg";
let textureLoaded = false;
texture.onload = () => {
  textureLoaded = true;
  const size = Math.min(256, Math.max(texture.width, texture.height));
  const offCanvas = document.createElement('canvas');
  offCanvas.width = offCanvas.height = size;
  const offCtx = offCanvas.getContext('2d');
  offCtx.drawImage(texture, 0, 0, size, size);
  texture.src = offCanvas.toDataURL();
  console.log('Texture loaded and resized.');
};

// === MAP ===
const map = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1]
];
const TILE = 1;

// === CONTROLS ===
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// === MOUSE LOOK ===
canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
canvas.onclick = () => canvas.requestPointerLock();
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === canvas) {
    player.angle += e.movementX * 0.002;
    lookOffsetY -= e.movementY * 0.002;
    lookOffsetY = Math.max(-MAX_LOOK, Math.min(MAX_LOOK, lookOffsetY));
  }
});

// === UPDATE PLAYER ===
function updatePlayer(dt) {
  let dx = 0, dy = 0;

  // forward/back
  if (keys['w']) { dx += Math.cos(player.angle) * player.moveSpeed * dt; dy += Math.sin(player.angle) * player.moveSpeed * dt; }
  if (keys['s']) { dx -= Math.cos(player.angle) * player.moveSpeed * dt; dy -= Math.sin(player.angle) * player.moveSpeed * dt; }

  // strafe
  if (keys['a']) { dx += Math.cos(player.angle - Math.PI / 2) * player.moveSpeed * dt; dy += Math.sin(player.angle - Math.PI / 2) * player.moveSpeed * dt; }
  if (keys['d']) { dx += Math.cos(player.angle + Math.PI / 2) * player.moveSpeed * dt; dy += Math.sin(player.angle + Math.PI / 2) * player.moveSpeed * dt; }

  // horizontal turn
  if (keys['ArrowLeft']) player.angle -= player.hrotSpeed * dt;
  if (keys['ArrowRight']) player.angle += player.hrotSpeed * dt;

  // vertical look
  if (keys['ArrowUp']) lookOffsetY += player.vrotSpeed * dt;
  if (keys['ArrowDown']) lookOffsetY -= player.vrotSpeed * dt;
  lookOffsetY = Math.max(-MAX_LOOK, Math.min(MAX_LOOK, lookOffsetY));

  // collision separate X/Y
  const newX = player.x + dx;
  if (map[Math.floor(player.y)]?.[Math.floor(newX)] === 0) player.x = newX;
  const newY = player.y + dy;
  if (map[Math.floor(newY)]?.[Math.floor(player.x)] === 0) player.y = newY;
}

// === CAST SINGLE RAY ===
function castRay(angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  let dist = 0, hit = false, hitX = 0, hitY = 0;

  while (!hit && dist < MAX_DEPTH) {
    dist += 0.005;
    hitX = player.x + cos * dist;
    hitY = player.y + sin * dist;
    if (map[Math.floor(hitY)]?.[Math.floor(hitX)] !== 0) hit = true;
  }

  return { dist: dist * Math.cos(angle - player.angle), hitX, hitY };
}

// === DRAW ===
function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  if (!textureLoaded) {
    ctx.fillStyle = '#0f0';
    ctx.font = '20px monospace';
    ctx.fillText('Loading textures...', 20, 40);
    return;
  }

  // horizon
  const horizon = SCREEN_HEIGHT / 2 + (lookOffsetY / MAX_LOOK) * SCREEN_HEIGHT * 0.5;

  // ceiling/floor
  ctx.fillStyle = '#202020';
  ctx.fillRect(0, 0, SCREEN_WIDTH, horizon);
  ctx.fillStyle = '#303030';
  ctx.fillRect(0, horizon, SCREEN_WIDTH, SCREEN_HEIGHT - horizon);

  const angleStep = FOV / NUM_RAYS;
  for (let i = 0; i < NUM_RAYS; i++) {
    const rayAngle = player.angle - HALF_FOV + angleStep * i;
    const { dist, hitX, hitY } = castRay(rayAngle);

    const wallHeight = (TILE / dist) * PROJ_COEFF;
    const x = i * (SCREEN_WIDTH / NUM_RAYS);
    const y = horizon - wallHeight / 2;

    const texX = ((hitX + hitY) % 1) * 256;
    ctx.drawImage(texture, texX, 0, 1, texture.height, x, y, (SCREEN_WIDTH / NUM_RAYS) + 1, wallHeight);
  }
}

// === PAUSE MENU ===
let paused = false;
const pauseOverlay = document.createElement('div');
pauseOverlay.style.position = 'absolute';
pauseOverlay.style.top = '0';
pauseOverlay.style.left = '0';
pauseOverlay.style.width = '100%';
pauseOverlay.style.height = '100%';
pauseOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
pauseOverlay.style.display = 'none';
pauseOverlay.style.flexDirection = 'column';
pauseOverlay.style.justifyContent = 'center';
pauseOverlay.style.alignItems = 'center';
pauseOverlay.style.zIndex = '9999';
document.body.appendChild(pauseOverlay);

const pauseButtons = [];
function createPauseButton(text, callback) {
  const btn = document.createElement('div');
  btn.textContent = text;
  btn.style.padding = '15px 40px';
  btn.style.margin = '10px';
  btn.style.background = '#222';
  btn.style.color = 'white';
  btn.style.fontSize = '20px';
  btn.style.cursor = 'pointer';
  btn.style.position = 'relative';
  btn.addEventListener('click', callback);
  pauseOverlay.appendChild(btn);
  pauseButtons.push(btn);
  return btn;
}

const resumeBtn = createPauseButton('Resume', () => togglePause(false));
const exitBtn = createPauseButton('Exit', () => window.location.href = 'index.html');

let selectedIndex = 0;

const arrow = document.createElement('span');
arrow.textContent = '<';
arrow.style.position = 'absolute';
arrow.style.left = '100%'; // right side
arrow.style.marginLeft = '10px';
arrow.style.fontSize = '24px';
arrow.style.color = 'white';
arrow.style.textShadow = '0 0 2px black';
pauseButtons[selectedIndex].appendChild(arrow);

function updateArrow() {
  pauseButtons.forEach((btn, idx) => {
    if (idx === selectedIndex) {
      btn.style.background = '#444';
      if (!btn.contains(arrow)) btn.appendChild(arrow);
    } else {
      btn.style.background = '#222';
      if (btn.contains(arrow)) btn.removeChild(arrow);
    }
  });
}

// === PAUSE TOGGLE ===
function togglePause(state) {
  paused = state;
  pauseOverlay.style.display = paused ? 'flex' : 'none';
}

document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'e') {
    togglePause(!paused);
  }
  if (paused) {
    if (e.key === 'ArrowUp') { selectedIndex = (selectedIndex - 1 + pauseButtons.length) % pauseButtons.length; updateArrow(); }
    if (e.key === 'ArrowDown') { selectedIndex = (selectedIndex + 1) % pauseButtons.length; updateArrow(); }
    if (e.key === 'Enter') pauseButtons[selectedIndex].click();
  }
});

// === GAME LOOP ===
let lastTime = performance.now();
function loop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  if (!paused) updatePlayer(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
