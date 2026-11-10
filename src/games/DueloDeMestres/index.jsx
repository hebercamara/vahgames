import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BLUE, CARDS, RED, SIZE, applyMove, colorOf, initialState, isMaster, legalMoves, other, result, sameSquare } from './logic';
import './aquarela.css';

// Duelo de Mestres do VAH Games — tabuleiro 5x5 com cartas de movimento,
// contra o computador ou 2 jogadores no mesmo aparelho.
// Visual em aquarela: tabuleiro, fichas e cartas pintados para o jogo (public/images/duelo).

const LEVELS = [
  { value: 'facil', label: 'Fácil', depth: 1, randomness: 80 },
  { value: 'medio', label: 'Médio', depth: 3, randomness: 20 },
  { value: 'dificil', label: 'Difícil', depth: 5, randomness: 5 },
  { value: 'mestre', label: 'Mestre', depth: 6, randomness: 0 },
];

const IMG = '/images/duelo';
const TEAM = {
  [BLUE]: { name: 'Azul', file: 'azul', ink: '#2F5577' },
  [RED]: { name: 'Vermelho', file: 'vermelho', ink: '#9B3442' },
};

// Posição da grade 5x5 dentro da imagem do tabuleiro (em %)
const GRID = { x0: 8.56, x1: 91.5, y0: 8.43, y1: 91.63 };
const cellW = (GRID.x1 - GRID.x0) / SIZE;
const cellH = (GRID.y1 - GRID.y0) / SIZE;

// Nome das casas do ponto de vista do Azul: colunas a–e, fileiras 1–5
const squareName = ([r, c]) => `${'abcde'[c]}${SIZE - r}`;
const moveName = (m) => (m.from ? `${squareName(m.from)}–${squareName(m.to)}` : 'trocou a carta');

function statusText(state, outcome, mode, human, thinking, mustPass) {
  if (outcome) {
    if (mode === 'ai') return outcome.winner === human ? 'Você venceu!' : 'O computador venceu.';
    return `O ${TEAM[outcome.winner].name} vence!`;
  }
  if (thinking) return 'O computador está pensando…';
  const who = mode === 'ai' ? 'Sua vez' : `Vez do ${TEAM[state.turn].name}`;
  return mustPass ? `${who}: sem movimentos, escolha uma carta para trocar.` : who;
}

// Identidade de cada ficha ao longo da partida (para cada aprendiz manter o seu desenho e deslizar)
function pieceIds(initial, history) {
  const ids = initial.board.map((row) => row.map(() => null));
  const count = { [BLUE]: 0, [RED]: 0 };
  initial.board.forEach((row, r) =>
    row.forEach((p, c) => {
      if (!p) return;
      const color = colorOf(p);
      ids[r][c] = isMaster(p) ? `${color}-mestre` : `${color}-${++count[color]}`;
    }),
  );
  for (const { move } of history) {
    if (!move.from) continue;
    ids[move.to[0]][move.to[1]] = ids[move.from[0]][move.from[1]];
    ids[move.from[0]][move.from[1]] = null;
  }
  return ids;
}

const tokenSrc = (id) => {
  const [color, which] = id.split('-');
  return which === 'mestre' ? `${IMG}/mestre-${TEAM[color].file}.webp` : `${IMG}/aprendiz-${TEAM[color].file}-${which}.webp`;
};

