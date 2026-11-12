import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Segmented } from '../../components/GamePage';
import { W, H, R, STEP, anyMoving, newShot, speedForPower, stepWorld } from './physics';
import { GROUP_LABEL, applyResult, evaluateShot, nearestValidCuePos, newGame, remaining } from './rules';
import { chooseCuePosition, chooseShot, legalTargets } from './ai';
import { ballColor, drawScene } from './draw';
import { makeSfx } from './sfx';
import './sinuca.css';

// Sinuca (bola 8) — jogo próprio do VAH Games. Mesa desenhada por código; no celular em pé a mesa gira
// 90° para ocupar a tela. Mire arrastando na mesa, dê a tacada puxando a barra de força.

const LEVELS = [
  { value: 'facil', label: 'Fácil' },
  { value: 'medio', label: 'Médio' },
  { value: 'dificil', label: 'Difícil' },
];

function MiniBall({ id, dim }) {
  const c = ballColor(id);
  const stripe = id > 8;
  return (
    <span
      className={`relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ring-1 ring-black/40 ${dim ? 'opacity-25' : ''}`}
      style={{ background: stripe ? `linear-gradient(to bottom, #F6F4EC 0 26%, ${c} 26% 74%, #F6F4EC 74% 100%)` : c }}
      aria-hidden="true"
    >
      <span className="flex h-[10px] w-[10px] items-center justify-center rounded-full bg-[#F6F4EC] text-[7px] font-black leading-none text-black">{id}</span>
    </span>
  );
}

