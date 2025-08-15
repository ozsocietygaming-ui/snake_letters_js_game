// Snake — Letter Quest (Browser/Canvas Version)
// Grid settings
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cell = 24; // size of each cell in px
const cols = canvas.width / cell; // 20
const rows = canvas.height / cell; // 20

// Target sequence
const sequence = ['A','Y','O','U','B','-','D','E','R','R','E','C','H','E'];
let seqIndex = 0;

// UI elements
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const restartBtn = document.getElementById('restart');
const nextLetterEl = document.getElementById('nextLetter');
const lenEl = document.getElementById('len');

nextLetterEl.textContent = sequence[seqIndex];

// Snake representation: array of segments {x,y,char?}
// start in middle, length 1
let snake = [{x: Math.floor(cols/2), y: Math.floor(rows/2)}];
let dir = {x:1, y:0}; // moving right initially
let pendingDir = null;
let targetPos = null;
let running = true;
let speed = 8; // base updates per second

// place first target (the next letter)
function placeTarget() {
  // spawn somewhere not on snake
  while (true) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (!snake.some(s => s.x === x && s.y === y)) {
      targetPos = {x, y};
      break;
    }
  }
}
placeTarget();

// drawing helpers
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  ctx.fill();
}

// draw board and snake and target
function draw() {
  // background checker warm
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (c % 2 === 0) ? '#fff3e0' : '#ffe8cc';
      ctx.fillRect(c*cell, r*cell, cell, cell);
    }
  }
  // subtle grid
  ctx.strokeStyle = 'rgba(0,0,0,0.03)';
  ctx.lineWidth = 1;
  for (let i=0;i<=cols;i++){ ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,canvas.height); ctx.stroke(); }
  for (let i=0;i<=rows;i++){ ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(canvas.width,i*cell); ctx.stroke(); }

  // draw target (letter or star)
  if (seqIndex < sequence.length) {
    // tile background
    ctx.fillStyle = '#ffd166';
    roundRect(targetPos.x*cell + 4, targetPos.y*cell + 4, cell-8, cell-8, 6);
    // letter
    ctx.fillStyle = '#5b3b23';
    ctx.font = (cell - 10) + 'px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(sequence[seqIndex], targetPos.x*cell + cell/2, targetPos.y*cell + cell/2 + 1);
  } else {
    // star
    ctx.fillStyle = '#ffd54a';
    drawStar(targetPos.x*cell + cell/2, targetPos.y*cell + cell/2, cell/2 - 6);
  }

  // draw snake: iterate segments - tail first
  for (let i=0;i<snake.length;i++) {
    const seg = snake[i];
    // color warm brown shades, head brighter
    const isHead = (i === snake.length - 1);
    ctx.fillStyle = isHead ? '#4b3832' : '#7b5a45';
    roundRect(seg.x*cell + 3, seg.y*cell + 3, cell-6, cell-6, 5);
    // draw letter on segment if exists
    if (seg.char) {
      ctx.fillStyle = '#fff8e7';
      ctx.font = (cell - 12) + 'px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(seg.char, seg.x*cell + cell/2, seg.y*cell + cell/2 + 1);
      // small decoration for head
      if (isHead) {
        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(seg.x*cell + cell - 9, seg.y*cell + 6, 4, 4);
      }
    } else {
      // eye on head even if no char
      if (isHead) {
        ctx.fillStyle = '#fff8e7';
        ctx.fillRect(seg.x*cell + cell - 9, seg.y*cell + 6, 4, 4);
      }
    }
  }
}

// draw star function
function drawStar(cx, cy, r) {
  ctx.beginPath();
  for (let i=0;i<5;i++) {
    ctx.lineTo(cx + r * Math.cos((18 + i*72)*Math.PI/180), cy - r * Math.sin((18 + i*72)*Math.PI/180));
    ctx.lineTo(cx + (r/2.5) * Math.cos((54 + i*72)*Math.PI/180), cy - (r/2.5) * Math.sin((54 + i*72)*Math.PI/180));
  }
  ctx.closePath();
  ctx.fill();
}

