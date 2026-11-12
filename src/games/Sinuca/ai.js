// Sinuca (bola 8): o computador. Para cada bola e caçapa calcula onde a branca deve bater ("bola fantasma"),
// descarta tacadas bloqueadas e, nos níveis mais altos, simula as melhores com a física do jogo.
import { R, X0, X1, Y0, Y1, MID_Y, HEAD_X, FOOT, POCKETS, DECEL, VMAX, VMIN, simulate, groupOf } from './physics.js';
import { evaluateShot, validCuePos } from './rules.js';

export const LEVELS = {
  facil: { noiseDeg: 2.6, noisePow: 0.08, sims: 0, safeSims: 2, randomPick: 0.25 },
  medio: { noiseDeg: 1.4, noisePow: 0.05, sims: 4, safeSims: 4, randomPick: 0.05 },
  dificil: { noiseDeg: 0.5, noisePow: 0.025, sims: 10, safeSims: 7, randomPick: 0 },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const gauss = (rnd) => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

// Bolas que o jogador pode mirar agora
export function legalTargets(game) {
  const g = game.groups[game.turn];
  const alive = game.world.balls.filter((b) => !b.pocketed && b.id !== 0);
  if (!g) return alive.filter((b) => b.id !== 8);
  const own = alive.filter((b) => groupOf(b.id) === g);
  return own.length ? own : alive.filter((b) => b.id === 8);
}

// Algum outro corpo atrapalha o caminho x1,y1 -> x2,y2 (distância do segmento < 2R)?
function blocked(balls, x1, y1, x2, y2, ignore) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  for (const b of balls) {
    if (b.pocketed || ignore.includes(b.id)) continue;
    const t = clamp(((b.x - x1) * dx + (b.y - y1) * dy) / len2, 0, 1);
    if (Math.hypot(b.x - (x1 + t * dx), b.y - (y1 + t * dy)) < 2 * R - 1) return true;
  }
  return false;
}

// Velocidade da tacada para a bola-alvo chegar à caçapa
function speedFor(distCue, distBall, cos) {
  const vObj = Math.sqrt(2 * DECEL * distBall * 1.15) + 120;
  const vc = vObj / Math.max(cos, 0.35);
  return clamp(Math.sqrt(vc * vc + 2 * DECEL * distCue * 1.1), 260, VMAX);
}

