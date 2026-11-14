// Bomba Arena — lógica pura (sem tela), usada pelo jogo e pelos testes.
// Grade 13x11: pilares fixos nas casas ímpares, blocos de tijolo que explodem e itens escondidos.

export const COLS = 13;
export const ROWS = 11;
export const EMPTY = 0;
export const WALL = 1;
export const BLOCK = 2;

export const BOMB_TIME = 2.4;
export const FIRE_TIME = 0.55;
export const SUDDEN_AT = 100; // segundos até começarem a cair paredes
const SUDDEN_STEP = 0.22;
const MAX_BOMBS = 6;
const MAX_RANGE = 8;
const MAX_SPEED = 7.5;

export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

// Cantos de partida, na ordem em que entram os jogadores
export const SPAWNS = [
  [0, 0],
  [COLS - 1, ROWS - 1],
  [COLS - 1, 0],
  [0, ROWS - 1],
];

export const idx = (x, y) => y * COLS + x;
export const inside = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;

// Ordem em espiral (de fora para dentro) usada pela "morte súbita"
function spiralOrder() {
  const out = [];
  let x0 = 0;
  let y0 = 0;
  let x1 = COLS - 1;
  let y1 = ROWS - 1;
  while (x0 <= x1 && y0 <= y1) {
    for (let x = x0; x <= x1; x++) out.push([x, y0]);
    for (let y = y0 + 1; y <= y1; y++) out.push([x1, y]);
    if (y0 < y1) for (let x = x1 - 1; x >= x0; x--) out.push([x, y1]);
    if (x0 < x1) for (let y = y1 - 1; y > y0; y--) out.push([x0, y]);
    x0++;
    y0++;
    x1--;
    y1--;
  }
  return out;
}
const SPIRAL = spiralOrder();

export function newGame({ humans = 1, bots = 3, rng = Math.random } = {}) {
  const grid = new Uint8Array(COLS * ROWS);
  const total = Math.min(4, humans + bots);
  const spawns = SPAWNS.slice(0, total);
  const nearSpawn = (x, y) => spawns.some(([sx, sy]) => Math.abs(x - sx) + Math.abs(y - sy) <= 2);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (x % 2 === 1 && y % 2 === 1) grid[idx(x, y)] = WALL;
      else if (!nearSpawn(x, y) && rng() < 0.78) grid[idx(x, y)] = BLOCK;
    }
  }
  const players = spawns.map(([x, y], i) => ({
    id: i,
    human: i < humans,
    x,
    y,
    ox: x,
    oy: y,
    tx: x,
    ty: y,
    moving: false,
    dir: 'down',
    alive: true,
    deadT: 0,
    bombsMax: 1,
    bombsOut: 0,
    range: 2,
    speed: 4.2,
    pass: new Set(),
    input: { dir: null, bomb: false },
  }));
  return {
    grid,
    players,
    bombs: [],
    fires: [],
    items: [],
    time: 0,
    nextBombId: 1,
    sudden: 0,
    suddenT: 0,
    over: false,
    winner: null,
    endT: 0,
    events: [],
    rng,
  };
}

export const bombAt = (s, x, y) => s.bombs.find((b) => b.x === x && b.y === y);
export const fireAt = (s, x, y) => s.fires.some((f) => f.x === x && f.y === y);
export const cellOf = (p) => [Math.round(p.x), Math.round(p.y)];

function canEnter(s, p, x, y) {
  if (!inside(x, y) || s.grid[idx(x, y)] !== EMPTY) return false;
  const b = bombAt(s, x, y);
  return !b || p.pass.has(b.id);
}

function collect(s, p) {
  const [cx, cy] = cellOf(p);
  const k = s.items.findIndex((it) => it.x === cx && it.y === cy);
  if (k < 0) return;
  const it = s.items[k];
  s.items.splice(k, 1);
  if (it.type === 'bomb') p.bombsMax = Math.min(MAX_BOMBS, p.bombsMax + 1);
  else if (it.type === 'fire') p.range = Math.min(MAX_RANGE, p.range + 1);
  else p.speed = Math.min(MAX_SPEED, p.speed + 0.6);
  s.events.push({ type: 'item', id: p.id });
}

function movePlayer(s, p, dt) {
  let rem = p.speed * dt;
  let guard = 6;
  while (rem > 1e-6 && guard-- > 0) {
    if (!p.moving) {
      const want = p.input.dir;
      if (!want) break;
      const [dx, dy] = DIRS[want];
      p.dir = want;
      if (!canEnter(s, p, p.x + dx, p.y + dy)) break;
      p.ox = p.x;
      p.oy = p.y;
      p.tx = p.x + dx;
      p.ty = p.y + dy;
      p.moving = true;
    } else if (p.input.dir && p.input.dir === OPPOSITE[p.dir]) {
      // voltar no meio do caminho
      [p.tx, p.ty, p.ox, p.oy] = [p.ox, p.oy, p.tx, p.ty];
      p.dir = p.input.dir;
    }
    const dist = Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y);
    const step = Math.min(rem, dist);
    if (dist > 0) {
      p.x += Math.sign(p.tx - p.x) * step;
      p.y += Math.sign(p.ty - p.y) * step;
    }
    rem -= step;
    if (step >= dist - 1e-9) {
      p.x = p.tx;
      p.y = p.ty;
      p.moving = false;
      collect(s, p);
    }
  }
}

