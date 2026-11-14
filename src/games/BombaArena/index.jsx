import React, { useCallback, useEffect, useRef, useState } from 'react';
import GamePage, { Segmented } from '../../components/GamePage';
import { newGame, update } from './game';
import { think } from './ai';
import { CH, COLORS, CW, drawScene } from './draw';
import { makeSfx } from './sfx';
import './bomba.css';

// Bomba Arena — jogo próprio do VAH Games, no estilo dos clássicos de arena com bombas.
// Lógica em game.js (testável), computador em ai.js, desenho e sons feitos por código.

const LEVELS = [
  { value: 'facil', label: 'Fácil' },
  { value: 'medio', label: 'Médio' },
  { value: 'dificil', label: 'Difícil' },
];

const KEYS1 = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const KEYS2 = { KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };

function names(humans) {
  return (id) => (id === 0 ? (humans === 1 ? 'Você' : 'Jogador 1') : id === 1 && humans === 2 ? 'Jogador 2' : `Bot ${id - humans + 1}`);
}

// Direcional de toque: o dedo define a direção pelo desvio em relação ao centro
function DPad({ onDir }) {
  const ref = useRef(null);
  const [knob, setKnob] = useState([0, 0]);
  const active = useRef(false);
  const handle = (e) => {
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    const max = r.width / 2;
    const k = len > max ? max / len : 1;
    setKnob([(dx * k) / max, (dy * k) / max]);
    if (len < r.width * 0.14) onDir(null);
    else onDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  };
  const end = () => {
    active.current = false;
    setKnob([0, 0]);
    onDir(null);
  };
  return (
    <div
      ref={ref}
      className="ba-pad ba-pad-d relative h-[132px] w-[132px] shrink-0 rounded-full bg-white/10 ring-1 ring-white/15"
      onPointerDown={(e) => {
        active.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        handle(e);
      }}
      onPointerMove={(e) => active.current && handle(e)}
      onPointerUp={end}
      onPointerCancel={end}
      role="group"
      aria-label="Direcional"
    >
      <div
        className="absolute left-1/2 top-1/2 h-[54px] w-[54px] rounded-full bg-lime/80 shadow-lift"
        style={{ transform: `translate(calc(-50% + ${knob[0] * 38}px), calc(-50% + ${knob[1] * 38}px))` }}
      />
    </div>
  );
}