export function candidates(balls, cue, targets) {
  const out = [];
  for (const b of targets) {
    for (const p of POCKETS) {
      let ux = p.x - b.x;
      let uy = p.y - b.y;
      const dbp = Math.hypot(ux, uy);
      ux /= dbp;
      uy /= dbp;
      const gx = b.x - ux * 2 * R; // onde a branca fica ao tocar na bola
      const gy = b.y - uy * 2 * R;
      if (gx < X0 + R - 1 || gx > X1 - R + 1 || gy < Y0 + R - 1 || gy > Y1 - R + 1) continue;
      let cx = gx - cue.x;
      let cy = gy - cue.y;
      const dcg = Math.hypot(cx, cy);
      if (dcg < 1) continue;
      cx /= dcg;
      cy /= dcg;
      const cos = cx * ux + cy * uy;
      if (cos < 0.17) continue; // corte fino demais
      if (blocked(balls, cue.x, cue.y, gx, gy, [0, b.id])) continue;
      if (blocked(balls, b.x, b.y, p.x, p.y, [0, b.id])) continue;
      out.push({ ball: b, angle: Math.atan2(cy, cx), speed: speedFor(dcg, dbp, cos), score: cos * 100 - (dcg + dbp) * 0.08, cos });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

function valueOf(game, shot, world) {
  const me = game.turn;
  const res = evaluateShot(game, shot, world.balls);
  if (res.winner === me) return 10000;
  if (res.winner !== null) return -10000;
  const group = res.assign || game.groups[me];
  let s = 0;
  if (res.foul) s -= 500;
  for (const id of res.objects) s += !group || groupOf(id) === group ? 120 : -90;
  if (res.continues) s += 60;
  return s;
}

// Sem tacada de caçapa: bate numa bola válida com força para chegar nela e ainda tocar numa tabela.
// Nos níveis com simulação, testa várias e fica com a que não dá falta.
function safetyShot(game, targets, cfg, rnd) {
  const world = game.world;
  const cue = world.balls[0];
  const pool = targets.length ? targets : world.balls.filter((b) => b.id !== 0 && !b.pocketed);
  const tries = [];
  for (const t of pool) {
    const d = Math.hypot(t.x - cue.x, t.y - cue.y);
    const ang = Math.atan2(t.y - cue.y, t.x - cue.x);
    for (let k = 0; k < 3; k++) {
      tries.push({ angle: ang + (rnd() - 0.5) * 0.14, speed: clamp(Math.sqrt(2 * DECEL * (d + 160 + k * 240)) + 80, 300, 1600) });
    }
  }
  let best = null;
  for (let i = 0; i < Math.min(cfg.safeSims * 2, tries.length); i++) {
    const c = tries[Math.floor(rnd() * tries.length)];
    const sim = simulate(world, c.angle, c.speed);
    const v = valueOf(game, sim.shot, sim.world) + rnd();
    if (!best || v > best.v) best = { v, c };
  }
  return best.c;
}

// Escolhe a tacada: { angle, speed }
export function chooseShot(game, level, rnd = Math.random) {
  const cfg = LEVELS[level] || LEVELS.medio;
  const world = game.world;
  const cue = world.balls[0];
  let pick = null;

  if (game.isBreak) {
    const apex = world.balls.filter((b) => b.id !== 0 && !b.pocketed).sort((a, b) => a.x - b.x)[0];
    pick = { angle: Math.atan2(apex.y - cue.y, apex.x - cue.x), speed: VMAX * 0.97 };
  } else {
    const targets = legalTargets(game);
    const cands = candidates(world.balls, cue, targets);
    if (cands.length && rnd() >= cfg.randomPick) {
      if (cfg.sims > 0) {
        let best = null;
        for (const c of cands.slice(0, cfg.sims)) {
          const sim = simulate(world, c.angle, c.speed);
          const v = valueOf(game, sim.shot, sim.world) + c.score * 0.05;
          if (!best || v > best.v) best = { v, c };
        }
        pick = { angle: best.c.angle, speed: best.c.speed };
      } else {
        const c = cands[Math.floor(rnd() * Math.min(3, cands.length))];
        pick = { angle: c.angle, speed: c.speed };
      }
    } else {
      pick = safetyShot(game, targets, cfg, rnd);
    }
  }
  const angle = pick.angle + (gauss(rnd) * cfg.noiseDeg * Math.PI) / 180;
  const speed = clamp(pick.speed * (1 + gauss(rnd) * cfg.noisePow), VMIN, VMAX);
  return { angle, speed };
}

// Bola na mão: testa posições e fica com a que dá a melhor tacada
export function chooseCuePosition(game, rnd = Math.random) {
  const world = game.world;
  const targets = legalTargets(game);
  let best = null;
  const probe = { id: 0, x: 0, y: 0 };
  for (let gx = X0 + R + 6; gx <= X1 - R - 6; gx += 36) {
    for (let gy = Y0 + R + 6; gy <= Y1 - R - 6; gy += 36) {
      if (!validCuePos(game, gx, gy)) continue;
      probe.x = gx;
      probe.y = gy;
      const c = candidates(world.balls, probe, targets);
      const s = c.length ? c[0].score + Math.min(2, c.length) * 6 + rnd() : -1000 + rnd();
      if (!best || s > best.s) best = { s, x: gx, y: gy };
    }
  }
  return best ? { x: best.x, y: best.y } : { x: HEAD_X, y: MID_Y };
}
export { FOOT };
