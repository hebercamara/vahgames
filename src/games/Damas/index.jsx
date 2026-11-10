import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SIZE, applyMove, colorOf, initialState, isKing, legalMoves, result, sameSquare } from './logic';
import './vidro.css';

// Damas do VAH Games — regra brasileira, contra o computador ou 2 jogadores no mesmo aparelho.
// Visual vitrificado: tabuleiro e peças de vidro (public/images/damas). Azuis = 'w' (começam), Laranjas = 'b'.

const LEVELS = [
  { value: 'facil', label: 'Fácil', depth: 1, randomness: 60 },
  { value: 'medio', label: 'Médio', depth: 3, randomness: 20 },
  { value: 'dificil', label: 'Difícil', depth: 5, randomness: 5 },
  { value: 'mestre', label: 'Mestre', depth: 7, randomness: 0 },
];

const IMG = '/images/damas';
// Posição da grade 8x8 dentro da imagem do tabuleiro (em %)
const GRID = { x0: 3.44, x1: 96.91, y0: 4.11, y1: 96.48 };
const cellW = (GRID.x1 - GRID.x0) / SIZE;
const cellH = (GRID.y1 - GRID.y0) / SIZE;

const TEAM = {
  w: { name: 'Azuis', file: 'azul', ink: '#5BC8FF' },
  b: { name: 'Laranjas', file: 'laranja', ink: '#FF9F1C' },
};
const colorName = (c) => TEAM[c].name;
const squareName = ([r, c]) => `${'abcdefgh'[c]}${SIZE - r}`;
const moveName = (m) => m.path.map(squareName).join(m.captured.length ? '×' : '–');

function statusText(state, outcome, mode, human, thinking, mustCapture) {
  if (outcome) {
    if (!outcome.winner) return `Empate (${outcome.reason}).`;
    if (mode === 'ai') return outcome.winner === human ? 'Você venceu! 🏆' : 'O computador venceu.';
    return `${colorName(outcome.winner)} vencem! 🏆`;
  }
  if (thinking) return 'Computador pensando…';
  const who = mode === 'ai' ? 'Sua vez' : `Vez das ${colorName(state.turn)}`;
  return mustCapture ? `${who}: captura obrigatória!` : who;
}

const pieceSrc = (piece) => `${IMG}/${TEAM[colorOf(piece)].file}${isKing(piece) ? '-dama' : ''}.webp`;

