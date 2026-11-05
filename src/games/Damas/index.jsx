import React, { useEffect, useMemo, useRef, useState } from 'react';
import GamePage, { Segmented } from '../../components/GamePage';
import { SIZE, applyMove, colorOf, initialState, isKing, legalMoves, result, sameSquare } from './logic';

// Damas do VAH Games — regra brasileira, contra o computador ou 2 jogadores no mesmo aparelho.

const LEVELS = [
  { value: 'facil', label: 'Fácil', depth: 1, randomness: 60 },
  { value: 'medio', label: 'Médio', depth: 3, randomness: 20 },
  { value: 'dificil', label: 'Difícil', depth: 5, randomness: 5 },
  { value: 'mestre', label: 'Mestre', depth: 7, randomness: 0 },
];

const colorName = (c) => (c === 'w' ? 'Claras' : 'Escuras');
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
  return mustCapture ? `${who} — captura obrigatória!` : who;
}

const Piece = ({ piece }) => {
  const light = colorOf(piece) === 'w';
  return (
    <span
      className={`relative flex h-[78%] w-[78%] items-center justify-center rounded-full shadow-micro ${
        light ? 'bg-light-fill text-navy ring-[3px] ring-inset ring-neutral-1' : 'bg-canvas text-lime ring-[3px] ring-inset ring-navy'
      }`}
    >
      <span className={`absolute inset-[22%] rounded-full ${light ? 'border-2 border-neutral-1' : 'border-2 border-navy'}`} />
      {isKing(piece) && (
        <svg viewBox="0 0 24 24" className="relative h-1/2 w-1/2" fill="currentColor" aria-hidden="true">
          <path d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-2 10H5L3 8zm2 12h14v2H5v-2z" />
        </svg>
      )}
    </span>
  );
};

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
  const rows = [...Array(SIZE).keys()];
  const order = flipped ? [...rows].reverse() : rows;
  const count = (color) => state.board.flat().filter((p) => colorOf(p) === color).length;

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i].move, history[i + 1]?.move]);

  return (
    <GamePage
      title="Damas"
      actions={
        <button type="button" className="btn-lime" onClick={() => newGame()}>
          Novo jogo
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <div className="w-full min-w-0">
          <div
            className="grid aspect-square w-full max-w-[640px] grid-cols-8 overflow-hidden rounded-xs border-2 border-line"
            role="grid"
            aria-label="Tabuleiro de damas"
          >
            {order.map((r) =>
              (flipped ? [...rows].reverse() : rows).map((c) => {
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
                    aria-label={`${squareName(sq)}${piece ? (colorOf(piece) === 'w' ? ', peça clara' : ', peça escura') + (isKing(piece) ? ' (dama)' : '') : ''}`}
                    onClick={() => onSquare(r, c)}
                    disabled={!dark}
                    className={`relative flex items-center justify-center ${dark ? 'bg-lavender' : 'bg-neutral-1'} ${
                      isLast && dark ? '!bg-[#9DB86A]' : ''
                    } ${isSelected ? '!bg-violet-bright' : ''} disabled:cursor-default`}
                  >
                    {piece && (
                      <span className={`flex h-full w-full items-center justify-center transition ${isPending ? 'opacity-40' : ''} ${isMovable ? 'cursor-pointer hover:scale-105' : ''}`}>
                        <Piece piece={piece} />
                      </span>
                    )}
                    {isMovable && mustCapture && <span className="pointer-events-none absolute inset-1 rounded-full ring-2 ring-lime" />}
                    {isNext && <span className="pointer-events-none absolute h-1/3 w-1/3 rounded-full bg-lime shadow-micro" />}
                    {c === (flipped ? SIZE - 1 : 0) && (
                      <span className="pointer-events-none absolute left-1 top-0.5 text-[10px] font-bold text-navy/70">{SIZE - r}</span>
                    )}
                    {r === (flipped ? 0 : SIZE - 1) && (
                      <span className="pointer-events-none absolute bottom-0.5 right-1 text-[10px] font-bold text-navy/70">{'abcdefgh'[c]}</span>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className={`rounded-xs p-5 ${outcome ? 'bg-grad-green' : 'bg-grad-rose'}`}>
            <p className="text-caption uppercase text-muted">Situação</p>
            <p className="mt-1 text-heading-xs font-black text-ink" role="status" aria-live="polite">
              {statusText(state, outcome, mode, human, thinking, mustCapture)}
            </p>
            <p className="mt-2 text-body-md text-body">
              Claras: <b className="text-ink">{count('w')}</b> · Escuras: <b className="text-ink">{count('b')}</b>
            </p>
          </div>

          <div className="panel flex flex-col gap-4">
            <Segmented
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
                <Segmented label="Dificuldade" value={level} onChange={setLevel} options={LEVELS} />
                <Segmented
                  label="Jogar com"
                  value={human}
                  onChange={(c) => newGame({ human: c })}
                  options={[
                    { value: 'w', label: 'Claras' },
                    { value: 'b', label: 'Escuras' },
                  ]}
                />
              </>
            )}
            <div>
              <button type="button" className="btn-ghost px-4" onClick={undo} disabled={history.length === 0}>
                Desfazer lance
              </button>
            </div>
          </div>

          <div className="panel">
            <h2 className="subheading mb-3">Lances</h2>
            {pairs.length === 0 ? (
              <p className="text-body-md text-muted">Toque numa peça e depois na casa de destino. Nas capturas em sequência, toque em cada parada.</p>
            ) : (
              <ol className="grid max-h-56 grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 overflow-y-auto text-body-md">
                {pairs.map(([a, b], i) => (
                  <React.Fragment key={i}>
                    <span className="text-muted">{i + 1}.</span>
                    <span className="font-bold text-ink">{moveName(a)}</span>
                    <span className="font-bold text-ink">{b ? moveName(b) : ''}</span>
                  </React.Fragment>
                ))}
              </ol>
            )}
          </div>

          <details className="panel group">
            <summary className="cursor-pointer text-body-lg font-extrabold text-ink">Regras (brasileiras)</summary>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-body-md text-body">
              <li>As Claras começam. As pedras andam uma casa na diagonal, para frente.</li>
              <li>Capturar é obrigatório, inclusive para trás, e vale a jogada que captura mais peças.</li>
              <li>A pedra que termina o lance na última fileira vira dama.</li>
              <li>A dama anda e captura a qualquer distância na diagonal.</li>
              <li>Vence quem capturar ou bloquear todas as peças do adversário.</li>
              <li>Após 20 lances seguidos só de damas, sem captura, o jogo empata.</li>
            </ul>
          </details>
        </aside>
      </div>
    </GamePage>
  );
}