// Carta: desenho em aquarela clareado, diagrama de movimentos por cima e o nome embaixo.
// facingTop: carta de quem está do outro lado, com o diagrama de cabeça para baixo.
// rotateAll (2 jogadores): gira a carta inteira para o outro jogador ler.
function MoveCard({ id, selected, highlight, facingTop, rotateAll, disabled, onClick, label, small }) {
  const card = CARDS[id];
  const targets = new Set(card.moves.map(([dx, dy]) => `${2 - dy},${2 + dx}`));
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${label ?? ''}Carta ${card.name}`}
      className={`aq-card ${small ? 'max-w-[112px]' : 'max-w-[150px]'} ${selected ? 'aq-card-selected' : ''} ${highlight ? 'aq-card-hint' : ''} ${
        facingTop && rotateAll ? 'rotate-180' : ''
      } ${disabled ? 'cursor-default' : 'aq-card-active'}`}
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-[6px]">
        <img src={`${IMG}/cartas/${id}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <span className={`absolute inset-[18%] grid grid-cols-5 grid-rows-5 gap-[3%] ${facingTop && !rotateAll ? 'rotate-180' : ''}`}>
          {[...Array(25).keys()].map((i) => {
            const r = Math.floor(i / 5);
            const c = i % 5;
            const center = r === 2 && c === 2;
            const target = targets.has(`${r},${c}`);
            return <span key={i} className={`rounded-[2px] ${center ? 'aq-cell-center' : target ? 'aq-cell-target' : 'aq-cell'}`} />;
          })}
        </span>
      </span>
      <span className="mt-1.5 flex items-center justify-center gap-1.5">
        <span className="aq-stamp" style={{ background: TEAM[card.color].ink }} aria-hidden="true" />
        <span className={`aq-serif font-bold text-[#2A2F3A] ${small ? 'text-[12px]' : 'text-[13px] sm:text-[15px]'}`}>{card.name}</span>
      </span>
    </button>
  );
}