function GlassOptions({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="vd-label">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button key={String(opt.value)} type="button" role="radio" aria-checked={opt.value === value} className="vd-btn" onClick={() => onChange(opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DamasGame() {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([]); // [{ state, move }]
  const [mode, setMode] = useState('ai');
  const [level, setLevel] = useState('medio');
  const [human, setHuman] = useState('w');
  const [path, setPath] = useState([]); // casas já escolhidas do lance em andamento
  const [thinking, setThinking] = useState(false);
  const workerRef = useRef(null);
  const requestRef = useRef(0);

  const moves = useMemo(() => legalMoves(state), [state]);
  const outcome = useMemo(() => result(state, moves), [state, moves]);
  const mustCapture = moves.length > 0 && moves[0].captured.length > 0;
  const aiTurn = mode === 'ai' && state.turn !== human && !outcome;
  const humanCanPlay = !outcome && !thinking && !aiTurn;
  const lastMove = history.length ? history[history.length - 1].move : null;

  useEffect(() => {
    const worker = new Worker(new URL('./aiWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const play = (move) => {
    setHistory((h) => [...h, { state, move }]);
    setState(applyMove(state, move));
    setPath([]);
  };

  // Vez do computador
  useEffect(() => {
    if (!aiTurn || !workerRef.current) return undefined;
    const id = ++requestRef.current;
    const worker = workerRef.current;
    const { depth, randomness } = LEVELS.find((l) => l.value === level);
    setThinking(true);
    const onMessage = (e) => {
      if (e.data.id !== id) return;
      setThinking(false);
      if (e.data.move) {
        setHistory((h) => [...h, { state, move: e.data.move }]);
        setState(applyMove(state, e.data.move));
      }
    };
    worker.addEventListener('message', onMessage);
    const t = setTimeout(() => worker.postMessage({ id, state, depth, randomness }), 450);
    return () => {
      clearTimeout(t);
      worker.removeEventListener('message', onMessage);
    };
  }, [aiTurn, state, level]);

  // Lances compatíveis com as casas já escolhidas
  const candidates = useMemo(
    () => moves.filter((m) => path.length <= m.path.length && path.every((sq, i) => sameSquare(sq, m.path[i]))),
    [moves, path],
  );
  const nextSquares = path.length ? candidates.map((m) => m.path[path.length]).filter(Boolean) : [];
  const movablePieces = moves.map((m) => m.path[0]);
  const pendingCaptures = path.length > 1 ? candidates[0]?.captured.slice(0, path.length - 1) ?? [] : [];

  const onSquare = (r, c) => {
    if (!humanCanPlay) return;
    const sq = [r, c];
    if (path.length && nextSquares.some((s) => sameSquare(s, sq))) {
      const newPath = [...path, sq];
      const done = candidates.find((m) => m.path.length === newPath.length && newPath.every((s, i) => sameSquare(s, m.path[i])));
      if (done) play(done);
      else setPath(newPath);
      return;
    }
    if (movablePieces.some((s) => sameSquare(s, sq))) {
      setPath(path.length === 1 && sameSquare(path[0], sq) ? [] : [sq]);
      return;
    }
    setPath([]);
  };

  const newGame = (opts = {}) => {
    requestRef.current++;
    setThinking(false);
    setState(initialState());
    setHistory([]);
    setPath([]);
    if (opts.mode) setMode(opts.mode);
    if (opts.human) setHuman(opts.human);
  };

  const undo = () => {
    requestRef.current++;
    setThinking(false);
    setPath([]);
    let h = history;
    if (!h.length) return;
    let prev = h[h.length - 1].state;
    h = h.slice(0, -1);
    if (mode === 'ai' && prev.turn !== human && h.length) {
      prev = h[h.length - 1].state;
      h = h.slice(0, -1);
    }
    setHistory(h);
    setState(prev);
  };

  const flipped = mode === 'ai' && human === 'b';
  const view = (r, c) => (flipped ? [SIZE - 1 - r, SIZE - 1 - c] : [r, c]);
  const count = (color) => state.board.flat().filter((p) => colorOf(p) === color).length;
  const cells = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) cells.push([r, c]);

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i].move, history[i + 1]?.move]);

  return (
    <div className="vd-page min-h-screen px-4 pb-12 pt-4 md:px-8">
      <header className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-3">
        <Link to="/" className="vd-btn shrink-0" aria-label="Voltar ao VAH Games">
          <span aria-hidden="true">←</span>
          <span className="hidden sm:inline">VAH Games</span>
        </Link>
        <h1 className="vd-title min-w-0 truncate">Damas</h1>
        <button type="button" className="vd-btn vd-btn-primary shrink-0" onClick={() => newGame()}>
          Novo jogo
        </button>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <div className="w-full min-w-0">
          <div className="vd-board relative w-full" style={{ aspectRatio: '842 / 852' }} role="grid" aria-label="Tabuleiro de damas">
            <img src={`${IMG}/tabuleiro.webp`} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
            {cells.map(([r, c]) => {
              const [vr, vc] = view(r, c);
              const dark = (r + c) % 2 === 1;
              const piece = state.board[r][c];
              const sq = [r, c];
              const isSelected = path.some((s) => sameSquare(s, sq));
              const isNext = nextSquares.some((s) => sameSquare(s, sq));
              const isMovable = humanCanPlay && !path.length && movablePieces.some((s) => sameSquare(s, sq));
              const isLast = lastMove && (sameSquare(lastMove.path[0], sq) || sameSquare(lastMove.path[lastMove.path.length - 1], sq));
              const isPending = pendingCaptures.some((s) => sameSquare(s, sq));
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  role="gridcell"
                  aria-label={`${squareName(sq)}${piece ? `, peça ${TEAM[colorOf(piece)].file}${isKing(piece) ? ' (dama)' : ''}` : ''}`}
                  onClick={() => onSquare(r, c)}
                  disabled={!dark}
                  className="absolute flex items-center justify-center disabled:cursor-default"
                  style={{ left: `${GRID.x0 + vc * cellW}%`, top: `${GRID.y0 + vr * cellH}%`, width: `${cellW}%`, height: `${cellH}%` }}
                >
                  {isLast && dark && <span className="vd-last absolute inset-[6%]" />}
                  {isSelected && <span className="vd-selected absolute inset-[4%]" />}
                  {piece && (
                    <img
                      src={pieceSrc(piece)}
                      alt=""
                      draggable={false}
                      className={`vd-piece relative h-[84%] w-[84%] ${isPending ? 'opacity-35' : ''} ${isMovable ? 'vd-piece-movable' : ''}`}
                    />
                  )}
                  {isMovable && mustCapture && <span className="vd-must pointer-events-none absolute inset-[6%]" />}
                  {isNext && <span className="vd-dot pointer-events-none absolute" />}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className={`vd-panel ${outcome ? 'vd-panel-win' : ''}`}>
            <p className="vd-label">Situação</p>
            <p className="mt-1 text-[22px] font-black leading-tight text-white" role="status" aria-live="polite">
              {statusText(state, outcome, mode, human, thinking, mustCapture)}
            </p>
            <div className="mt-3 flex items-center gap-4 text-[15px] font-bold text-white/85">
              <span className="flex items-center gap-2">
                <img src={`${IMG}/azul.webp`} alt="" className="h-6 w-6" /> {count('w')}
              </span>
              <span className="flex items-center gap-2">
                <img src={`${IMG}/laranja.webp`} alt="" className="h-6 w-6" /> {count('b')}
              </span>
            </div>
          </div>

          <div className="vd-panel flex flex-col gap-4">
            <GlassOptions
              label="Modo"
              value={mode}
              onChange={(m) => newGame({ mode: m })}
              options={[
                { value: 'ai', label: 'Contra o computador' },
                { value: 'pvp', label: '2 jogadores' },
              ]}
            />
            {mode === 'ai' && (
              <>
                <GlassOptions label="Dificuldade" value={level} onChange={setLevel} options={LEVELS} />
                <GlassOptions
                  label="Jogar com"
                  value={human}
                  onChange={(c) => newGame({ human: c })}
                  options={[
                    { value: 'w', label: 'Azuis' },
                    { value: 'b', label: 'Laranjas' },
                  ]}
                />
              </>
            )}
            <div>
              <button type="button" className="vd-btn" onClick={undo} disabled={history.length === 0}>
                Desfazer lance
              </button>
            </div>
          </div>

          <div className="vd-panel">
            <h2 className="vd-subtitle mb-3">Lances</h2>
            {pairs.length === 0 ? (
              <p className="text-[14px] text-white/70">Toque numa peça e depois na casa de destino. Nas capturas em sequência, toque em cada parada.</p>
            ) : (
              <ol className="grid max-h-56 grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 overflow-y-auto text-[14px]">
                {pairs.map(([a, b], i) => (
                  <React.Fragment key={i}>
                    <span className="text-white/50">{i + 1}.</span>
                    <span className="font-bold" style={{ color: TEAM.w.ink }}>{moveName(a)}</span>
                    <span className="font-bold" style={{ color: TEAM.b.ink }}>{b ? moveName(b) : ''}</span>
                  </React.Fragment>
                ))}
              </ol>
            )}
          </div>

          <details className="vd-panel">
            <summary className="vd-subtitle cursor-pointer">Regras (brasileiras)</summary>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[14px] text-white/80">
              <li>As Azuis começam. As pedras andam uma casa na diagonal, para frente.</li>
              <li>Capturar é obrigatório, inclusive para trás, e vale a jogada que captura mais peças.</li>
              <li>A pedra que termina o lance na última fileira vira dama (a peça com a estrela).</li>
              <li>A dama anda e captura a qualquer distância na diagonal.</li>
              <li>Vence quem capturar ou bloquear todas as peças do adversário.</li>
              <li>Após 20 lances seguidos só de damas, sem captura, o jogo empata.</li>
            </ul>
          </details>
        </aside>
      </main>
    </div>
  );
}