function PlayerCard({ name, group, pocketed, active, cleared }) {
  const ids = group === 'solid' ? [1, 2, 3, 4, 5, 6, 7] : group === 'stripe' ? [9, 10, 11, 12, 13, 14, 15] : [];
  const done = ids.filter((id) => pocketed.includes(id)).length;
  return (
    <div className={`min-w-0 flex-1 rounded-xs px-3 py-2 transition ${active ? 'bg-lime/20 ring-2 ring-lime' : 'bg-white/[0.07]'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[14px] font-extrabold text-ink">{name}</span>
        <span className="shrink-0 text-caption uppercase text-muted">
          {group ? GROUP_LABEL[group] : 'Aberta'}
          {group && <span className="sn-count"> {cleared ? '→ 8' : `${done}/7`}</span>}
        </span>
      </div>
      <div className="sn-balls mt-1.5 flex gap-[2px]">
        {group ? (
          <>
            {ids.map((id) => (
              <MiniBall key={id} id={id} dim={!pocketed.includes(id)} />
            ))}
            <MiniBall id={8} dim={!cleared} />
          </>
        ) : (
          <span className="h-[18px] truncate text-[11px] leading-[18px] text-muted">Grupo ainda não escolhido</span>
        )}
      </div>
    </div>
  );
}

export default function SinucaGame() {
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);
  const boxRef = useRef(null);
  const gameRef = useRef(null);
  const simRef = useRef({ phase: 'aiming', aim: 0, power: 0, pull: 0, strike: null, token: 0, thinking: false, message: '', pressed: false, keyCharge: false, acc: 0, rolling: 0 });
  const viewRef = useRef({ portrait: false, s: 1, dpr: 1 });
  const sfxRef = useRef(null);
  const modeRef = useRef('ai');
  const levelRef = useRef('medio');
  const soundRef = useRef(true);
  const [mode, setMode] = useState('ai');
  const [level, setLevel] = useState('medio');
  const [sound, setSound] = useState(true);
  const [ui, setUi] = useState(null);
  const [power, setPower] = useState(0);

  modeRef.current = mode;
  levelRef.current = level;
  soundRef.current = sound;

  const isAI = (turn) => modeRef.current === 'ai' && turn === 1;
  const nameOf = (i) => (modeRef.current === 'ai' ? (i === 0 ? 'Você' : 'Computador') : `Jogador ${i + 1}`);
  const turnText = (i) => (modeRef.current === 'ai' && i === 0 ? 'Sua vez.' : `Vez de ${nameOf(i)}.`);

  const sync = useCallback(() => {
    const g = gameRef.current;
    const s = simRef.current;
    setUi({
      turn: g.turn,
      groups: [...g.groups],
      phase: s.phase,
      message: s.message,
      winner: g.winner,
      reason: g.reason,
      thinking: s.thinking,
      pocketed: g.world.balls.filter((b) => b.pocketed && b.id !== 0).map((b) => b.id),
      cleared: [g.groups[0] ? remaining(g.world.balls, g.groups[0]) === 0 : false, g.groups[1] ? remaining(g.world.balls, g.groups[1]) === 0 : false],
    });
  }, []);

  const humanTurn = () => {
    const g = gameRef.current;
    const s = simRef.current;
    return g && g.winner === null && !isAI(g.turn) && (s.phase === 'aiming' || s.phase === 'placing');
  };

  const fire = useCallback((angle, speed) => {
    const s = simRef.current;
    s.phase = 'striking';
    s.strike = { t0: performance.now(), angle, speed, pull0: s.pull };
    s.thinking = false;
    s.power = 0;
    setPower(0);
    sync();
  }, [sync]);

  const scheduleAI = useCallback(() => {
    const s = simRef.current;
    const token = s.token;
    s.thinking = true;
    const later = (ms, fn) =>
      setTimeout(() => {
        if (simRef.current.token === token && gameRef.current.winner === null) fn();
      }, ms);
    later(800, () => {
      const g = gameRef.current;
      if (g.ballInHand) {
        const pos = chooseCuePosition(g);
        g.world.balls[0].x = pos.x;
        g.world.balls[0].y = pos.y;
        g.ballInHand = false;
      }
      const shot = chooseShot(g, levelRef.current);
      s.phase = 'aiming';
      s.aim = shot.angle;
      s.pull = 0;
      sync();
      later(750, () => fire(shot.angle, shot.speed));
    });
  }, [fire, sync]);

  const beginTurn = useCallback(() => {
    const g = gameRef.current;
    const s = simRef.current;
    if (g.winner !== null) {
      s.phase = 'over';
      s.thinking = false;
      sync();
      return;
    }
    s.phase = g.ballInHand ? 'placing' : 'aiming';
    s.power = 0;
    s.pull = 0;
    setPower(0);
    // mira inicial: na bola válida mais perto da branca
    const cue = g.world.balls[0];
    const targets = legalTargets(g).sort((a, b) => Math.hypot(a.x - cue.x, a.y - cue.y) - Math.hypot(b.x - cue.x, b.y - cue.y));
    if (targets[0]) s.aim = Math.atan2(targets[0].y - cue.y, targets[0].x - cue.x);
    if (isAI(g.turn)) scheduleAI();
    else s.thinking = false;
    sync();
  }, [scheduleAI, sync]);

  const startGame = useCallback(() => {
    const s = simRef.current;
    s.token++;
    s.thinking = false;
    s.strike = null;
    s.acc = 0;
    gameRef.current = newGame();
    s.message = modeRef.current === 'ai' ? 'Você começa: mire e dê a tacada.' : 'Jogador 1 começa: mire e dê a tacada.';
    beginTurn();
  }, [beginTurn]);

  const finishShot = useCallback(() => {
    const g = gameRef.current;
    const s = simRef.current;
    const shot = g.world.shot;
    const me = g.turn;
    const res = evaluateShot(g, shot, g.world.balls);
    applyResult(g, res);
    let msg;
    if (g.winner !== null) msg = `${nameOf(g.winner)} venceu: ${g.reason}.`;
    else if (res.foul) msg = `Falta: ${res.reasons[0]}. ${nameOf(g.turn)} joga com a bola na mão.`;
    else if (res.assign) msg = `${nameOf(me)} ficou com as ${GROUP_LABEL[res.assign]}${res.continues ? ' e continua' : ''}.`;
    else if (res.continues) msg = `${nameOf(me)} encaçapou e joga de novo.`;
    else msg = turnText(g.turn);
    if (res.respot8 && !res.foul) msg = 'A bola 8 caiu na quebra e voltou para a mesa. ' + msg;
    s.message = msg;
    beginTurn();
  }, [beginTurn]);

  // tamanho do canvas: a mesa gira em pé quando a tela é vertical
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const portrait = window.innerHeight > window.innerWidth;
    const cw = box.clientWidth;
    // espaço que realmente sobra: da posição da mesa até o fim da tela, menos a linha de status e a barra de força
    const sideControls = window.matchMedia('(orientation: landscape) and (max-height: 560px)').matches;
    const top = box.getBoundingClientRect().top + window.scrollY;
    const ctrlH = controlsRef.current ? controlsRef.current.getBoundingClientRect().height : 100;
    const ah = Math.max(240, window.innerHeight - top - (sideControls ? 16 : ctrlH + 12 + 16));
    const ratio = portrait ? H / W : W / H; // largura / altura
    const cssW = Math.floor(Math.min(cw, ah * ratio));
    const cssH = Math.floor(cssW / ratio);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    viewRef.current = { portrait, s: cssW / (portrait ? H : W), dpr };
  }, []);

  useEffect(() => {
    sfxRef.current = makeSfx();
    startGame();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(boxRef.current);
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      const g = gameRef.current;
      const s = simRef.current;
      const v = viewRef.current;

      if (s.phase === 'aiming' && s.keyCharge) {
        s.power = Math.min(1, s.power + dt * 0.8);
        s.pull = s.power * 70;
        setPower(s.power);
      }
      let strikePull = null;
      if (s.phase === 'striking') {
        const t = (now - s.strike.t0) / 110;
        strikePull = s.strike.pull0 * (1 - Math.min(1, t)) - (R + 4) * Math.min(1, t);
        if (t >= 1) {
          const cue = g.world.balls[0];
          cue.vx = Math.cos(s.strike.angle) * s.strike.speed;
          cue.vy = Math.sin(s.strike.angle) * s.strike.speed;
          g.world.shot = newShot();
          s.phase = 'rolling';
          s.rolling = 0;
          s.pull = 0;
          s.acc = 0;
          if (soundRef.current) sfxRef.current.play('ball', s.strike.speed);
        }
      } else if (s.phase === 'rolling') {
        s.acc += dt;
        s.rolling += dt;
        while (s.acc >= STEP) {
          stepWorld(g.world, STEP, soundRef.current ? (type, k) => sfxRef.current.play(type, k) : undefined);
          s.acc -= STEP;
        }
        if (!anyMoving(g.world) || s.rolling > 30) {
          for (const b of g.world.balls) b.vx = b.vy = 0;
          finishShot();
        }
      }

      // desenho
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const k = v.s * v.dpr;
      if (v.portrait) ctx.setTransform(0, k, -k, 0, H * k, 0);
      else ctx.setTransform(k, 0, 0, k, 0, 0);
      const cue = g.world.balls[0];
      const ai = isAI(g.turn);
      drawScene(ctx, g, {
        aim: s.aim,
        pull: strikePull !== null ? strikePull : s.pull,
        guide: !ai && s.phase === 'aiming',
        stick: (s.phase === 'aiming' || s.phase === 'striking') && !cue.pocketed,
        placing: s.phase === 'placing' && !ai,
        upright: v.portrait ? -Math.PI / 2 : 0,
        time: now / 1000,
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      simRef.current.token++;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resize();
  }, [!!ui, ui && ui.groups[0], mode, resize]);

  // trocar de modo começa outra partida
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    startGame();
  }, [mode, startGame]);

  // Teclado (computador): setas giram a mira, Espaço carrega a força e solta a tacada
  useEffect(() => {
    const down = (e) => {
      const s = simRef.current;
      if (!humanTurn() || s.phase !== 'aiming') return;
      if (e.key === 'ArrowLeft') s.aim -= e.shiftKey ? 0.002 : 0.012;
      else if (e.key === 'ArrowRight') s.aim += e.shiftKey ? 0.002 : 0.012;
      else if (e.key === ' ' && !e.repeat) {
        s.keyCharge = true;
        s.power = 0.05;
      } else return;
      e.preventDefault();
    };
    const up = (e) => {
      const s = simRef.current;
      if (e.key === ' ' && s.keyCharge) {
        s.keyCharge = false;
        if (humanTurn() && s.phase === 'aiming' && s.power > 0.06) fire(s.aim, speedForPower(s.power));
        else {
          s.power = 0;
          s.pull = 0;
          setPower(0);
        }
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fire]);

  // ---- ponteiro na mesa: mirar (ou posicionar a branca) ----
  const toLogical = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const v = viewRef.current;
    return v.portrait ? { x: py / v.s, y: H - px / v.s } : { x: px / v.s, y: py / v.s };
  };
  const onTable = (e) => {
    if (!humanTurn()) return;
    const g = gameRef.current;
    const s = simRef.current;
    const p = toLogical(e);
    const cue = g.world.balls[0];
    if (s.phase === 'placing') {
      if (!s.pressed) return;
      const pos = nearestValidCuePos(g, p.x, p.y);
      cue.x = pos.x;
      cue.y = pos.y;
    } else if (Math.hypot(p.x - cue.x, p.y - cue.y) > 16) {
      s.aim = Math.atan2(p.y - cue.y, p.x - cue.x);
    }
  };
  const confirmPlacement = () => {
    const g = gameRef.current;
    const s = simRef.current;
    if (!humanTurn() || s.phase !== 'placing') return;
    g.ballInHand = false;
    s.phase = 'aiming';
    sync();
  };

  // ---- barra de força: arraste e solte para dar a tacada ----
  const barRef = useRef(null);
  const powerFrom = (e) => {
    const r = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  };
  const onBarDown = (e) => {
    sfxRef.current.unlock();
    const s = simRef.current;
    if (!humanTurn() || s.phase !== 'aiming') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.charging = true;
    s.power = powerFrom(e);
    s.pull = s.power * 70;
    setPower(s.power);
  };
  const onBarMove = (e) => {
    const s = simRef.current;
    if (!s.charging) return;
    s.power = powerFrom(e);
    s.pull = s.power * 70;
    setPower(s.power);
  };
  const onBarUp = () => {
    const s = simRef.current;
    if (!s.charging) return;
    s.charging = false;
    if (humanTurn() && s.phase === 'aiming' && s.power > 0.05) fire(s.aim, speedForPower(s.power));
    else {
      s.power = 0;
      s.pull = 0;
      setPower(0);
    }
  };

  // ---- ajuste fino da mira (segurar o botão) ----
  const fineRef = useRef(null);
  const startFine = (dir) => {
    sfxRef.current.unlock();
    const step = () => {
      if (humanTurn() && simRef.current.phase === 'aiming') simRef.current.aim += dir * 0.0045;
    };
    step();
    clearInterval(fineRef.current);
    fineRef.current = setInterval(step, 35);
  };
  const stopFine = () => clearInterval(fineRef.current);
  useEffect(() => () => clearInterval(fineRef.current), []);

  const meHuman = ui && ui.winner === null && humanTurn();
  const placing = ui && ui.phase === 'placing' && !isAI(ui.turn);

  return (
    <div className="min-h-screen bg-canvas px-4 pb-4 pt-3 md:px-8 md:pb-8">
      <header className="mx-auto mb-3 flex max-w-[1360px] items-center justify-between gap-3">
        <Link to="/" className="btn-ghost shrink-0 px-4" aria-label="Voltar ao VAH Games">
          <span aria-hidden="true">←</span>
          <span className="hidden sm:inline">VAH Games</span>
        </Link>
        <h1 className="heading min-w-0 truncate text-[18px] sm:text-heading-sm">Sinuca</h1>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className="btn-icon" onClick={() => setSound((v) => !v)} aria-label={sound ? 'Desligar som' : 'Ligar som'}>
            {sound ? '🔊' : '🔇'}
          </button>
          <button type="button" className="btn-lime px-4" onClick={startGame}>
            Novo jogo
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1360px]">
      <div className="sn-layout">
        <div className="sn-cards" style={{ gridArea: 'cards' }}>
          {ui &&
            [0, 1].map((i) => (
              <PlayerCard key={i} name={nameOf(i)} group={ui.groups[i]} pocketed={ui.pocketed} active={ui.winner === null && ui.turn === i} cleared={ui.cleared[i]} />
            ))}
        </div>

        <div style={{ gridArea: 'table' }} className="min-w-0">
          <div ref={boxRef} className="relative flex w-full justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="block touch-none select-none rounded-xs shadow-lift"
                aria-label="Mesa de sinuca"
                onPointerDown={(e) => {
                  sfxRef.current.unlock();
                  simRef.current.pressed = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onTable(e);
                }}
                onPointerMove={(e) => (simRef.current.pressed || e.pointerType === 'mouse') && onTable(e)}
                onPointerUp={() => (simRef.current.pressed = false)}
                onPointerCancel={() => (simRef.current.pressed = false)}
              />
              {ui && ui.winner !== null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xs bg-canvas/80 p-5 text-center">
                  <p className="font-display text-[26px] font-black uppercase text-lime">{mode === 'ai' ? (ui.winner === 0 ? 'Você venceu!' : 'O computador venceu') : `${nameOf(ui.winner)} venceu!`}</p>
                  <p className="text-body-md text-body">{ui.reason}.</p>
                  <button type="button" className="btn-lime px-6" onClick={startGame}>
                    Jogar de novo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div ref={controlsRef} style={{ gridArea: 'controls' }} className="flex min-w-0 flex-col gap-2">
          <p className="min-h-[38px] text-center text-[14px] font-bold leading-tight text-ink" role="status" aria-live="polite">
            {ui ? (ui.phase === 'striking' || ui.phase === 'rolling' ? 'Bolas em movimento…' : ui.thinking ? `${nameOf(ui.turn)} está jogando…` : ui.message) : ''}
          </p>

          {placing ? (
            <div className="flex items-center gap-3">
              <p className="flex-1 text-[14px] font-bold text-lime">Bola na mão: arraste a bola branca para onde quiser.</p>
              <button type="button" className="btn-lime px-6" onClick={confirmPlacement}>
                Confirmar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" className="btn-ghost h-12 w-12 shrink-0 px-0 text-[18px]" aria-label="Mirar um pouco para a esquerda" onPointerDown={() => startFine(-1)} onPointerUp={stopFine} onPointerLeave={stopFine} onPointerCancel={stopFine}>
                ◀
              </button>
              <div
                ref={barRef}
                role="slider"
                aria-label="Força da tacada"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(power * 100)}
                className="relative h-12 min-w-0 flex-1 touch-none select-none overflow-hidden rounded-full bg-white/10"
                onPointerDown={onBarDown}
                onPointerMove={onBarMove}
                onPointerUp={onBarUp}
                onPointerCancel={onBarUp}
              >
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${power * 100}%`, background: 'linear-gradient(90deg, #C7FF5B, #FFD34D 60%, #FF5470)' }} />
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-ink mix-blend-difference">
                  {power > 0 ? `Força ${Math.round(power * 100)}%` : meHuman ? 'Arraste e solte para dar a tacada' : ui && ui.winner !== null ? 'Fim de jogo' : 'Aguarde a sua vez'}
                </span>
              </div>
              <button type="button" className="btn-ghost h-12 w-12 shrink-0 px-0 text-[18px]" aria-label="Mirar um pouco para a direita" onPointerDown={() => startFine(1)} onPointerUp={stopFine} onPointerLeave={stopFine} onPointerCancel={stopFine}>
                ▶
              </button>
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4" style={{ gridArea: 'aside' }}>
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
            {mode === 'ai' && <Segmented label="Dificuldade" value={level} onChange={setLevel} options={LEVELS} />}
          </div>
          <details className="panel" open>
            <summary className="cursor-pointer text-body-lg font-extrabold text-ink">Como jogar</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body-md text-body">
              <li>Toque ou arraste na mesa para mirar; os botões ◀ ▶ ajustam a mira bem de leve.</li>
              <li>Puxe a barra de força com o dedo e solte para dar a tacada. No computador: setas giram a mira e Espaço carrega e solta.</li>
              <li>Quem encaçapa a primeira bola escolhe o grupo: lisas (1 a 7) ou listradas (9 a 15).</li>
              <li>Encaçapou uma bola do seu grupo, joga de novo. Limpou o grupo, a bola 8 é a última: encaçape-a para vencer.</li>
              <li>Falta (branca na caçapa, bola errada primeiro, nenhuma bola na tabela): o adversário joga com a bola na mão.</li>
              <li>Se a 8 cair antes da hora, ou junto com uma falta, quem jogou perde.</li>
            </ul>
          </details>
        </aside>
      </div>
      </main>
    </div>
  );
}
