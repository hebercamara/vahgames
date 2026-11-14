// Computador da Bomba Arena: foge de explosões, abre caminho com bombas, pega itens e caça rivais.
import { BOMB_TIME, COLS, DIRS, EMPTY, ROWS, blastCells, bombAt, cellOf, idx, inside } from './game';

const NAMES = Object.keys(DIRS);
const INF = 1e9;

// Quanto tempo falta até o fogo chegar a cada casa (INF = segura). Considera reação em cadeia.
export function dangerMap(s, extra) {
  const d = new Float32Array(COLS * ROWS).fill(INF);
  for (const f of s.fires) d[idx(f.x, f.y)] = Math.min(d[idx(f.x, f.y)], 0.05);
  const bombs = [...s.bombs.map((b) => ({ x: b.x, y: b.y, t: b.t, range: b.range })), ...(extra ? [extra] : [])];
  // propaga: bomba dentro do raio de outra explode junto
  for (let pass = 0; pass < bombs.length; pass++) {
    let changed = false;
    for (const a of bombs) {
      const cells = blastCells(s, a.x, a.y, a.range);
      for (const b of bombs) {
        if (b !== a && b.t > a.t && cells.some(([x, y]) => x === b.x && y === b.y)) {
          b.t = a.t;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  for (const b of bombs) {
    for (const [x, y] of blastCells(s, b.x, b.y, b.range)) d[idx(x, y)] = Math.min(d[idx(x, y)], b.t);
  }
  return d;
}

// Busca em largura a partir da casa (sx, sy). `ok(x, y, passos)` diz se pode entrar.
function bfs(s, sx, sy, ok) {
  const dist = new Int16Array(COLS * ROWS).fill(-1);
  const from = new Int16Array(COLS * ROWS).fill(-1);
  const q = [[sx, sy]];
  dist[idx(sx, sy)] = 0;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const name of NAMES) {
      const nx = x + DIRS[name][0];
      const ny = y + DIRS[name][1];
      if (!inside(nx, ny) || dist[idx(nx, ny)] >= 0) continue;
      if (s.grid[idx(nx, ny)] !== EMPTY) continue;
      if (bombAt(s, nx, ny)) continue;
      if (!ok(nx, ny, dist[idx(x, y)] + 1)) continue;
      dist[idx(nx, ny)] = dist[idx(x, y)] + 1;
      from[idx(nx, ny)] = idx(x, y);
      q.push([nx, ny]);
    }
  }
  return { dist, from, order: q };
}

function firstStep(from, sx, sy, tx, ty) {
  let cur = idx(tx, ty);
  const start = idx(sx, sy);
  if (cur === start) return null;
  while (from[cur] !== start) {
    cur = from[cur];
    if (cur < 0) return null;
  }
  const x = cur % COLS;
  const y = Math.floor(cur / COLS);
  return NAMES.find((n) => sx + DIRS[n][0] === x && sy + DIRS[n][1] === y) || null;
}

const LEVELS = {
  facil: { margin: 0.9, bombChance: 0.35, hunt: 0.15, idle: 0.25 },
  medio: { margin: 0.55, bombChance: 0.7, hunt: 0.5, idle: 0.08 },
  dificil: { margin: 0.3, bombChance: 1, hunt: 0.9, idle: 0 },
};

// Caminho até uma casa segura, respeitando o tempo até o fogo chegar
function escapeStep(s, p, cx, cy, danger, speed, margin) {
  const r = bfs(s, cx, cy, (x, y, steps) => danger[idx(x, y)] - steps / speed > margin * 0.4);
  let best = null;
  for (const [x, y] of r.order) {
    if (danger[idx(x, y)] === INF && (!best || r.dist[idx(x, y)] < r.dist[idx(best[0], best[1])])) best = [x, y];
  }
  return best ? { step: firstStep(r.from, cx, cy, best[0], best[1]), dist: r.dist[idx(best[0], best[1])] } : null;
}

export function think(s, p, level = 'medio') {
  const cfg = LEVELS[level] || LEVELS.medio;
  p.input.dir = null;
  if (!p.alive || p.moving) return;
  const [cx, cy] = cellOf(p);
  const danger = dangerMap(s);
  const here = danger[idx(cx, cy)];

  // 1) em perigo: fugir
  if (here < INF) {
    const e = escapeStep(s, p, cx, cy, danger, p.speed, cfg.margin);
    if (e && e.step) p.input.dir = e.step;
    else {
      // sem saída segura: ao menos ir para a vizinha mais demorada
      let bestT = here;
      for (const n of NAMES) {
        const nx = cx + DIRS[n][0];
        const ny = cy + DIRS[n][1];
        if (inside(nx, ny) && s.grid[idx(nx, ny)] === EMPTY && !bombAt(s, nx, ny) && danger[idx(nx, ny)] > bestT) {
          bestT = danger[idx(nx, ny)];
          p.input.dir = n;
        }
      }
    }
    return;
  }

  if (s.rng() < cfg.idle * 0.05) return;

  // 2) soltar bomba se valer a pena e houver como fugir dela
  if (p.bombsOut < p.bombsMax && !bombAt(s, cx, cy)) {
    const blast = blastCells(s, cx, cy, p.range);
    const hitsBlock = blast.some(([x, y]) => s.grid[idx(x, y)] === 2);
    const hitsEnemy = s.players.some((q) => q.alive && q.id !== p.id && blast.some(([x, y]) => [Math.round(q.x), Math.round(q.y)].join() === [x, y].join()));
    if ((hitsBlock || hitsEnemy) && s.rng() < cfg.bombChance) {
      const hypo = dangerMap(s, { x: cx, y: cy, t: BOMB_TIME, range: p.range });
      // com a bomba no lugar, a própria casa não pode ser atravessada
      const r = bfs(s, cx, cy, (x, y, steps) => hypo[idx(x, y)] - steps / p.speed > 0.25);
      const safe = r.order.some(([x, y]) => hypo[idx(x, y)] === INF && r.dist[idx(x, y)] <= (BOMB_TIME - 0.6) * p.speed);
      if (safe) {
        p.input.bomb = true;
        return;
      }
    }
  }

  // 3) andar até um objetivo seguro: item, rival ou bloco para explodir
  const r = bfs(s, cx, cy, (x, y, steps) => danger[idx(x, y)] === INF || danger[idx(x, y)] - steps / p.speed > 1.2);
  const enemies = s.players.filter((q) => q.alive && q.id !== p.id).map((q) => cellOf(q));
  const hunt = s.rng() < cfg.hunt;
  let target = null;
  let bestScore = INF;
  for (const [x, y] of r.order) {
    if (x === cx && y === cy) continue;
    const d = r.dist[idx(x, y)];
    let score = INF;
    if (s.items.some((it) => it.x === x && it.y === y)) score = d - 4;
    else if (hunt && enemies.some(([ex, ey]) => (ex === x || ey === y) && Math.abs(ex - x) + Math.abs(ey - y) <= p.range)) score = d - 1;
    else if (NAMES.some((n) => inside(x + DIRS[n][0], y + DIRS[n][1]) && s.grid[idx(x + DIRS[n][0], y + DIRS[n][1])] === 2)) score = d;
    if (score < bestScore) {
      bestScore = score;
      target = [x, y];
    }
  }
  if (target) p.input.dir = firstStep(r.from, cx, cy, target[0], target[1]);
}