export default function BombaArena() {
  const canvasRef = useRef(null);
  const sRef = useRef(null);
  const sfx = useRef(null);
  if (!sfx.current) sfx.current = makeSfx();
  const keys1 = useRef([]);
  const keys2 = useRef([]);
  const touchDir = useRef(null);
  const cfgRef = useRef({ humans: 1, level: 'medio' });

  const [mode, setMode] = useState('ai');
  const [bots, setBots] = useState(3);
  const [level, setLevel] = useState('medio');
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);
  const [ui, setUi] = useState(null);

  const humans = mode === 'pvp' ? 2 : 1;
  const botCount = mode === 'pvp' ? Math.min(bots, 2) : bots;
  cfgRef.current = { humans, level };

  const snapshot = useCallback((s) => {
    setUi({
      over: s.over,
      winner: s.winner,
      time: Math.floor(s.time),
      sudden: s.sudden > 0,
      players: s.players.map((p) => ({ id: p.id, alive: p.alive, human: p.human, bombs: p.bombsMax, range: p.range, speed: p.speed })),
    });
  }, []);

  const start = useCallback(() => {
    sfx.current.unlock();
    keys1.current = [];
    keys2.current = [];
    sRef.current = newGame({ humans, bots: botCount });
    setStarted(true);
    snapshot(sRef.current);
  }, [humans, botCount, snapshot]);

  useEffect(() => {
    sfx.current.muted = muted;
  }, [muted]);

  // trocar modo/bots volta à tela inicial
  useEffect(() => {
    sRef.current = null;
    setStarted(false);
    setUi(null);
  }, [mode, bots]);

  useEffect(() => {
    const down = (e) => {
      const d1 = KEYS1[e.code];
      const d2 = KEYS2[e.code];
      const s = sRef.current;
      if (d1 || d2 || e.code === 'Space') e.preventDefault();
      if (e.repeat) return;
      if (d1) keys1.current = [...keys1.current.filter((k) => k !== d1), d1];
      if (d2) keys2.current = [...keys2.current.filter((k) => k !== d2), d2];
      if (!s || s.over) return;
      sfx.current.unlock();
      if (e.code === 'Space' || e.code === 'KeyZ') s.players[0].input.bomb = true;
      if ((e.code === 'ShiftLeft' || e.code === 'KeyF') && s.players[1]?.human) s.players[1].input.bomb = true;
    };
    const up = (e) => {
      const d1 = KEYS1[e.code];
      const d2 = KEYS2[e.code];
      if (d1) keys1.current = keys1.current.filter((k) => k !== d1);
      if (d2) keys2.current = keys2.current.filter((k) => k !== d2);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // laço do jogo
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let uiT = 0;
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sRef.current;
      if (s) {
        if (!s.over) {
          const { humans: h, level: lv } = cfgRef.current;
          s.players.forEach((p, i) => {
            if (i === 0) p.input.dir = touchDir.current || keys1.current[keys1.current.length - 1] || null;
            else if (i === 1 && h === 2) p.input.dir = keys2.current[keys2.current.length - 1] || null;
            else if (!p.human) think(s, p, lv);
          });
          update(s, dt);
          for (const ev of s.events) sfx.current.play(ev.type);
          s.events.length = 0;
          if (s.over && s.winner !== null) sfx.current.play('win');
        }
        acc += dt;
        uiT += dt;
        if (uiT > 0.2 || s.over) {
          uiT = 0;
          snapshot(s);
        }
        drawScene(ctx, s, now / 1000);
      } else {
        // pré-visualização da arena antes de começar
        drawScene(ctx, previewRef.current, now / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [snapshot]);

  const previewRef = useRef(null);
  if (!previewRef.current) previewRef.current = newGame({ humans: 1, bots: 3 });

  const name = names(humans);
  const winner = ui?.winner;

  return (
    <GamePage
      title="Bomba Arena"
      actions={
        <button type="button" className="btn-ghost px-4" onClick={() => setMuted((m) => !m)} aria-pressed={muted} aria-label={muted ? 'Ligar o som' : 'Desligar o som'}>
          {muted ? '🔇' : '🔊'}
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="ba-stage flex min-w-0 flex-col gap-3">
          <div className="ba-board mx-auto flex w-full max-w-[calc((100dvh-300px)*13/11)] min-w-0 flex-col gap-2 lg:max-w-[calc((100dvh-170px)*13/11)]">
            <div className="ba-hud grid grid-cols-4 gap-1.5 sm:gap-2">
              {(ui?.players || []).map((p) => (
                <div key={p.id} className={`flex min-w-0 items-center gap-1.5 rounded-xs bg-white/[0.07] px-2 py-1.5 sm:gap-2 sm:px-2.5 ${p.alive ? '' : 'opacity-40'}`}>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[p.id] }} aria-hidden="true" />
                  <span className="truncate text-[12px] font-extrabold text-ink">{p.alive ? name(p.id) : `${name(p.id)} ✕`}</span>
                  <span className="ml-auto hidden shrink-0 text-[11px] font-bold text-muted lg:inline">{p.alive ? `💣${p.bombs} 🔥${p.range}` : 'fora'}</span>
                </div>
              ))}
            </div>
            <div className="relative">
              <canvas ref={canvasRef} width={CW} height={CH} className="ba-canvas block h-auto w-full rounded-xs bg-[#2C5E3F] shadow-lift" aria-label="Arena da Bomba Arena" />
              {!started && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xs bg-canvas/75 p-5 text-center">
                  <p className="font-display text-[28px] font-black uppercase text-lime">Bomba Arena</p>
                  <p className="max-w-[28ch] text-body-md text-body">Exploda os blocos, pegue itens e seja o último de pé.</p>
                  <button type="button" className="btn-lime px-8" onClick={start}>
                    Jogar
                  </button>
                </div>
              )}
              {started && ui?.over && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xs bg-canvas/80 p-5 text-center">
                  <p className="font-display text-[26px] font-black uppercase" style={{ color: winner === null ? '#FFD34D' : COLORS[winner] }}>
                    {winner === null ? 'Empate!' : humans === 1 ? (winner === 0 ? 'Você venceu!' : `${name(winner)} venceu`) : `${name(winner)} venceu!`}
                  </p>
                  <button type="button" className="btn-lime px-6" onClick={start}>
                    Jogar de novo
                  </button>
                </div>
              )}
              {ui?.sudden && !ui.over && <p className="pointer-events-none absolute left-0 right-0 top-1 text-center text-[12px] font-black uppercase text-red-400">Morte súbita</p>}
            </div>
          </div>

          <div className="ba-touch items-center justify-between gap-4 px-2">
            <DPad onDir={(d) => (touchDir.current = d)} />
            <button
              type="button"
              className="ba-pad ba-pad-b h-[104px] w-[104px] shrink-0 rounded-full bg-red-500/90 text-[40px] shadow-lift active:scale-95"
              aria-label="Soltar bomba"
              onPointerDown={(e) => {
                e.preventDefault();
                sfx.current.unlock();
                const s = sRef.current;
                if (s && !s.over) s.players[0].input.bomb = true;
              }}
            >
              💣
            </button>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="panel flex flex-col gap-4">
            <Segmented
              label="Modo"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'ai', label: 'Contra o computador' },
                { value: 'pvp', label: '2 jogadores' },
              ]}
            />
            <Segmented
              label={mode === 'pvp' ? 'Bots extras' : 'Quantos bots'}
              value={botCount}
              onChange={setBots}
              options={(mode === 'pvp' ? [0, 1, 2] : [1, 2, 3]).map((n) => ({ value: n, label: String(n) }))}
            />
            <Segmented label="Dificuldade dos bots" value={level} onChange={setLevel} options={LEVELS} />
          </div>
          <details className="panel" open>
            <summary className="cursor-pointer text-body-lg font-extrabold text-ink">Como jogar</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body-md text-body">
              <li className="ba-keys">Jogador 1: setas para andar e Espaço para soltar a bomba.</li>
              {mode === 'pvp' && <li className="ba-keys">Jogador 2: W A S D para andar e Shift esquerdo (ou F) para a bomba.</li>}
              <li className="hidden [@media(pointer:coarse)]:list-item">Arraste o direcional para andar e toque em 💣 para soltar a bomba.</li>
              <li>A bomba explode em cruz depois de 2 segundos e destrói os blocos marrons. Cuidado: a explosão atravessa as casas livres e acende outras bombas.</li>
              <li>Blocos podem esconder itens: +B (mais uma bomba), +F (explosão maior) e » (mais velocidade).</li>
              <li>Depois de 100 segundos paredes começam a cair de fora para dentro.</li>
            </ul>
          </details>
        </aside>
      </div>
    </GamePage>
  );
}
