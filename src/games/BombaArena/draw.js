// Desenho da Bomba Arena em canvas — tudo feito por código, sem imagens.
import { BLOCK, COLS, FIRE_TIME, ROWS, WALL, idx } from './game';

export const CELL = 40;
export const CW = COLS * CELL;
export const CH = ROWS * CELL;
export const COLORS = ['#C7FF5B', '#5BC8FF', '#FF9F1C', '#FF5B8A'];
const DARK = ['#6E9B1E', '#1E78A6', '#B86A00', '#B8265A'];

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function floor(ctx, x, y) {
  ctx.fillStyle = (x + y) % 2 ? '#2C5E3F' : '#316846';
  ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
}

function wall(ctx, x, y) {
  const px = x * CELL;
  const py = y * CELL;
  ctx.fillStyle = '#4A5160';
  ctx.fillRect(px, py, CELL, CELL);
  ctx.fillStyle = '#6B7385';
  ctx.fillRect(px, py, CELL, 4);
  ctx.fillRect(px, py, 4, CELL);
  ctx.fillStyle = '#2E333E';
  ctx.fillRect(px, py + CELL - 5, CELL, 5);
  ctx.fillRect(px + CELL - 5, py, 5, CELL);
  ctx.fillStyle = '#586074';
  ctx.fillRect(px + 9, py + 9, CELL - 18, CELL - 18);
}

function block(ctx, x, y) {
  const px = x * CELL;
  const py = y * CELL;
  ctx.fillStyle = '#B5733A';
  rr(ctx, px + 1.5, py + 1.5, CELL - 3, CELL - 3, 4);
  ctx.fill();
  ctx.fillStyle = '#D79A5B';
  ctx.fillRect(px + 4, py + 4, CELL - 8, 3);
  ctx.strokeStyle = '#7C4A22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 3, py + CELL / 2);
  ctx.lineTo(px + CELL - 3, py + CELL / 2);
  ctx.moveTo(px + CELL / 2, py + 3);
  ctx.lineTo(px + CELL / 2, py + CELL / 2);
  ctx.moveTo(px + CELL / 4, py + CELL / 2);
  ctx.lineTo(px + CELL / 4, py + CELL - 3);
  ctx.moveTo(px + (CELL * 3) / 4, py + CELL / 2);
  ctx.lineTo(px + (CELL * 3) / 4, py + CELL - 3);
  ctx.stroke();
}

function item(ctx, it, t) {
  const cx = it.x * CELL + CELL / 2;
  const cy = it.y * CELL + CELL / 2 + Math.sin(t * 5 + it.x) * 2;
  ctx.fillStyle = '#14181F';
  rr(ctx, cx - 14, cy - 14, 28, 28, 7);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = it.type === 'bomb' ? '#C7FF5B' : it.type === 'fire' ? '#FF9F1C' : '#5BC8FF';
  ctx.stroke();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.font = '900 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(it.type === 'bomb' ? '+B' : it.type === 'fire' ? '+F' : '»', cx, cy + 1);
}

function bomb(ctx, b, t) {
  const cx = b.x * CELL + CELL / 2;
  const cy = b.y * CELL + CELL / 2 + 2;
  const pulse = 1 + Math.sin(t * (b.t < 0.9 ? 22 : 8)) * 0.07;
  const r = 14 * pulse;
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = b.t < 0.9 && Math.floor(t * 12) % 2 ? '#7A2E2E' : '#1B1E27';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#C9B38A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy - r + 2);
  ctx.quadraticCurveTo(cx + 9, cy - r - 5, cx + 12, cy - r - 2);
  ctx.stroke();
  ctx.fillStyle = Math.floor(t * 14) % 2 ? '#FFD34D' : '#FF5B2E';
  ctx.beginPath();
  ctx.arc(cx + 12, cy - r - 2, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

function fire(ctx, f) {
  const k = Math.max(0, f.t / FIRE_TIME);
  const px = f.x * CELL;
  const py = f.y * CELL;
  const inset = (1 - k) * 8;
  ctx.fillStyle = `rgba(255,${Math.round(110 + 110 * k)},40,${0.35 + 0.65 * k})`;
  rr(ctx, px + 2 + inset, py + 2 + inset, CELL - 4 - inset * 2, CELL - 4 - inset * 2, 9);
  ctx.fill();
  ctx.fillStyle = `rgba(255,240,170,${0.25 + 0.7 * k})`;
  rr(ctx, px + 10 + inset, py + 10 + inset, CELL - 20 - inset * 2, CELL - 20 - inset * 2, 6);
  ctx.fill();
}

function player(ctx, p, t) {
  const cx = p.x * CELL + CELL / 2;
  let cy = p.y * CELL + CELL / 2;
  const col = COLORS[p.id];
  const dark = DARK[p.id];
  if (!p.alive) {
    const k = Math.min(1, p.deadT / 0.7);
    if (k >= 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.translate(cx, cy - k * 18);
    ctx.rotate(k * 6);
    ctx.scale(1 - k * 0.4, 1 - k * 0.4);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  const bob = p.moving ? Math.abs(Math.sin(t * 16)) * 3 : Math.sin(t * 3 + p.id) * 0.8;
  cy -= bob;
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + bob + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dark;
  rr(ctx, cx - 11, cy + 1, 22, 15, 6);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F4F1E8';
  rr(ctx, cx - 9.5, cy - 8, 19, 13, 6);
  ctx.fill();
  const look = { up: [0, -1.6], down: [0, 1.4], left: [-2.4, 0], right: [2.4, 0] }[p.dir];
  ctx.fillStyle = '#14181F';
  ctx.beginPath();
  ctx.arc(cx - 3.5 + look[0], cy - 2 + look[1], 2.2, 0, Math.PI * 2);
  ctx.arc(cx + 3.5 + look[0], cy - 2 + look[1], 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F4F1E8';
  ctx.beginPath();
  ctx.arc(cx, cy - 17, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.fillRect(cx - 1, cy - 16, 2, 3);
}

export function drawScene(ctx, s, t) {
  ctx.clearRect(0, 0, CW, CH);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      floor(ctx, x, y);
      const g = s.grid[idx(x, y)];
      if (g === WALL) wall(ctx, x, y);
      else if (g === BLOCK) block(ctx, x, y);
    }
  }
  for (const it of s.items) item(ctx, it, t);
  for (const b of s.bombs) bomb(ctx, b, t);
  for (const f of s.fires) fire(ctx, f);
  [...s.players].sort((a, b) => a.y - b.y).forEach((p) => player(ctx, p, t));
  if (s.time > 94 && s.sudden === 0) {
    ctx.fillStyle = `rgba(255,84,112,${0.5 + 0.5 * Math.sin(t * 8)})`;
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MORTE SÚBITA!', CW / 2, 26);
  }
}
