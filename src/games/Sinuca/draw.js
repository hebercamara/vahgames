// Sinuca: desenho (mesa, bolas, taco e linha de mira), tudo por código e em coordenadas lógicas.
import { W, H, RAIL, X0, X1, Y0, Y1, MID_Y, R, POCKETS, HEAD_X, FOOT, castRay, groupOf } from './physics.js';

export const BALL_COLORS = { 1: '#F2C200', 2: '#1F4FD8', 3: '#D62828', 4: '#6A2C91', 5: '#F27A0F', 6: '#0E8A3B', 7: '#8A2323', 8: '#16161A' };
export const ballColor = (id) => BALL_COLORS[id > 8 ? id - 8 : id];

let tableCache = null;
const RES = 2;

function buildTable() {
  const c = document.createElement('canvas');
  c.width = W * RES;
  c.height = H * RES;
  const g = c.getContext('2d');
  g.scale(RES, RES);

  // moldura de madeira
  const wood = g.createLinearGradient(0, 0, W, H);
  wood.addColorStop(0, '#7A4A22');
  wood.addColorStop(0.5, '#5A3317');
  wood.addColorStop(1, '#6B3F1D');
  g.fillStyle = wood;
  g.beginPath();
  g.roundRect(0, 0, W, H, 34);
  g.fill();
  g.strokeStyle = 'rgba(255,220,170,0.28)';
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(2, 2, W - 4, H - 4, 32);
  g.stroke();
  // veios da madeira
  g.strokeStyle = 'rgba(0,0,0,0.10)';
  g.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * H;
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(W * 0.3, y + (Math.random() - 0.5) * 8, W * 0.7, y + (Math.random() - 0.5) * 8, W, y + (Math.random() - 0.5) * 6);
    g.stroke();
  }

  // feltro
  const cx = (X0 + X1) / 2;
  const felt = g.createRadialGradient(cx, MID_Y, 40, cx, MID_Y, 520);
  felt.addColorStop(0, '#13894A');
  felt.addColorStop(1, '#0A5C31');
  g.fillStyle = felt;
  g.fillRect(X0 - 14, Y0 - 14, X1 - X0 + 28, Y1 - Y0 + 28);
  g.fillStyle = 'rgba(255,255,255,0.025)';
  for (let i = 0; i < 2600; i++) g.fillRect(X0 + Math.random() * (X1 - X0), Y0 + Math.random() * (Y1 - Y0), 1.4, 1.4);

  // tabelas (borracha) com aberturas nas caçapas
  const cushion = (pts) => {
    g.fillStyle = '#0B5E32';
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(pts[2][0], pts[2][1]);
    g.lineTo(pts[3][0], pts[3][1]);
    g.stroke();
  };
  const m = (X0 + X1) / 2;
  const cg = 36; // vão do canto
  const mg = 32; // vão do meio
  const t = 16; // espessura
  cushion([[X0 + cg - 8, Y0 - t], [m - mg - 4, Y0 - t], [m - mg - 14, Y0], [X0 + cg + 8, Y0]]);
  cushion([[m + mg + 4, Y0 - t], [X1 - cg + 8, Y0 - t], [X1 - cg - 8, Y0], [m + mg + 14, Y0]]);
  cushion([[X0 + cg - 8, Y1 + t], [m - mg - 4, Y1 + t], [m - mg - 14, Y1], [X0 + cg + 8, Y1]]);
  cushion([[m + mg + 4, Y1 + t], [X1 - cg + 8, Y1 + t], [X1 - cg - 8, Y1], [m + mg + 14, Y1]]);
  cushion([[X0 - t, Y0 + cg - 8], [X0 - t, Y1 - cg + 8], [X0, Y1 - cg - 8], [X0, Y0 + cg + 8]]);
  cushion([[X1 + t, Y0 + cg - 8], [X1 + t, Y1 - cg + 8], [X1, Y1 - cg - 8], [X1, Y0 + cg + 8]]);

  // marcações: linha da cabeça e pontos
  g.strokeStyle = 'rgba(255,255,255,0.14)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(HEAD_X, Y0);
  g.lineTo(HEAD_X, Y1);
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.28)';
  for (const [x, y] of [[HEAD_X, MID_Y], [FOOT.x, FOOT.y]]) {
    g.beginPath();
    g.arc(x, y, 2.6, 0, Math.PI * 2);
    g.fill();
  }

  // diamantes na madeira
  g.fillStyle = '#E8D8A8';
  const diamond = (x, y) => {
    g.beginPath();
    g.moveTo(x, y - 4.5);
    g.lineTo(x + 3.2, y);
    g.lineTo(x, y + 4.5);
    g.lineTo(x - 3.2, y);
    g.closePath();
    g.fill();
  };
  for (let k = 1; k < 8; k++) {
    if (k === 4) continue;
    const x = X0 + ((X1 - X0) * k) / 8;
    diamond(x, 20);
    diamond(x, H - 20);
  }
  for (let k = 1; k < 4; k++) {
    const y = Y0 + ((Y1 - Y0) * k) / 4;
    diamond(20, y);
    diamond(W - 20, y);
  }

  // caçapas
  for (const p of POCKETS) {
    const hole = g.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r);
    hole.addColorStop(0, '#000');
    hole.addColorStop(0.75, '#050505');
    hole.addColorStop(1, '#1b1b1b');
    g.fillStyle = hole;
    g.beginPath();
    g.arc(p.x, p.y, p.r - 2, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.lineWidth = 3;
    g.stroke();
  }
  return c;
}

