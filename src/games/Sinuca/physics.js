// Sinuca (bola 8): física das bolas. Tudo em coordenadas lógicas (1000 x 540); o desenho escala para a tela.
// O mesmo código roda no jogo, na IA (que simula as tacadas antes de escolher) e nos testes.

export const W = 1000;
export const H = 540;
export const RAIL = 45;
export const X0 = RAIL; // área de jogo (bordas internas das tabelas)
export const X1 = W - RAIL;
export const Y0 = RAIL;
export const Y1 = H - RAIL;
export const MID_Y = (Y0 + Y1) / 2;
export const R = 12; // raio da bola
export const HEAD_X = X0 + (X1 - X0) * 0.25; // linha da cabeça (a branca sai de trás dela na quebra)
export const FOOT = { x: X0 + (X1 - X0) * 0.72, y: MID_Y }; // ponta do triângulo

export const POCKETS = [
  { x: X0 - 8, y: Y0 - 8, r: 32 },
  { x: (X0 + X1) / 2, y: Y0 - 10, r: 31 },
  { x: X1 + 8, y: Y0 - 8, r: 32 },
  { x: X0 - 8, y: Y1 + 8, r: 32 },
  { x: (X0 + X1) / 2, y: Y1 + 10, r: 31 },
  { x: X1 + 8, y: Y1 + 8, r: 32 },
];

export const DECEL = 350; // desaceleração constante do feltro (px/s²)
export const DAMP = 0.12; // amortecimento proporcional à velocidade (1/s)
export const STOP = 8; // abaixo disso a bola para
export const E_BALL = 0.96; // elasticidade bola x bola
export const E_WALL = 0.74; // elasticidade bola x tabela
export const VMIN = 150;
export const VMAX = 2200;
export const STEP = 1 / 240; // passo fixo da simulação

export const speedForPower = (p) => VMIN + Math.max(0, Math.min(1, p)) * (VMAX - VMIN);
export const powerForSpeed = (v) => Math.max(0, Math.min(1, (v - VMIN) / (VMAX - VMIN)));

export const groupOf = (id) => (id === 0 ? 'cue' : id === 8 ? 'eight' : id < 8 ? 'solid' : 'stripe');

// Embaralhamento simples; `rnd` permite testes repetíveis
const shuffle = (list, rnd) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function newWorld(rnd = Math.random) {
  const balls = [{ id: 0, x: HEAD_X - 55, y: MID_Y, vx: 0, vy: 0, pocketed: false }];
  // 15 posições do triângulo: 5 fileiras. A 8 fica no meio da 3ª fileira (índice 4);
  // os cantos de trás (10 e 14) levam uma lisa e uma listrada.
  const dx = Math.sqrt(3) * R + 0.15;
  const dy = R + 0.1;
  const slots = [];
  for (let row = 0; row < 5; row++) for (let k = 0; k <= row; k++) slots.push({ x: FOOT.x + row * dx, y: FOOT.y + (k - row / 2) * 2 * dy });
  const solidCorner = 1 + Math.floor(rnd() * 7);
  const stripeCorner = 9 + Math.floor(rnd() * 7);
  const corners = rnd() < 0.5 ? [solidCorner, stripeCorner] : [stripeCorner, solidCorner];
  const rest = shuffle(
    Array.from({ length: 15 }, (_, i) => i + 1).filter((id) => id !== 8 && id !== solidCorner && id !== stripeCorner),
    rnd,
  );
  const order = [];
  let ri = 0;
  for (let i = 0; i < 15; i++) order.push(i === 4 ? 8 : i === 10 ? corners[0] : i === 14 ? corners[1] : rest[ri++]);
  order.forEach((id, i) => balls.push({ id, x: slots[i].x, y: slots[i].y, vx: 0, vy: 0, pocketed: false }));
  return { balls, shot: null };
}

export const cloneWorld = (w) => ({
  balls: w.balls.map((b) => ({ ...b })),
  shot: w.shot ? { ...w.shot, pocketed: [...w.shot.pocketed] } : null,
});

export const newShot = () => ({ firstContact: null, railAfterContact: false, pocketed: [] });

export const anyMoving = (w) => w.balls.some((b) => !b.pocketed && (b.vx !== 0 || b.vy !== 0));