// move logic executed each tick
function step() {
  if (!running) return;

  // apply pending direction if any (prevent reversing into self)
  if (pendingDir) {
    if (!(pendingDir.x === -dir.x && pendingDir.y === -dir.y)) {
      dir = pendingDir;
    }
    pendingDir = null;
  }

  // compute new head
  const head = { x: snake[snake.length-1].x + dir.x, y: snake[snake.length-1].y + dir.y, char: null };

  // wrap edges (optional) - keeps play continuous
  if (head.x < 0) head.x = cols - 1;
  if (head.x >= cols) head.x = 0;
  if (head.y < 0) head.y = rows - 1;
  if (head.y >= rows) head.y = 0;

  // self-collision detection (check all segments)
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    endGame(false);
    return;
  }

  // add new head
  snake.push(head);

  // check eating target
  if (head.x === targetPos.x && head.y === targetPos.y) {
    if (seqIndex < sequence.length) {
      // eat letter: assign char to the new head so it appears as tail tile
      snake[snake.length - 1].char = sequence[seqIndex];
      seqIndex++;
      lenEl.textContent = snake.length;
      if (seqIndex < sequence.length) {
        // place next letter
        placeTarget();
        nextLetterEl.textContent = sequence[seqIndex];
      } else {
        // all letters done -> spawn star for final win
        placeTarget();
        nextLetterEl.textContent = '★';
      }
    } else {
      // star eaten -> win
      endGame(true);
      return;
    }
    // note: do NOT remove tail -> snake grew by 1 because we pushed a head and kept tail
  } else {
    // normal move: remove tail to keep same length
    snake.shift();
  }

  // speed scaling: base plus length influence
  speed = 8 + Math.floor(snake.length / 3);

  draw();
}

// input handlers
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' || e.key === 'w') { pendingDir = {x:0,y:-1}; }
  if (e.key === 'ArrowDown' || e.key === 's') { pendingDir = {x:0,y:1}; }
  if (e.key === 'ArrowLeft' || e.key === 'a') { pendingDir = {x:-1,y:0}; }
  if (e.key === 'ArrowRight' || e.key === 'd') { pendingDir = {x:1,y:0}; }
});

// mobile controls (simple buttons)
document.getElementById('up').addEventListener('click', ()=>{ pendingDir = {x:0,y:-1}; });
document.getElementById('down').addEventListener('click', ()=>{ pendingDir = {x:0,y:1}; });
document.getElementById('left').addEventListener('click', ()=>{ pendingDir = {x:-1,y:0}; });
document.getElementById('right').addEventListener('click', ()=>{ pendingDir = {x:1,y:0}; });

// show mobile controls if small screen
if (window.innerWidth < 600) document.getElementById('controls').classList.remove('hidden');

// main loop timing using variable interval
let lastTime = performance.now();
function mainLoop(now) {
  const delta = now - lastTime;
  const interval = 1000 / speed;
  if (delta >= interval) {
    lastTime = now - (delta % interval);
    step();
  }
  if (running) requestAnimationFrame(mainLoop);
}

// overlay and restart
function endGame(win) {
  running = false;
  overlay.classList.remove('hidden');
  overlayText.textContent = win ? 'You Win! ⭐ All letters collected.' : 'Game Over! You collided with yourself.';
}

restartBtn.addEventListener('click', ()=>{
  // reset game state
  seqIndex = 0;
  nextLetterEl.textContent = sequence[seqIndex];
  snake = [{x: Math.floor(cols/2), y: Math.floor(rows/2)}];
  dir = {x:1, y:0}; pendingDir = null;
  speed = 8;
  running = true;
  lenEl.textContent = snake.length;
  placeTarget();
  overlay.classList.add('hidden');
  requestAnimationFrame(mainLoop);
});

// initial HUD and start
lenEl.textContent = snake.length;
requestAnimationFrame(mainLoop);
