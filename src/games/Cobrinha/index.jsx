import React, { useCallback, useEffect, useRef, useState } from 'react';
import GamePage, { Segmented } from '../../components/GamePage';

// Cobrinha — jogo próprio do VAH Games (gênero "snake"), desenhado em canvas.
// Controles: setas / WASD, deslizar o dedo na tela ou o direcional na tela.
// Espaço ou P pausa. Fruta comum = 10 pontos; estrela dourada (some depois de um tempo) = 50.

const CELLS = 20;
const SIZE = 480;
const CELL = SIZE / CELLS;
const SPEEDS = {
  lenta: { label: 'Lenta', start: 170, min: 95, mult: 1 },
  normal: { label: 'Normal', start: 130, min: 70, mult: 2 },
  rapida: { label: 'Rápida', start: 95, min: 50, mult: 3 },
};
const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const KEYMAP = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

const readStore = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
};
const writeStore = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* sem armazenamento local */
  }
};

// Sons curtos gerados na hora (sem arquivos de áudio)
let audioCtx = null;
function beep(freq, duration = 0.08, type = 'square', volume = 0.06) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    /* sem áudio */
  }
}

function freeCell(snake, avoid) {
  const taken = new Set(snake.map((p) => `${p.x},${p.y}`));
  if (avoid) taken.add(`${avoid.x},${avoid.y}`);
  const free = [];
  for (let y = 0; y < CELLS; y++) for (let x = 0; x < CELLS; x++) if (!taken.has(`${x},${y}`)) free.push({ x, y });
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}