export function drawBall(ctx, b, upright = 0) {
  const id = b.id;
  ctx.save();
  ctx.translate(b.x, b.y);
  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(2.5, 3.5, R, R * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  // corpo
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.save();
  ctx.clip();
  const stripe = id > 8;
  ctx.fillStyle = id === 0 || stripe ? '#F6F4EC' : ballColor(id);
  ctx.fillRect(-R, -R, 2 * R, 2 * R);
  if (stripe) {
    ctx.fillStyle = ballColor(id);
    ctx.fillRect(-R, -R * 0.56, 2 * R, R * 1.12);
  }
  if (id !== 0) {
    ctx.fillStyle = '#F6F4EC';
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.rotate(upright);
    ctx.fillStyle = '#111';
    ctx.font = '800 9px Outfit, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(id), 0, 0.6);
    ctx.restore();
  }
  // luz e borda escura
  const sh = ctx.createRadialGradient(-R * 0.4, -R * 0.45, 1, 0, 0, R * 1.05);
  sh.addColorStop(0, 'rgba(255,255,255,0.55)');
  sh.addColorStop(0.35, 'rgba(255,255,255,0.05)');
  sh.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = sh;
  ctx.fillRect(-R, -R, 2 * R, 2 * R);
  ctx.restore();
  ctx.restore();
}

function drawStick(ctx, cx, cy, angle, pull) {
  const len = 360;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle + Math.PI);
  ctx.translate(R + 5 + pull, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 2.5);
  ctx.lineTo(len, 6.5);
  ctx.lineTo(len, 9.5);
  ctx.lineTo(0, 4.5);
  ctx.fill();
  const wood = ctx.createLinearGradient(0, 0, len, 0);
  wood.addColorStop(0, '#F1D9A8');
  wood.addColorStop(0.55, '#C99A5A');
  wood.addColorStop(1, '#4A2A14');
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(0, -1.8);
  ctx.lineTo(len, -4.5);
  ctx.lineTo(len, 4.5);
  ctx.lineTo(0, 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#F4F4F0';
  ctx.fillRect(0, -1.9, 9, 3.8);
  ctx.fillStyle = '#3B82C4';
  ctx.fillRect(-2, -1.9, 3, 3.8);
  ctx.restore();
}

function drawGuide(ctx, world, cue, angle) {
  const hit = castRay(world, cue.x, cue.y, angle);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cue.x, cue.y);
  ctx.lineTo(hit.x, hit.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(hit.x, hit.y, R, 0, Math.PI * 2);
  ctx.stroke();
  if (hit.ballId !== null) {
    const b = world.balls.find((o) => o.id === hit.ballId);
    let nx = b.x - hit.x;
    let ny = b.y - hit.y;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    // a bola atingida segue na direção do contato
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + nx * 110, b.y + ny * 110);
    ctx.stroke();
    // a branca desvia pela tangente
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const dot = dx * nx + dy * ny;
    let tx = dx - dot * nx;
    let ty = dy - dot * ny;
    const tl = Math.hypot(tx, ty);
    if (tl > 0.05) {
      tx /= tl;
      ty /= tl;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(hit.x, hit.y);
      ctx.lineTo(hit.x + tx * 60 * tl, hit.y + ty * 60 * tl);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// view: { aim, pull, guide, upright, placing, time, strike }
export function drawScene(ctx, game, view) {
  if (!tableCache) tableCache = buildTable();
  ctx.drawImage(tableCache, 0, 0, W, H);
  const balls = game.world.balls;
  const cue = balls[0];
  for (const b of balls) if (!b.pocketed) drawBall(ctx, b, view.upright);

  if (view.placing && !cue.pocketed) {
    ctx.save();
    ctx.strokeStyle = `rgba(199,255,91,${0.55 + 0.35 * Math.sin(view.time * 6)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cue.x, cue.y, R + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (view.stick && !cue.pocketed) {
    if (view.guide) drawGuide(ctx, game.world, cue, view.aim);
    drawStick(ctx, cue.x, cue.y, view.aim, view.pull);
  }
}

export { groupOf };