// Avança a simulação `dt` segundos (use passos pequenos: STEP). onEvent(tipo, intensidade) serve para o som.
export function stepWorld(w, dt, onEvent) {
  const balls = w.balls;
  const shot = w.shot;

  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    if (b.pocketed) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 0) {
      const ns = Math.max(0, sp - DECEL * dt) * Math.max(0, 1 - DAMP * dt);
      if (ns < STOP) {
        b.vx = 0;
        b.vy = 0;
      } else {
        const k = ns / sp;
        b.vx *= k;
        b.vy *= k;
      }
    }
  }

  // bola x bola
  for (let i = 0; i < balls.length; i++) {
    const a = balls[i];
    if (a.pocketed) continue;
    for (let j = i + 1; j < balls.length; j++) {
      const b = balls[j];
      if (b.pocketed) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= 4 * R * R || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const ny = dy / d;
      const overlap = 2 * R - d;
      a.x -= (nx * overlap) / 2;
      a.y -= (ny * overlap) / 2;
      b.x += (nx * overlap) / 2;
      b.y += (ny * overlap) / 2;
      const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (vn < 0) {
        const j2 = (-(1 + E_BALL) * vn) / 2;
        a.vx -= j2 * nx;
        a.vy -= j2 * ny;
        b.vx += j2 * nx;
        b.vy += j2 * ny;
        if (shot && shot.firstContact === null && (a.id === 0 || b.id === 0)) shot.firstContact = a.id === 0 ? b.id : a.id;
        if (onEvent) onEvent('ball', -vn);
      }
    }
  }

  // caçapas (antes das tabelas: a bola que entra na boca da caçapa não quica)
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    if (b.pocketed) continue;
    for (let k = 0; k < POCKETS.length; k++) {
      const p = POCKETS[k];
      if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < p.r * p.r) {
        b.pocketed = true;
        b.vx = 0;
        b.vy = 0;
        if (shot) shot.pocketed.push(b.id);
        if (onEvent) onEvent('pocket', 1);
        break;
      }
    }
  }

  // tabelas
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    if (b.pocketed) continue;
    let hit = 0;
    if (b.x < X0 + R) {
      b.x = X0 + R;
      if (b.vx < 0) { hit = -b.vx; b.vx = -b.vx * E_WALL; }
    } else if (b.x > X1 - R) {
      b.x = X1 - R;
      if (b.vx > 0) { hit = b.vx; b.vx = -b.vx * E_WALL; }
    }
    if (b.y < Y0 + R) {
      b.y = Y0 + R;
      if (b.vy < 0) { hit = Math.max(hit, -b.vy); b.vy = -b.vy * E_WALL; }
    } else if (b.y > Y1 - R) {
      b.y = Y1 - R;
      if (b.vy > 0) { hit = Math.max(hit, b.vy); b.vy = -b.vy * E_WALL; }
    }
    if (hit > 0) {
      if (shot && shot.firstContact !== null) shot.railAfterContact = true;
      if (onEvent) onEvent('rail', hit);
    }
  }
}

// Dá a tacada na branca e simula até tudo parar. Retorna a tacada (primeiro toque, bolas caídas...)
export function simulate(world, angle, speed, maxSeconds = 14) {
  const w = cloneWorld(world);
  w.shot = newShot();
  const cue = w.balls[0];
  cue.vx = Math.cos(angle) * speed;
  cue.vy = Math.sin(angle) * speed;
  for (let t = 0; t < maxSeconds && anyMoving(w); t += STEP) stepWorld(w, STEP);
  return { world: w, shot: w.shot };
}

// Raio da bola branca: onde ela encosta primeiro (para a linha de mira)
export function castRay(world, ox, oy, angle) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = { t: Infinity, ballId: null };
  for (const b of world.balls) {
    if (b.id === 0 || b.pocketed) continue;
    const fx = b.x - ox;
    const fy = b.y - oy;
    const proj = fx * dx + fy * dy;
    if (proj <= 0) continue;
    const perp2 = fx * fx + fy * fy - proj * proj;
    if (perp2 >= 4 * R * R) continue;
    const t = proj - Math.sqrt(4 * R * R - perp2);
    if (t > 0 && t < best.t) best = { t, ballId: b.id };
  }
  let tw = Infinity;
  if (dx > 1e-9) tw = Math.min(tw, (X1 - R - ox) / dx);
  if (dx < -1e-9) tw = Math.min(tw, (X0 + R - ox) / dx);
  if (dy > 1e-9) tw = Math.min(tw, (Y1 - R - oy) / dy);
  if (dy < -1e-9) tw = Math.min(tw, (Y0 + R - oy) / dy);
  if (tw < best.t) best = { t: Math.max(0, tw), ballId: null };
  return { ...best, x: ox + dx * best.t, y: oy + dy * best.t };
}
