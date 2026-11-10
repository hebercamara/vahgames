import React, { useEffect, useMemo, useRef, useState } from 'react';
import GamePage, { Segmented } from '../../components/GamePage';
import { BLUE, CARDS, RED, SIZE, TEMPLE, applyMove, colorOf, initialState, isMaster, legalMoves, other, result, sameSquare } from './logic';

// Duelo de Mestres do VAH Games — tabuleiro 5x5 com cartas de movimento,
// contra o computador ou 2 jogadores no mesmo aparelho.

const LEVELS = [
  { value: 'facil', label: 'Fácil', depth: 1, randomness: 80 },
  { value: 'medio', label: 'Médio', depth: 3, randomness: 20 },
  { value: 'dificil', label: 'Difícil', depth: 5, randomness: 5 },
  { value: 'mestre', label: 'Mestre', depth: 6, randomness: 0 },
];

const TEAM = {
  [BLUE]: { name: 'Azul', hex: '#4F8DFF', ring: 'ring-[#B9D2FF]' },
  [RED]: { name: 'Vermelho', hex: '#FF5470', ring: 'ring-[#FFC2CD]' },
};

// Nome das casas do ponto de vista do Azul: colunas a–e, fileiras 1–5
const squareName = ([r, c]) => `${'abcde'[c]}${SIZE - r}`;
const moveName = (m) => (m.from ? `${squareName(m.from)}–${squareName(m.to)}` : 'passou');

function statusText(state, outcome, mode, human, thinking, mustPass) {
  if (outcome) {
    if (mode === 'ai') return outcome.winner === human ? 'Você venceu! 🏆' : 'O computador venceu.';
    return `${TEAM[outcome.winner].name} vence! 🏆`;
  }
  if (thinking) return 'Computador pensando…';
  const who = mode === 'ai' ? 'Sua vez' : `Vez do ${TEAM[state.turn].name}`;
  return mustPass ? `${who} — sem movimentos: escolha uma carta para trocar.` : who;
}

const MasterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="currentColor" aria-hidden="true">
    <path d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-2 10H5L3 8zm2 12h14v2H5v-2z" />
  </svg>
);

const TempleIcon = ({ color }) => (
  <svg viewBox="0 0 24 24" className="pointer-events-none absolute aspect-square w-[46%] opacity-40" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M3 6h18M5 10h14M7 6v14M17 6v14M4 3c5 2 11 2 16 0" />
  </svg>
);

const Piece = ({ piece }) => {
  const team = TEAM[colorOf(piece)];
  const master = isMaster(piece);
  return (
    <span
      className={`flex items-center justify-center rounded-full text-white shadow-micro ring-[3px] ring-inset ${team.ring} aspect-square ${master ? 'w-[80%]' : 'w-[62%]'}`}
      style={{ background: team.hex }}
    >
      {master && <MasterIcon />}
    </span>
  );
};