function InkOptions({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="aq-label">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button key={opt.value} type="button" role="radio" aria-checked={opt.value === value} className="aq-btn" onClick={() => onChange(opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Tela cheia de vitória: animação curta do samurai do vencedor (sem som), que trava no quadro
// final com o braço erguido; então aparece o texto. Se o vídeo não tocar, mostra o quadro final.
function VictoryScreen({ winner, mode, human, reason, onPlayAgain, onClose }) {
  const [frozen, setFrozen] = useState(false);
  const file = winner === BLUE ? 'azul' : 'vermelho';
  const color = TEAM[winner].ink;
  const subtitle = mode === 'ai' ? (winner === human ? 'Você venceu!' : 'O computador venceu.') : null;

  useEffect(() => {
    const t = setTimeout(() => setFrozen(true), 4500); // garantia caso o vídeo não dispare "ended"
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="aq-victory fixed inset-0 z-[3000] flex items-end justify-center overflow-hidden bg-black" role="dialog" aria-modal="true" aria-label={`Vitória do ${TEAM[winner].name}`}>
      {/* fundo: o quadro final desfocado preenche a tela; o vídeo aparece inteiro (no celular em pé não corta o braço) */}
      <img src={`/videos/duelo/vitoria-${file}.webp`} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl" aria-hidden="true" />
      <video
        key={file}
        className="absolute inset-x-0 top-[12%] w-full md:inset-0 md:top-0 md:h-full md:object-contain"
        src={`/videos/duelo/vitoria-${file}.mp4`}
        poster={`/videos/duelo/vitoria-${file}.webp`}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setFrozen(true)}
        onError={() => setFrozen(true)}
      />
      <div className={`aq-victory-card relative mb-[8vh] mx-4 flex flex-col items-center gap-3 text-center ${frozen ? 'aq-victory-in' : 'opacity-0'}`}>
        <p className="aq-serif aq-victory-title" style={{ color }}>
          Vitória do {TEAM[winner].name}!
        </p>
        {subtitle && <p className="aq-serif text-[20px] font-bold text-[#1F2A3A]">{subtitle}</p>}
        <p className="text-[14px] text-[#4A4F5C]">{reason}.</p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <button type="button" className="aq-btn aq-btn-ink" onClick={onPlayAgain}>
            Jogar de novo
          </button>
          <button type="button" className="aq-btn" onClick={onClose}>
            Ver o tabuleiro
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DueloDeMestresGame() {
  const [initial, setInitial] = useState(initialState);
  const [state, setState] = useState(initial);
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
  const ids = useMemo(() => pieceIds(initial, history), [initial, history]);
  const mustPass = !outcome && moves.every((m) => !m.from);
  const aiTurn = mode === 'ai' && state.turn !== human && !outcome;
  const humanCanPlay = !outcome && !thinking && !aiTurn;
  const lastMove = history.length ? history[history.length - 1].move : null;
  const [victoryClosed, setVictoryClosed] = useState(false);
  const showVictory = !!outcome && !victoryClosed;

  // Fonte com cara de pincel para títulos e nomes
  useEffect(() => {
    const id = 'aq-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&display=swap';
    document.head.appendChild(link);
  }, []);

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
    const t = setTimeout(() => worker.postMessage({ id, state, depth, randomness }), 600);
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
  const movable = useMemo(() => moves.filter((m) => m.from && (!selCard || m.card === selCard)).map((m) => m.from), [moves, selCard]);

  const onSquare = (r, c) => {
    if (!humanCanPlay || mustPass) return;
    const sq = [r, c];
    const options = targets.filter((m) => sameSquare(m.to, sq));
    if (options.length === 1) {
      play(options[0]);
      return;
    }
    if (options.length > 1) {
      setAmbiguous(sq);
      return;
    }
    setAmbiguous(null);
    if (colorOf(state.board[r][c]) === state.turn) setSelPiece(sameSquare(selPiece, sq) ? null : sq);
    else setSelPiece(null);
  };

  const onCard = (card) => {
    if (!humanCanPlay) return;
    if (mustPass) {
      play({ card, from: null, to: null });
      return;
    }
    if (ambiguous) {
      const move = targets.find((m) => m.card === card && sameSquare(m.to, ambiguous));
      if (move) {
        play(move);
        return;
      }
    }
    setAmbiguous(null);
    setSelCard(selCard === card ? null : card);
  };

  const newGame = (opts = {}) => {
    requestRef.current++;
    setThinking(false);
    const fresh = initialState();
    setInitial(fresh);
    setState(fresh);
    setHistory([]);
    clearSelection();
    setVictoryClosed(false);
    if (opts.mode) setMode(opts.mode);
    if (opts.human) setHuman(opts.human);
  };

  const undo = () => {
    setVictoryClosed(false);
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
  // Linha/coluna do tabuleiro -> posição na tela
  const view = (r, c) => (flipped ? [SIZE - 1 - r, SIZE - 1 - c] : [r, c]);
  const lost = (p) => 5 - state.board.flat().filter((x) => colorOf(x) === p).length;

  const tokens = [];
  state.board.forEach((row, r) =>
    row.forEach((p, c) => {
      if (p) tokens.push({ id: ids[r][c] ?? `${r}-${c}`, piece: p, r, c });
    }),
  );

  const renderHand = (player) => {
    const isTop = player === top;
    const active = humanCanPlay && state.turn === player;
    const playerLabel = mode === 'ai' ? (player === human ? 'Você' : 'Computador') : TEAM[player].name;
    return (
      <div className={`flex items-center gap-3 ${isTop ? 'flex-row-reverse' : ''}`}>
        <div className="flex flex-1 justify-center gap-3 sm:gap-4">
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
          <img src={`${IMG}/mestre-${TEAM[player].file}.webp`} alt="" className="h-11 w-11 sm:h-12 sm:w-12" draggable={false} />
          <span className="aq-label" style={{ color: TEAM[player].ink }}>
            {playerLabel}
          </span>
          {state.turn === player && !outcome && <span className="aq-turn">na vez</span>}
        </div>
      </div>
    );
  };

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1]]);

  return (
    <div className="aq-page min-h-screen px-4 pb-12 pt-4 md:px-8">
      <header className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-3">
        <Link to="/" className="aq-btn shrink-0" aria-label="Voltar ao VAH Games">
          <span aria-hidden="true">←</span>
          <span className="hidden sm:inline">VAH Games</span>
        </Link>
        <h1 className="aq-serif aq-title min-w-0 truncate text-center">Duelo de Mestres</h1>
        <button type="button" className="aq-btn aq-btn-ink shrink-0" onClick={() => newGame()}>
          Novo jogo
        </button>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)]">
        <div className="flex w-full min-w-0 flex-col gap-4">
          {renderHand(top)}

          <div className="flex items-center gap-3">
            <div className="aq-board relative aspect-square w-full min-w-0 flex-1" role="grid" aria-label="Tabuleiro do Duelo de Mestres">
              <img src={`${IMG}/tabuleiro.webp`} alt="" className="absolute inset-0 h-full w-full" draggable={false} />

              {/* Casas: destaques e área de toque */}
              {[...Array(SIZE).keys()].map((r) =>
                [...Array(SIZE).keys()].map((c) => {
                  const sq = [r, c];
                  const [vr, vc] = view(r, c);
                  const piece = state.board[r][c];
                  const isSel = sameSquare(selPiece, sq);
                  const isMovable = humanCanPlay && !mustPass && !selPiece && movable.some((s) => sameSquare(s, sq));
                  const isLast = lastMove?.from && (sameSquare(lastMove.from, sq) || sameSquare(lastMove.to, sq));
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      role="gridcell"
                      aria-label={`${squareName(sq)}${piece ? `, ${isMaster(piece) ? 'mestre' : 'aprendiz'} ${TEAM[colorOf(piece)].name.toLowerCase()}` : ''}`}
                      onClick={() => onSquare(r, c)}
                      className={`absolute flex items-center justify-center ${isMovable ? 'cursor-pointer' : ''}`}
                      style={{ left: `${GRID.x0 + vc * cellW}%`, top: `${GRID.y0 + vr * cellH}%`, width: `${cellW}%`, height: `${cellH}%` }}
                    >
                      {isLast && <span className="aq-wash-last absolute inset-[6%]" />}
                      {isSel && <span className="aq-wash-sel absolute inset-[4%]" />}
                      {isMovable && <span className="aq-movable absolute inset-[10%]" />}
                    </button>
                  );
                }),
              )}

              {/* Fichas: mestre maior, aprendizes menores */}
              {tokens.map(({ id, piece, r, c }) => {
                const [vr, vc] = view(r, c);
                const master = isMaster(piece);
                const size = master ? 0.9 : 0.68;
                const isSel = sameSquare(selPiece, [r, c]);
                return (
                  <img
                    key={id}
                    src={tokenSrc(id)}
                    alt=""
                    draggable={false}
                    className={`aq-token pointer-events-none absolute ${isSel ? 'aq-token-sel' : ''}`}
                    style={{
                      left: `${GRID.x0 + (vc + (1 - size) / 2) * cellW}%`,
                      top: `${GRID.y0 + (vr + (1 - size) / 2) * cellH}%`,
                      width: `${cellW * size}%`,
                      height: `${cellH * size}%`,
                    }}
                  />
                );
              })}

              {/* Destinos por cima das fichas (o toque passa para a casa embaixo) */}
              {targets.map(({ to, card }) => {
                const [vr, vc] = view(to[0], to[1]);
                const capture = !!state.board[to[0]][to[1]];
                const amb = sameSquare(ambiguous, to);
                return (
                  <span
                    key={`${card}-${to}`}
                    className="pointer-events-none absolute flex items-center justify-center"
                    style={{ left: `${GRID.x0 + vc * cellW}%`, top: `${GRID.y0 + vr * cellH}%`, width: `${cellW}%`, height: `${cellH}%` }}
                  >
                    {capture ? <span className={`aq-capture absolute inset-[3%] ${amb ? 'animate-pulse' : ''}`} /> : <span className={`aq-dot ${amb ? 'animate-pulse' : ''}`} />}
                  </span>
                );
              })}
            </div>

            <div className="flex w-[84px] shrink-0 flex-col items-center gap-1.5 sm:w-[112px]">
              <span className="aq-label">Próxima</span>
              <MoveCard id={state.side} disabled small facingTop={state.turn === top} rotateAll={mode === 'pvp'} />
            </div>
          </div>

          {renderHand(bottom)}
        </div>

        <aside className="flex flex-col gap-5">
          <div className={`aq-panel ${outcome ? 'aq-panel-win' : ''}`}>
            <p className="aq-label">Situação</p>
            <p className="aq-serif mt-1 text-[22px] font-extrabold leading-tight text-[#1F2A3A]" role="status" aria-live="polite">
              {statusText(state, outcome, mode, human, thinking, mustPass)}
            </p>
            {outcome && <p className="mt-2 text-[14px] text-[#4A4F5C]">{outcome.reason}.</p>}
            {ambiguous && <p className="mt-2 text-[14px] text-[#4A4F5C]">As duas cartas chegam nessa casa: toque na carta que quer usar.</p>}
            <p className="mt-3 text-[14px] text-[#4A4F5C]">
              Peças perdidas: <b style={{ color: TEAM[BLUE].ink }}>Azul {lost(BLUE)}</b> · <b style={{ color: TEAM[RED].ink }}>Vermelho {lost(RED)}</b>
            </p>
          </div>

          <div className="aq-panel flex flex-col gap-4">
            <InkOptions
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
                <InkOptions label="Dificuldade" value={level} onChange={setLevel} options={LEVELS} />
                <InkOptions
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
              <button type="button" className="aq-btn" onClick={undo} disabled={history.length === 0}>
                Desfazer lance
              </button>
            </div>
          </div>

          <div className="aq-panel">
            <h2 className="aq-serif mb-3 text-[20px] font-extrabold text-[#1F2A3A]">Lances</h2>
            {pairs.length === 0 ? (
              <p className="text-[14px] text-[#4A4F5C]">Toque numa ficha sua e depois numa casa marcada. Para usar só uma das cartas, toque nela antes.</p>
            ) : (
              <ol className="grid max-h-56 grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 overflow-y-auto text-[14px] text-[#2A2F3A]">
                {pairs.map(([a, b], i) => (
                  <React.Fragment key={i}>
                    <span className="text-[#8A8578]">{i + 1}.</span>
                    {[a, b].map((h, j) => (
                      <span key={j} className="font-semibold">
                        {h && (
                          <>
                            <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: TEAM[h.player].ink }} aria-hidden="true" />
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

          <details className="aq-panel">
            <summary className="aq-serif cursor-pointer text-[18px] font-extrabold text-[#1F2A3A]">Regras</summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] text-[#3A3F4C]">
              <li>Cada lado tem 1 mestre (a ficha maior) e 4 aprendizes. Só 5 cartas entram em cada partida: 2 para cada jogador e 1 ao lado do tabuleiro.</li>
              <li>Na sua vez, escolha uma das suas cartas e mova uma ficha como mostra o desenho dela (o quadrado escuro é a ficha).</li>
              <li>Pode capturar fichas do adversário, mas não pode cair em cima de uma ficha sua nem sair do tabuleiro.</li>
              <li>A carta usada vai para o lado do tabuleiro e você pega a carta que estava lá. O adversário recebe a sua carta depois.</li>
              <li>Se não houver nenhum movimento possível, você só troca uma das suas cartas.</li>
              <li>Quem começa é a cor do carimbo da carta do lado no início.</li>
              <li>Vence quem capturar o mestre adversário (Caminho da Pedra) ou levar o seu mestre até o portal do templo do adversário (Caminho do Riacho).</li>
            </ul>
          </details>
        </aside>
      </main>

      {showVictory && (
        <VictoryScreen
          winner={outcome.winner}
          mode={mode}
          human={human}
          reason={outcome.reason}
          onPlayAgain={() => newGame()}
          onClose={() => setVictoryClosed(true)}
        />
      )}
    </div>
  );
}
