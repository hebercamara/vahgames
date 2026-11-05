import React, { useCallback, useEffect, useRef, useState } from 'react';
import GamePage from '../../components/GamePage';

// Quebra-Tijolos — jogo próprio do VAH Games (gênero "brick breaker"), desenhado em canvas.
// Controles: mouse / dedo arrastando, ou setas e A/D. Espaço, clique ou toque lançam a bola.

const W = 480;
const H = 640;
const COLS = 10;
const GAP = 4;
const SIDE = 16;
const TOP = 72;
const BRICK_W = (W - SIDE * 2 - GAP * (COLS - 1)) / COLS;
const BRICK_H = 18;
const PADDLE_Y = H - 48;
const PADDLE_H = 12;
const PADDLE_W = 84;
const BALL_R = 7;
const BASE_SPEED = 330;
const MAX_SPEED = 620;
const LIVES = 3;

// '.' vazio · 1-3 resistência do tijolo
const LEVELS = [
  ['..........', '1111111111', '1111111111', '1111111111', '1111111111', '1111111111'],
  ['....22....', '...2112...', '..211112..', '.21111112.', '2111111112', '1111111111'],
  ['2.2.2.2.2.', '.1.1.1.1.1', '2.2.2.2.2.', '.1.1.1.1.1', '2.2.2.2.2.', '.1.1.1.1.1'],
  ['3333333333', '3........3', '3.222222.3', '3.2.11.2.3', '3.222222.3', '3........3', '3333333333'],
  ['1221221221', '2332332332', '3113113113', '1221221221', '2332332332', '3113113113', '1111111111'],
];

const BRICK_COLORS = { 1: '#A48EFF', 2: '#7361FF', 3: '#6842FF' };
const POWERS = {
  W: { color: '#C7FF5B', label: 'W', name: 'Raquete larga' },
  M: { color: '#A48EFF', label: 'M', name: 'Multibola' },
  S: { color: '#5BC8FF', label: 'S', name: 'Bola lenta' },
  V: { color: '#FF5B8A', label: '+', name: 'Vida extra' },
};

const readBest = () => {
  try {
    return Number(localStorage.getItem('vah-quebra-tijolos-recorde')) || 0;
  } catch {
    return 0;
  }
};
const saveBest = (v) => {
  try {
    localStorage.setItem('vah-quebra-tijolos-recorde', String(v));
  } catch {
    /* sem armazenamento local */
  }
};

function buildBricks(levelIndex) {
  const rows = LEVELS[levelIndex];
  const bricks = [];
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      const hp = Number(ch);
      bricks.push({ x: SIDE + c * (BRICK_W + GAP), y: TOP + r * (BRICK_H + GAP), w: BRICK_W, h: BRICK_H, hp, max: hp });
    });
  });
  return bricks;
}