// Carta de movimento: diagrama 5x5 com a peça no centro e as casas de destino.
// facingTop: a carta é de quem está do outro lado do tabuleiro, então o desenho fica de cabeça para baixo.
// rotateAll (2 jogadores) gira a carta inteira, nome incluído, para o outro jogador ler.
function MoveCard({ id, selected, highlight, facingTop, rotateAll, disabled, onClick, label }) {
  const card = CARDS[id];
  const targets = new Set(card.moves.map(([dx, dy]) => `${2 - dy},${2 + dx}`));
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${label ?? ''}Carta ${card.name}`}
      className={`flex w-full max-w-[150px] flex-col items-center gap-2 rounded-xs p-2.5 transition sm:p-3 ${
        selected ? 'bg-lime/20 ring-[3px] ring-lime' : highlight ? 'bg-white/[0.12] ring-2 ring-white/30' : 'bg-white/[0.07]'
      } ${facingTop && rotateAll ? 'rotate-180' : ''} ${disabled ? 'cursor-default' : 'hover:bg-white/[0.14]'}`}
    >
      <div className={`grid aspect-square w-full max-w-[96px] grid-cols-5 grid-rows-5 gap-[2px] ${facingTop && !rotateAll ? 'rotate-180' : ''}`}>
        {[...Array(25).keys()].map((i) => {
          const r = Math.floor(i / 5);
          const c = i % 5;
          const center = r === 2 && c === 2;
          const target = targets.has(`${r},${c}`);
          return <span key={i} className={`rounded-[3px] ${center ? 'bg-ink' : target ? 'bg-lime' : 'bg-white/10'}`} />;
        })}
      </div>
      <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink sm:text-[14px]">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TEAM[card.color].hex }} aria-hidden="true" />
        {card.name}
      </span>
    </button>
  );
}

export default function DueloDeMestresGame() {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([]); // [{ state, move, player }]
  const [mode, setMode] = useState('ai');
  const [level, setLevel] = useState('medio');
  const [human, setHuman] = useState(BLUE);
  const [selPiece, setSelPiece] = useState(null);
  const [selCard, setSelCard] = useState(null);
  const [ambiguous, setAmbiguous] = useState(null); // casa alcançável pelas duas cartas
  const [thinking, setThinking] = useState(false);
  const workerRef = useRef(null);
  const requestRef = useRef(0);

  const moves = useMemo(() => legalMoves(state), [state]);
  const outcome = useMemo(() => result(state), [state]);
  const mustPass = !outcome && moves.every((m) => !m.from);
  const aiTurn = mode === 'ai' && state.turn !== human && !outcome;
  const humanCanPlay = !outcome && !thinking && !aiTurn;
  const lastMove = history.length ? history[history.length - 1].move : null;

  useEffect(() => {
    const worker = new Worker(new URL('./aiWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const clearSelection = () => {
    setSelPiece(null);
    setSelCard(null);
    setAmbiguous(null);
  };

  const play = (move) => {
    setHistory((h) => [...h, { state, move, player: state.turn }]);
    setState(applyMove(state, move));
    clearSelection();
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
        setHistory((h) => [...h, { state, move: e.data.move, player: state.turn }]);
        setState(applyMove(state, e.data.move));
      }
    };
    worker.addEventListener('message', onMessage);
    const t = setTimeout(() => worker.postMessage({ id, state, depth, randomness }), 500);
    return () => {
      clearTimeout(t);
      worker.removeEventListener('message', onMessage);
    };
  }, [aiTurn, state, level]);

  // Destinos da peça escolhida (com a carta escolhida, ou com as duas)
  const targets = useMemo(() => {
    if (!selPiece) return [];
    return moves.filter((m) => m.from && sameSquare(m.from, selPiece) && (!selCard || m.card === selCard));
  }, [moves, selPiece, selCard]);
  const movable = useMemo(
    () => moves.filter((m) => m.from && (!selCard || m.card === selCard)).map((m) => m.from),
    [moves, selCard],
  );

  const onSquare = (r, c) => {
    if (!humanCanPlay || mustPass) return;
    const sq = [r, c];
    const options = targets.filter((m) => sameSquare(m.to, sq));
    if (options.length === 1) return play(options[0]);
    if (options.length > 1) {
      setAmbiguous(sq);
      return undefined;
    }
    setAmbiguous(null);
    if (colorOf(state.board[r][c]) === state.turn) setSelPiece(sameSquare(selPiece, sq) ? null : sq);
    else setSelPiece(null);
    return undefined;
  };

  const onCard = (card) => {
    if (!humanCanPlay) return;
    if (mustPass) return play({ card, from: null, to: null });
    if (ambiguous) {
      const move = targets.find((m) => m.card === card && sameSquare(m.to, ambiguous));
      if (move) return play(move);
    }
    setAmbiguous(null);
    setSelCard(selCard === card ? null : card);
    return undefined;
  };

  const newGame = (opts = {}) => {
    requestRef.current++;
    setThinking(false);
    setState(initialState());
    setHistory([]);
    clearSelection();
    if (opts.mode) setMode(opts.mode);
    if (opts.human) setHuman(opts.human);
  };

  const undo = () => {
    requestRef.current++;
    setThinking(false);
    clearSelection();
    if (!history.length) return;
    let h = history.slice(0, -1);
    let prev = history[history.length - 1].state;
    // Contra o computador, volta até a vez do jogador
    while (mode === 'ai' && prev.turn !== human && h.length) {
      prev = h[h.length - 1].state;
      h = h.slice(0, -1);
    }
    setHistory(h);
    setState(prev);
  };

  // Quem fica embaixo: o jogador humano (contra o computador) ou o Azul (2 jogadores)
  const bottom = mode === 'ai' ? human : BLUE;
  const top = other(bottom);
  const flipped = bottom === RED;
  const idx = [...Array(SIZE).keys()];
  const order = flipped ? [...idx].reverse() : idx;
  const lost = (p) => 5 - state.board.flat().filter((x) => colorOf(x) === p).length;

  const renderHand = (player) => {
    const isTop = player === top;
    const active = humanCanPlay && state.turn === player;
    const playerLabel = mode === 'ai' ? (player === human ? 'Você' : 'Computador') : TEAM[player].name;
    return (
      <div className={`flex items-center gap-3 ${isTop ? 'flex-row-reverse' : ''}`}>
        <div className="flex flex-1 justify-center gap-3">
          {state.hands[player].map((card) => (
            <MoveCard
              key={card}
              id={card}
              label={`${playerLabel}: `}
              selected={active && selCard === card}
              highlight={active && (mustPass || !!ambiguous)}
              facingTop={isTop}
              rotateAll={mode === 'pvp'}
              disabled={!active}
              onClick={() => onCard(card)}
            />
          ))}
        </div>
        <div className={`flex w-20 shrink-0 flex-col items-center gap-1 text-center sm:w-24 ${isTop && mode === 'pvp' ? 'rotate-180' : ''}`}>
          <span className="h-3 w-3 rounded-full" style={{ background: TEAM[player].hex }} aria-hidden="true" />
          <span className="text-caption uppercase text-muted">{playerLabel}</span>
          {state.turn === player && !outcome && <span className="text-caption font-bold text-lime">na vez</span>}
        </div>
      </div>
    );
  };

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1]]);

  return (
    <GamePage
      title="Duelo de Mestres"
      actions={
        <button type="button" className="btn-lime" onClick={() => newGame()}>
          Novo jogo
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <div className="flex w-full min-w-0 flex-col gap-3">
          {renderHand(top)}

          <div className="flex items-center gap-3">
            <div
              className="grid aspect-square w-full min-w-0 flex-1 grid-cols-5 grid-rows-5 gap-1 rounded-xs bg-navy/60 p-1.5 sm:gap-1.5 sm:p-2"
              role="grid"
              aria-label="Tabuleiro do Duelo de Mestres"
            >
              {order.map((r) =>
                order.map((c) => {
                  const sq = [r, c];
                  const piece = state.board[r][c];
                  const templeOf = sameSquare(sq, TEMPLE[BLUE]) ? BLUE : sameSquare(sq, TEMPLE[RED]) ? RED : null;
                  const isSel = sameSquare(selPiece, sq);
                  const isTarget = targets.some((m) => sameSquare(m.to, sq));
                  const isAmb = sameSquare(ambiguous, sq);
                  const isMovable = humanCanPlay && !mustPass && !selPiece && movable.some((s) => sameSquare(s, sq));
                  const isLast = lastMove?.from && (sameSquare(lastMove.from, sq) || sameSquare(lastMove.to, sq));
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      role="gridcell"
                      aria-label={`${squareName(sq)}${piece ? `, ${isMaster(piece) ? 'mestre' : 'aprendiz'} ${TEAM[colorOf(piece)].name.toLowerCase()}` : ''}${templeOf ? `, templo ${TEAM[templeOf].name.toLowerCase()}` : ''}`}
                      onClick={() => onSquare(r, c)}
                      className={`relative flex items-center justify-center rounded-[10px] transition ${
                        isSel ? 'bg-violet-bright/70' : isLast ? 'bg-[#9DB86A]/50' : 'bg-white/[0.09]'
                      } ${isMovable ? 'cursor-pointer hover:bg-white/20' : ''}`}
                    >
                      {templeOf && <TempleIcon color={TEAM[templeOf].hex} />}
                      {piece && <Piece piece={piece} />}
                      {isTarget && (
                        <span
                          className={`pointer-events-none absolute rounded-full ${
                            piece ? 'inset-1 ring-[3px] ring-lime' : 'aspect-square w-1/4 bg-lime shadow-micro'
                          } ${isAmb ? 'animate-pulse' : ''}`}
                        />
                      )}
                      {isMovable && <span className="pointer-events-none absolute inset-1 rounded-[8px] ring-1 ring-white/30" />}
                    </button>
                  );
                }),
              )}
            </div>

            <div className="flex w-[84px] shrink-0 flex-col items-center gap-1 sm:w-[110px]">
              <span className="text-caption uppercase text-muted">Próxima</span>
              <MoveCard id={state.side} disabled facingTop={state.turn === top} rotateAll={mode === 'pvp'} />
            </div>
          </div>

          {renderHand(bottom)}
        </div>

        <aside className="flex flex-col gap-4">
          <div className={`rounded-xs p-5 ${outcome ? 'bg-grad-green' : 'bg-grad-blue'}`}>
            <p className="text-caption uppercase text-muted">Situação</p>
            <p className="mt-1 text-heading-xs font-black text-ink" role="status" aria-live="polite">
              {statusText(state, outcome, mode, human, thinking, mustPass)}
            </p>
            {outcome && <p className="mt-1 text-body-md text-body">{outcome.reason}.</p>}
            {ambiguous && <p className="mt-1 text-body-md text-body">As duas cartas chegam nessa casa: toque na carta que quer usar.</p>}
            <p className="mt-2 text-body-md text-body">
              Peças perdidas — Azul: <b className="text-ink">{lost(BLUE)}</b> · Vermelho: <b className="text-ink">{lost(RED)}</b>
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
                  onChange={(p) => newGame({ human: p })}
                  options={[
                    { value: BLUE, label: 'Azul' },
                    { value: RED, label: 'Vermelho' },
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
              <p className="text-body-md text-muted">Toque numa peça sua e depois numa casa marcada. Para usar só uma das cartas, toque nela antes.</p>
            ) : (
              <ol className="grid max-h-56 grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 overflow-y-auto text-body-md">
                {pairs.map(([a, b], i) => (
                  <React.Fragment key={i}>
                    <span className="text-muted">{i + 1}.</span>
                    {[a, b].map((h, j) => (
                      <span key={j} className="font-bold text-ink">
                        {h && (
                          <>
                            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: TEAM[h.player].hex }} aria-hidden="true" />
                            {CARDS[h.move.card].name} {moveName(h.move)}
                          </>
                        )}
                      </span>
                    ))}
                  </React.Fragment>
                ))}
              </ol>
            )}
          </div>

          <details className="panel group">
            <summary className="cursor-pointer text-body-lg font-extrabold text-ink">Regras</summary>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-body-md text-body">
              <li>Cada lado tem 1 mestre (com coroa) e 4 aprendizes. Só 5 cartas entram em cada partida: 2 para cada jogador e 1 ao lado do tabuleiro.</li>
              <li>Na sua vez, escolha uma das suas cartas e mova uma peça como mostra o desenho dela (o quadrado branco é a peça).</li>
              <li>Pode capturar peças do adversário, mas não pode cair em cima de uma peça sua nem sair do tabuleiro.</li>
              <li>A carta usada vai para o lado do tabuleiro e você pega a carta que estava lá. O adversário recebe a sua carta depois.</li>
              <li>Se não houver nenhum movimento possível, você só troca uma das suas cartas.</li>
              <li>Quem começa é a cor do carimbo da carta do lado no início.</li>
              <li>Vence quem capturar o mestre adversário (Caminho da Pedra) ou levar o seu mestre até o templo inicial do adversário (Caminho do Riacho).</li>
            </ul>
          </details>
        </aside>
      </div>
    </GamePage>
  );
}