function newGame(speedKey) {
  const mid = Math.floor(CELLS / 2);
  // Do rabo (início do array) para a cabeça (fim)
  const snake = [
    { x: mid - 4, y: mid },
    { x: mid - 3, y: mid },
    { x: mid - 2, y: mid },
  ];
  return {
    snake,
    dir: 'right',
    queue: [],
    fruit: freeCell(snake),
    star: null,
    starTimer: 0,
    eaten: 0,
    score: 0,
    speedKey,
    interval: SPEEDS[speedKey].start,
    acc: 0,
    status: 'ready',
    grow: 0,
    flash: 0,
  };
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

export default function CobrinhaGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const touchRef = useRef(null);
  const boardRef = useRef(null);
  const [speedKey, setSpeedKey] = useState(() => {
    const v = readStore('vah-cobrinha-velocidade', 'normal');
    return SPEEDS[v] ? v : 'normal';
  });
  const [sound, setSound] = useState(() => readStore('vah-cobrinha-som', '1') === '1');
  const soundRef = useRef(sound);
  const [hud, setHud] = useState({ score: 0, size: 3, best: Number(readStore('vah-cobrinha-recorde', 0)) || 0, status: 'ready' });

  useEffect(() => {
    soundRef.current = sound;
    writeStore('vah-cobrinha-som', sound ? '1' : '0');
  }, [sound]);

  const syncHud = useCallback(() => {
    const g = gameRef.current;
    setHud((h) => {
      const best = Math.max(h.best, g.score);
      if (best > h.best) writeStore('vah-cobrinha-recorde', best);
      return { score: g.score, size: g.snake.length, best, status: g.status };
    });
  }, []);

  const reset = useCallback((key) => {
    gameRef.current = newGame(key);
    syncHud();
  }, [syncHud]);

  useEffect(() => {
    reset(speedKey);
    writeStore('vah-cobrinha-velocidade', speedKey);
  }, [speedKey, reset]);

  const turn = useCallback((dir) => {
    const g = gameRef.current;
    if (!g) return;
    if (g.status === 'over') return;
    if (g.status === 'ready' || g.status === 'paused') {
      g.status = 'playing';
      syncHud();
    }
    const last = g.queue.length ? g.queue[g.queue.length - 1] : g.dir;
    if (dir === last || dir === OPPOSITE[last]) return;
    if (g.queue.length < 3) g.queue.push(dir);
  }, [syncHud]);

  const primary = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    if (g.status === 'over') {
      reset(speedKey);
      gameRef.current.status = 'playing';
      syncHud();
    } else if (g.status === 'playing') {
      g.status = 'paused';
      syncHud();
    } else {
      g.status = 'playing';
      syncHud();
    }
  }, [reset, speedKey, syncHud]);

  // Laço do jogo
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);
    let raf;
    let last = performance.now();

    const step = (g) => {
      if (g.queue.length) g.dir = g.queue.shift();
      const d = DIRS[g.dir];
      const head = g.snake[g.snake.length - 1];
      const next = { x: head.x + d.x, y: head.y + d.y };
      const hitsWall = next.x < 0 || next.y < 0 || next.x >= CELLS || next.y >= CELLS;
      // A ponta da cauda sai do lugar no mesmo passo, então pode ser ocupada (se não estiver crescendo)
      const body = g.grow > 0 ? g.snake : g.snake.slice(1);
      const hitsSelf = body.some((p) => p.x === next.x && p.y === next.y);
      if (hitsWall || hitsSelf) {
        g.status = 'over';
        g.flash = 1;
        if (soundRef.current) {
          beep(220, 0.15, 'sawtooth', 0.08);
          setTimeout(() => beep(130, 0.3, 'sawtooth', 0.08), 140);
        }
        syncHud();
        if (g.score > 0) setTimeout(() => window.VAHRanking?.submit('cobrinha', g.score), 700);
        return;
      }
      g.snake.push(next);
      if (g.grow > 0) g.grow -= 1;
      else g.snake.shift();

      const mult = SPEEDS[g.speedKey].mult;
      if (g.fruit && next.x === g.fruit.x && next.y === g.fruit.y) {
        g.eaten += 1;
        g.score += 10 * mult;
        g.grow += 1;
        g.interval = Math.max(SPEEDS[g.speedKey].min, g.interval - 2);
        g.fruit = freeCell(g.snake, g.star);
        if (!g.star && g.eaten % 5 === 0) {
          g.star = freeCell(g.snake, g.fruit);
          g.starTimer = 40;
        }
        if (soundRef.current) beep(660, 0.06, 'square', 0.05);
        syncHud();
      } else if (g.star && next.x === g.star.x && next.y === g.star.y) {
        g.score += 50 * mult;
        g.grow += 3;
        g.star = null;
        if (soundRef.current) {
          beep(880, 0.07, 'triangle', 0.08);
          setTimeout(() => beep(1320, 0.1, 'triangle', 0.08), 70);
        }
        syncHud();
      }
      if (g.star) {
        g.starTimer -= 1;
        if (g.starTimer <= 0) g.star = null;
      }
      if (!g.fruit && !g.star) {
        // Encheu o tabuleiro inteiro!
        g.status = 'over';
        syncHud();
      }
    };

    const draw = (g, t) => {
      ctx.fillStyle = '#0C0D14';
      ctx.fillRect(0, 0, SIZE, SIZE);
      for (let y = 0; y < CELLS; y++) {
        for (let x = 0; x < CELLS; x++) {
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          }
        }
      }

      // fruta
      if (g.fruit) {
        const pulse = 1 + Math.sin(t / 180) * 0.06;
        const cx = g.fruit.x * CELL + CELL / 2;
        const cy = g.fruit.y * CELL + CELL / 2;
        ctx.fillStyle = '#FF5B8A';
        ctx.beginPath();
        ctx.arc(cx, cy + 1, (CELL / 2 - 3) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#C7FF5B';
        ctx.fillRect(cx - 1, cy - CELL / 2 + 2, 3, 5);
      }
      // estrela dourada (pisca quando está para sumir)
      if (g.star && (g.starTimer > 12 || Math.floor(t / 120) % 2 === 0)) {
        const cx = g.star.x * CELL + CELL / 2;
        const cy = g.star.y * CELL + CELL / 2;
        const R = CELL / 2 - 1;
        ctx.fillStyle = '#FFD34D';
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI / 5) * i - Math.PI / 2 + t / 900;
          const r = i % 2 === 0 ? R : R * 0.45;
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
      }

      // cobra: degradê do lima (cabeça) ao violeta (cauda)
      const n = g.snake.length;
      g.snake.forEach((p, i) => {
        const k = n > 1 ? i / (n - 1) : 1;
        const r = Math.round(115 + (199 - 115) * k);
        const gg = Math.round(97 + (255 - 97) * k);
        const b = Math.round(255 + (91 - 255) * k);
        ctx.fillStyle = g.status === 'over' && Math.floor(t / 150) % 2 === 0 ? '#F0001B' : `rgb(${r},${gg},${b})`;
        roundRect(ctx, p.x * CELL + 1.5, p.y * CELL + 1.5, CELL - 3, CELL - 3, i === n - 1 ? 8 : 6);
        ctx.fill();
      });
      // olhos
      const head = g.snake[n - 1];
      const d = DIRS[g.dir];
      const hx = head.x * CELL + CELL / 2;
      const hy = head.y * CELL + CELL / 2;
      const px = -d.y;
      const py = d.x;
      ctx.fillStyle = '#0C0D14';
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.arc(hx + d.x * 4 + px * s * 5, hy + d.y * 4 + py * s * 5, 2.6, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const frame = (now) => {
      const g = gameRef.current;
      const dt = Math.min(now - last, 100);
      last = now;
      if (g) {
        if (g.status === 'playing') {
          g.acc += dt;
          while (g.acc >= g.interval && g.status === 'playing') {
            g.acc -= g.interval;
            step(g);
          }
        }
        draw(g, now);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [syncHud]);

  // Teclado
  useEffect(() => {
    const down = (e) => {
      if (document.querySelector('.vahr-overlay')) return; // janela do ranking aberta
      if (KEYMAP[e.key]) {
        turn(KEYMAP[e.key]);
      } else if (e.key === ' ' || e.key === 'p' || e.key === 'P' || e.key === 'Enter' || e.key === 'Escape') {
        if (e.key === 'Escape' && gameRef.current?.status !== 'playing') return;
        primary();
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [turn, primary]);

  // Deslizar o dedo: começa no quadro do jogo (inclusive sobre o aviso de início/pausa) e,
  // enquanto a partida corre, vale em qualquer lugar da tela. O gesto não rola a página.
  useEffect(() => {
    const SWIPE = 24;
    const start = (e) => {
      if (e.touches.length !== 1 || document.querySelector('.vahr-overlay')) return;
      const playing = gameRef.current?.status === 'playing';
      if (!playing && !boardRef.current?.contains(e.target)) return;
      const t = e.touches[0];
      touchRef.current = { x: t.clientX, y: t.clientY };
    };
    const move = (e) => {
      const s = touchRef.current;
      if (!s) return;
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
      touchRef.current = { x: t.clientX, y: t.clientY };
    };
    const end = () => {
      touchRef.current = null;
    };
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    return () => {
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
    };
  }, [turn]);

  const overlayText = {
    ready: { title: 'Cobrinha', action: 'Começar', hint: 'ou aperte uma seta / deslize o dedo' },
    paused: { title: 'Pausado', action: 'Continuar', hint: 'Espaço ou P também continuam' },
    over: { title: 'Fim de jogo', action: 'Jogar de novo', hint: `${hud.score} pontos · tamanho ${hud.size}` },
  }[hud.status];

  const Pad = ({ dir, label, className }) => (
    <button
      type="button"
      className={`btn-ghost h-14 w-14 px-0 text-[22px] ${className}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        turn(dir);
      }}
    >
      {{ up: '▲', down: '▼', left: '◀', right: '▶' }[dir]}
    </button>
  );

  return (
    <GamePage
      title="Cobrinha"
      actions={
        <>
          <button type="button" className="btn-ghost px-4" onClick={() => window.VAHRanking?.show('cobrinha')}>
            🏆<span className="hidden sm:inline">Ranking</span>
          </button>
          <button type="button" className="btn-icon" onClick={() => setSound((s) => !s)} aria-label={sound ? 'Desligar som' : 'Ligar som'}>
            {sound ? '🔊' : '🔇'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:justify-center">
        <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4">
          <div ref={boardRef} className="relative touch-none select-none overflow-hidden rounded-sm border-2 border-line">
            <canvas ref={canvasRef} className="block aspect-square h-auto w-full" aria-label="Área do jogo Cobrinha" />
            {overlayText && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-canvas/70 p-6 text-center">
                <p className="font-display text-[26px] font-black uppercase text-ink">{overlayText.title}</p>
                <button type="button" className="btn-lime px-6" onClick={primary}>
                  {overlayText.action}
                </button>
                <p className="text-body-md text-muted">{overlayText.hint}</p>
              </div>
            )}
          </div>
          {/* Direcional na tela (útil no celular) */}
          <div className="grid grid-cols-3 justify-items-center gap-2 self-center lg:hidden">
            <span />
            <Pad dir="up" label="Para cima" />
            <span />
            <Pad dir="left" label="Para a esquerda" />
            <button type="button" className="btn-ghost h-14 w-14 px-0 text-[14px]" onClick={primary} aria-label="Pausar ou continuar">
              {hud.status === 'playing' ? '❚❚' : '▶'}
            </button>
            <Pad dir="right" label="Para a direita" />
            <span />
            <Pad dir="down" label="Para baixo" />
            <span />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Pontos', hud.score],
              ['Tamanho', hud.size],
              ['Recorde', hud.best],
            ].map(([label, value]) => (
              <div key={label} className="panel !p-4">
                <p className="text-caption uppercase text-muted">{label}</p>
                <p className="text-heading-xs font-black text-ink">{value}</p>
              </div>
            ))}
          </div>
          <div className="panel">
            <Segmented
              label="Velocidade"
              value={speedKey}
              options={Object.entries(SPEEDS).map(([value, s]) => ({ value, label: s.label }))}
              onChange={setSpeedKey}
              disabled={hud.status === 'playing'}
            />
            <p className="mt-3 text-body-md text-muted">Quanto mais rápida, mais pontos por fruta (×1, ×2, ×3).</p>
          </div>
          <div className="panel">
            <h2 className="subheading mb-3">Como jogar</h2>
            <ul className="list-disc space-y-1 pl-5 text-body-md text-body">
              <li>Use as setas (ou W, A, S, D), deslize o dedo na tela ou use o direcional.</li>
              <li>Coma as frutas para crescer. A cobrinha acelera um pouco a cada fruta.</li>
              <li>A cada 5 frutas aparece uma ⭐ estrela: vale 50 pontos, mas some rápido!</li>
              <li>Não bata nas paredes nem no próprio corpo. Espaço ou P pausa.</li>
            </ul>
          </div>
        </aside>
      </div>
    </GamePage>
  );
}