function newBall(paddle, speed) {
  return { x: paddle.x, y: PADDLE_Y - BALL_R - 1, vx: 0, vy: 0, speed, stuck: true };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function QuebraTijolosGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({ left: false, right: false });
  const [hud, setHud] = useState({ score: 0, lives: LIVES, level: 1, best: readBest(), status: 'ready', message: '' });

  const syncHud = useCallback(() => {
    const g = gameRef.current;
    if (g.score > g.best) {
      g.best = g.score;
      saveBest(g.best);
    }
    setHud({ score: g.score, lives: g.lives, level: g.level + 1, best: g.best, status: g.status, message: g.message });
  }, []);

  const startLevel = useCallback((level, keepScore = true) => {
    const prev = gameRef.current;
    const paddle = { x: W / 2, w: PADDLE_W, wideUntil: 0 };
    const speed = BASE_SPEED + level * 25;
    gameRef.current = {
      level,
      score: keepScore && prev ? prev.score : 0,
      lives: keepScore && prev ? prev.lives : LIVES,
      best: prev ? prev.best : readBest(),
      bricks: buildBricks(level),
      paddle,
      balls: [newBall(paddle, speed)],
      drops: [],
      particles: [],
      speed,
      slowUntil: 0,
      status: 'ready',
      message: `Fase ${level + 1}`,
      time: 0,
    };
    syncHud();
  }, [syncHud]);

  const launch = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    if (g.status === 'over' || g.status === 'victory') {
      gameRef.current = null;
      startLevel(0, false);
      return;
    }
    if (g.status === 'cleared') {
      startLevel(g.level + 1);
      return;
    }
    if (g.status === 'paused') {
      g.status = 'playing';
      g.message = '';
      syncHud();
      return;
    }
    let launched = false;
    g.balls.forEach((b) => {
      if (b.stuck) {
        const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 0.6;
        b.vx = Math.cos(angle);
        b.vy = Math.sin(angle);
        b.stuck = false;
        launched = true;
      }
    });
    if (launched || g.status === 'ready') {
      g.status = 'playing';
      g.message = '';
      syncHud();
    }
  }, [startLevel, syncHud]);

  const togglePause = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    if (g.status === 'playing') {
      g.status = 'paused';
      g.message = 'Pausado';
      syncHud();
    } else if (g.status === 'paused') {
      launch();
    }
  }, [launch, syncHud]);

  // Laço principal
  useEffect(() => {
    startLevel(0, false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let raf;
    let last = performance.now();

    const burst = (g, x, y, color) => {
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 60 + Math.random() * 140;
        g.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, color });
      }
    };

    const hitBrick = (g, brick, ball) => {
      brick.hp -= 1;
      g.score += 10 * (g.level + 1);
      ball.speed = Math.min(MAX_SPEED, ball.speed + 3);
      if (brick.hp <= 0) {
        g.score += 5;
        burst(g, brick.x + brick.w / 2, brick.y + brick.h / 2, BRICK_COLORS[brick.max]);
        if (Math.random() < 0.14) {
          const types = Object.keys(POWERS);
          g.drops.push({ x: brick.x + brick.w / 2, y: brick.y, type: types[Math.floor(Math.random() * types.length)] });
        }
      }
      syncHud();
    };

    const step = (g, dt) => {
      g.time += dt;
      const p = g.paddle;
      // raquete pelo teclado
      const dir = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
      if (dir) p.x += dir * 520 * dt;
      p.w = g.time < p.wideUntil ? PADDLE_W * 1.5 : PADDLE_W;
      p.x = Math.max(p.w / 2 + 4, Math.min(W - p.w / 2 - 4, p.x));
      const slow = g.time < g.slowUntil ? 0.65 : 1;

      g.balls.forEach((b) => {
        if (b.stuck) {
          b.x = p.x;
          b.y = PADDLE_Y - BALL_R - 1;
          return;
        }
        const dist = b.speed * slow * dt;
        const n = Math.ceil(dist / 4);
        for (let i = 0; i < n && !b.dead; i++) {
          b.x += (b.vx * dist) / n;
          b.y += (b.vy * dist) / n;
          // paredes
          if (b.x < BALL_R) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
          if (b.x > W - BALL_R) { b.x = W - BALL_R; b.vx = -Math.abs(b.vx); }
          if (b.y < BALL_R + 40) { b.y = BALL_R + 40; b.vy = Math.abs(b.vy); }
          // raquete: o ângulo depende de onde a bola bate
          if (b.vy > 0 && b.y + BALL_R >= PADDLE_Y && b.y + BALL_R <= PADDLE_Y + PADDLE_H + 6 && Math.abs(b.x - p.x) <= p.w / 2 + BALL_R) {
            const rel = Math.max(-1, Math.min(1, (b.x - p.x) / (p.w / 2)));
            const angle = rel * (Math.PI / 3);
            b.vx = Math.sin(angle);
            b.vy = -Math.cos(angle);
            b.y = PADDLE_Y - BALL_R;
          }
          // tijolos
          for (const brick of g.bricks) {
            if (brick.hp <= 0) continue;
            const cx = Math.max(brick.x, Math.min(b.x, brick.x + brick.w));
            const cy = Math.max(brick.y, Math.min(b.y, brick.y + brick.h));
            const dx = b.x - cx;
            const dy = b.y - cy;
            if (dx * dx + dy * dy > BALL_R * BALL_R) continue;
            const overlapX = BALL_R - Math.abs(dx);
            const overlapY = BALL_R - Math.abs(dy);
            if (dx !== 0 && (dy === 0 || overlapX < overlapY)) {
              b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx);
            } else {
              b.vy = dy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy);
            }
            hitBrick(g, brick, b);
            break;
          }
          // evita trajetórias quase horizontais
          if (Math.abs(b.vy) < 0.2) {
            b.vy = b.vy < 0 ? -0.2 : 0.2;
            const len = Math.hypot(b.vx, b.vy);
            b.vx /= len;
            b.vy /= len;
          }
          if (b.y - BALL_R > H) b.dead = true;
        }
      });
      g.balls = g.balls.filter((b) => !b.dead);

      // itens caindo
      g.drops.forEach((d) => {
        d.y += 150 * dt;
        if (d.y + 10 >= PADDLE_Y && d.y - 10 <= PADDLE_Y + PADDLE_H && Math.abs(d.x - p.x) <= p.w / 2 + 10) {
          d.taken = true;
          g.score += 25;
          if (d.type === 'W') p.wideUntil = g.time + 12;
          if (d.type === 'S') g.slowUntil = g.time + 8;
          if (d.type === 'V') g.lives = Math.min(g.lives + 1, 6);
          if (d.type === 'M') {
            const src = g.balls.find((b) => !b.stuck) || g.balls[0];
            if (src) {
              [-0.5, 0.5].forEach((da) => {
                const a = Math.atan2(src.vy || -1, src.vx) + da;
                g.balls.push({ x: src.x, y: src.y, vx: Math.cos(a), vy: -Math.abs(Math.sin(a)), speed: src.speed, stuck: false });
              });
            }
          }
          syncHud();
        }
      });
      g.drops = g.drops.filter((d) => !d.taken && d.y < H + 20);

      g.particles.forEach((pt) => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
      });
      g.particles = g.particles.filter((pt) => pt.life > 0);

      if (g.balls.length === 0) {
        g.lives -= 1;
        g.drops = [];
        p.wideUntil = 0;
        g.slowUntil = 0;
        if (g.lives <= 0) {
          g.status = 'over';
          g.message = 'Fim de jogo';
        } else {
          g.balls = [newBall(p, g.speed)];
          g.status = 'ready';
          g.message = 'Você perdeu uma vida';
        }
        syncHud();
      } else if (g.bricks.every((br) => br.hp <= 0)) {
        g.score += 100 * (g.level + 1);
        g.status = g.level + 1 >= LEVELS.length ? 'victory' : 'cleared';
        g.message = g.status === 'victory' ? 'Você venceu todas as fases! 🏆' : `Fase ${g.level + 1} completa!`;
        syncHud();
      }
    };

    const draw = (g) => {
      ctx.fillStyle = '#0C0D14';
      ctx.fillRect(0, 0, W, H);
      // faixa superior
      const grad = ctx.createLinearGradient(W, 0, 0, 40);
      grad.addColorStop(0.2, 'rgb(23,29,46)');
      grad.addColorStop(1, 'rgb(61,47,115)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 16px Outfit, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(`PONTOS ${g.score}`, 16, 21);
      ctx.textAlign = 'center';
      ctx.fillText(`FASE ${g.level + 1}`, W / 2, 21);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FF5B8A';
      ctx.fillText('♥'.repeat(Math.max(g.lives, 0)), W - 16, 21);

      // tijolos
      g.bricks.forEach((br) => {
        if (br.hp <= 0) return;
        ctx.fillStyle = BRICK_COLORS[br.hp];
        roundRect(ctx, br.x, br.y, br.w, br.h, 5);
        ctx.fill();
        if (br.max > 1) {
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          for (let i = 0; i < br.hp; i++) ctx.fillRect(br.x + 6 + i * 7, br.y + br.h / 2 - 2, 4, 4);
        }
      });

      // itens
      g.drops.forEach((d) => {
        const pw = POWERS[d.type];
        ctx.fillStyle = pw.color;
        roundRect(ctx, d.x - 14, d.y - 9, 28, 18, 9);
        ctx.fill();
        ctx.fillStyle = '#0F1A00';
        ctx.font = '900 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pw.label, d.x, d.y + 1);
      });

      // partículas
      g.particles.forEach((pt) => {
        ctx.globalAlpha = Math.max(pt.life * 2, 0);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;

      // raquete
      const p = g.paddle;
      ctx.fillStyle = '#C7FF5B';
      roundRect(ctx, p.x - p.w / 2, PADDLE_Y, p.w, PADDLE_H, PADDLE_H / 2);
      ctx.fill();

      // bolas
      ctx.fillStyle = '#FFFFFF';
      g.balls.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const frame = (now) => {
      const g = gameRef.current;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (g) {
        if (g.status === 'playing' || g.status === 'ready') step(g, dt);
        draw(g);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [startLevel, syncHud]);

  // Teclado
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      else if (e.key === ' ' || e.key === 'Enter') launch();
      else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
      else return;
      e.preventDefault();
    };
    const up = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [launch, togglePause]);

  // Mouse e toque movem a raquete
  const movePaddle = (clientX) => {
    const g = gameRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    if (g) g.paddle.x = ((clientX - rect.left) / rect.width) * W;
  };

  const overlay = hud.status !== 'playing';
  const overlayAction = {
    ready: 'Clique, toque ou aperte Espaço para lançar',
    paused: 'Clique ou aperte Espaço para continuar',
    cleared: 'Próxima fase',
    over: 'Jogar de novo',
    victory: 'Jogar de novo',
  }[hud.status];

  return (
    <GamePage
      title="Quebra-Tijolos"
      actions={
        <button type="button" className="btn-ghost px-4" onClick={togglePause} disabled={!['playing', 'paused'].includes(hud.status)}>
          {hud.status === 'paused' ? 'Continuar' : 'Pausar'}
        </button>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:justify-center">
        <div className="relative mx-auto w-full max-w-[480px] overflow-hidden rounded-sm border-2 border-line">
          <canvas
            ref={canvasRef}
            className="block h-auto w-full touch-none select-none"
            style={{ aspectRatio: `${W} / ${H}` }}
            onPointerMove={(e) => movePaddle(e.clientX)}
            onPointerDown={(e) => {
              movePaddle(e.clientX);
              if (hud.status === 'ready') launch();
            }}
            aria-label="Área do jogo Quebra-Tijolos"
          />
          {overlay && hud.status !== 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-canvas/70 p-6 text-center">
              <p className="font-display text-[24px] font-black uppercase text-ink">{hud.message}</p>
              <button type="button" className="btn-lime px-6" onClick={launch}>
                {overlayAction}
              </button>
            </div>
          )}
          {hud.status === 'ready' && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 flex flex-col items-center gap-2 px-6 text-center">
              {hud.message && <p className="font-display text-[22px] font-black uppercase text-ink">{hud.message}</p>}
              <p className="rounded-full bg-white/10 px-4 py-2 text-[14px] font-bold text-ink">{overlayAction}</p>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Pontos', hud.score],
              ['Fase', `${hud.level}/${LEVELS.length}`],
              ['Recorde', hud.best],
            ].map(([label, value]) => (
              <div key={label} className="panel !p-4">
                <p className="text-caption uppercase text-muted">{label}</p>
                <p className="text-heading-xs font-black text-ink">{value}</p>
              </div>
            ))}
          </div>
          <div className="panel">
            <h2 className="subheading mb-3">Como jogar</h2>
            <ul className="list-disc space-y-1 pl-5 text-body-md text-body">
              <li>Mova a raquete com o mouse, arrastando o dedo ou com as setas (A/D).</li>
              <li>Clique, toque ou aperte Espaço para lançar a bola. P pausa.</li>
              <li>Tijolos mais escuros precisam de mais batidas.</li>
              <li>O ângulo da bola depende de onde ela bate na raquete.</li>
            </ul>
          </div>
          <div className="panel">
            <h2 className="subheading mb-3">Itens</h2>
            <ul className="grid grid-cols-2 gap-2 text-body-md text-body">
              {Object.values(POWERS).map((pw) => (
                <li key={pw.name} className="flex items-center gap-2">
                  <span className="flex h-[18px] w-7 items-center justify-center rounded-full text-[12px] font-black text-lime-ink" style={{ background: pw.color }}>
                    {pw.label}
                  </span>
                  {pw.name}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </GamePage>
  );
}