function placeBomb(s, p) {
  if (p.bombsOut >= p.bombsMax) return;
  const [cx, cy] = cellOf(p);
  if (s.grid[idx(cx, cy)] !== EMPTY || bombAt(s, cx, cy)) return;
  const bomb = { id: s.nextBombId++, x: cx, y: cy, t: BOMB_TIME, owner: p.id, range: p.range };
  s.bombs.push(bomb);
  p.bombsOut++;
  // quem está em cima da bomba pode sair andando dela
  for (const q of s.players) {
    if (q.alive) {
      const [qx, qy] = cellOf(q);
      if (qx === cx && qy === cy) q.pass.add(bomb.id);
    }
  }
  s.events.push({ type: 'place', id: p.id });
}

// Casas atingidas por uma bomba (sem contar reação em cadeia)
export function blastCells(s, bx, by, range) {
  const cells = [[bx, by]];
  for (const [dx, dy] of Object.values(DIRS)) {
    for (let i = 1; i <= range; i++) {
      const x = bx + dx * i;
      const y = by + dy * i;
      if (!inside(x, y)) break;
      const g = s.grid[idx(x, y)];
      if (g === WALL) break;
      cells.push([x, y]);
      if (g === BLOCK) break;
    }
  }
  return cells;
}

function explode(s, first) {
  const queue = [first];
  const hit = [];
  while (queue.length) {
    const b = queue.pop();
    const k = s.bombs.indexOf(b);
    if (k < 0) continue;
    s.bombs.splice(k, 1);
    const owner = s.players[b.owner];
    if (owner) owner.bombsOut = Math.max(0, owner.bombsOut - 1);
    s.events.push({ type: 'explode' });
    for (const [x, y] of blastCells(s, b.x, b.y, b.range)) {
      hit.push([x, y]);
      s.fires.push({ x, y, t: FIRE_TIME });
      const other = bombAt(s, x, y);
      if (other) queue.push(other);
    }
  }
  // itens nas casas atingidas se perdem; blocos viram caminho e podem soltar item
  for (const [x, y] of hit) s.items = s.items.filter((it) => !(it.x === x && it.y === y));
  const broken = new Set();
  for (const [x, y] of hit) {
    if (s.grid[idx(x, y)] === BLOCK && !broken.has(idx(x, y))) {
      broken.add(idx(x, y));
      s.grid[idx(x, y)] = EMPTY;
      s.events.push({ type: 'block', x, y });
      if (s.rng() < 0.32) {
        const r = s.rng();
        s.items.push({ x, y, type: r < 0.4 ? 'bomb' : r < 0.8 ? 'fire' : 'speed' });
      }
    }
  }
}

function kill(s, p) {
  if (!p.alive) return;
  p.alive = false;
  p.deadT = 0;
  p.moving = false;
  s.events.push({ type: 'die', id: p.id });
}

export function update(s, dt) {
  if (s.over) return;
  s.time += dt;

  for (const p of s.players) {
    if (!p.alive) {
      p.deadT += dt;
      continue;
    }
    movePlayer(s, p, dt);
    if (p.input.bomb) {
      placeBomb(s, p);
      p.input.bomb = false;
    }
    const [cx, cy] = cellOf(p);
    for (const id of [...p.pass]) {
      const b = s.bombs.find((q) => q.id === id);
      if (!b || b.x !== cx || b.y !== cy) p.pass.delete(id);
    }
  }

  for (const b of [...s.bombs]) {
    b.t -= dt;
    if (b.t <= 0) explode(s, b);
  }
  for (const f of s.fires) f.t -= dt;
  s.fires = s.fires.filter((f) => f.t > 0);

  // morte súbita: paredes caem em espiral
  if (s.time > SUDDEN_AT) {
    s.suddenT += dt;
    while (s.suddenT >= SUDDEN_STEP && s.sudden < SPIRAL.length) {
      s.suddenT -= SUDDEN_STEP;
      const [x, y] = SPIRAL[s.sudden++];
      s.grid[idx(x, y)] = WALL;
      s.bombs = s.bombs.filter((b) => {
        if (b.x === x && b.y === y) {
          const o = s.players[b.owner];
          if (o) o.bombsOut = Math.max(0, o.bombsOut - 1);
          return false;
        }
        return true;
      });
      s.items = s.items.filter((it) => !(it.x === x && it.y === y));
      s.events.push({ type: 'wall' });
    }
  }

  for (const p of s.players) {
    if (!p.alive) continue;
    const [cx, cy] = cellOf(p);
    if (fireAt(s, cx, cy) || s.grid[idx(cx, cy)] === WALL) kill(s, p);
  }

  const alive = s.players.filter((p) => p.alive);
  const humans = s.players.filter((p) => p.human).length;
  // a rodada acaba quando sobra um só jogador, ou quando todos os humanos já caíram
  const ended = alive.length <= 1 || (humans > 0 && !alive.some((p) => p.human));
  if (ended) {
    s.endT += dt;
    if (s.endT > 1.1) {
      s.over = true;
      s.winner = alive.length === 1 ? alive[0].id : null;
    }
  } else s.endT = 0;
}
