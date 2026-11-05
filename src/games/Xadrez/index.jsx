import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import GamePage, { Segmented } from '../../components/GamePage';

// Xadrez do VAH Games.
// Regras: chess.js (BSD-2-Clause) · Tabuleiro: react-chessboard (MIT) · Computador: js-chess-engine (MIT)

const LEVELS = [
  { value: 1, label: 'Fácil' },
  { value: 2, label: 'Médio' },
  { value: 3, label: 'Difícil' },
  { value: 4, label: 'Mestre' },
];

const PIECE_NAMES = { p: 'peão', n: 'cavalo', b: 'bispo', r: 'torre', q: 'dama', k: 'rei' };
const PIECE_SYMBOLS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const colorName = (c) => (c === 'w' ? 'Brancas' : 'Pretas');

// Cores do tabuleiro tiradas da paleta do DESIGN.md
const LIGHT = '#DCDFE8';
const DARK = '#878A9E';
const LAST_MOVE = 'rgba(199, 255, 91, 0.55)';
const SELECTED = 'rgba(164, 142, 255, 0.75)';

function statusText(game, mode, humanColor) {
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'b' : 'w';
    if (mode === 'ai') return winner === humanColor ? 'Xeque-mate! Você venceu! 🏆' : 'Xeque-mate! O computador venceu.';
    return `Xeque-mate! ${colorName(winner)} vencem! 🏆`;
  }
  if (game.isStalemate()) return 'Empate por afogamento.';
  if (game.isThreefoldRepetition()) return 'Empate por repetição de posição.';
  if (game.isInsufficientMaterial()) return 'Empate por material insuficiente.';
  if (game.isDraw()) return 'Empate pela regra dos 50 lances.';
  const who =
    mode === 'ai' ? (game.turn() === humanColor ? 'Sua vez' : 'Computador pensando…') : `Vez das ${colorName(game.turn())}`;
  return game.inCheck() ? `${who} — xeque!` : who;
}

function capturedBy(history) {
  const caps = { w: [], b: [] };
  history.forEach((m) => {
    if (m.captured) caps[m.color].push(m.captured);
  });
  const sortFn = (a, b) => PIECE_VALUES[b] - PIECE_VALUES[a];
  caps.w.sort(sortFn);
  caps.b.sort(sortFn);
  return caps;
}

export default function XadrezGame() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [mode, setMode] = useState('ai'); // 'ai' | 'pvp'
  const [level, setLevel] = useState(2);
  const [humanColor, setHumanColor] = useState('w');
  const [selected, setSelected] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const workerRef = useRef(null);
  const requestRef = useRef(0);
  const boxRef = useRef(null);
  const [boardWidth, setBoardWidth] = useState(320);

  const game = gameRef.current;
  // fen muda a cada lance; os valores abaixo são recalculados a partir do estado do chess.js
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const history = useMemo(() => game.history({ verbose: true }), [fen]);
  const lastMove = history[history.length - 1];
  const over = game.isGameOver();
  const aiTurn = mode === 'ai' && game.turn() !== humanColor && !over;

  // Tabuleiro responsivo
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setBoardWidth(Math.floor(Math.min(entry.contentRect.width, 640) - 4)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Worker do computador
  useEffect(() => {
    const worker = new Worker(new URL('./aiWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const sync = useCallback(() => {
    setFen(gameRef.current.fen());
    setSelected(null);
  }, []);

  const tryMove = useCallback(
    (from, to, promotion = 'q') => {
      try {
        gameRef.current.move({ from, to, promotion });
        sync();
        return true;
      } catch {
        return false;
      }
    },
    [sync],
  );

  // Vez do computador
  useEffect(() => {
    if (!aiTurn || !workerRef.current) return undefined;
    const id = ++requestRef.current;
    setThinking(true);
    const worker = workerRef.current;
    const onMessage = (e) => {
      if (e.data.id !== id) return;
      setThinking(false);
      if (e.data.error) {
        // Se o motor falhar, joga um lance legal qualquer para o jogo não travar
        const moves = gameRef.current.moves({ verbose: true });
        if (moves.length) tryMove(moves[0].from, moves[0].to);
        return;
      }
      tryMove(e.data.from, e.data.to);
    };
    worker.addEventListener('message', onMessage);
    // pequena pausa para o lance não parecer instantâneo
    const t = setTimeout(() => worker.postMessage({ id, fen: gameRef.current.fen(), level }), 350);
    return () => {
      clearTimeout(t);
      worker.removeEventListener('message', onMessage);
    };
  }, [aiTurn, fen, level, tryMove]);

  const canMovePiece = (pieceColor) => !over && !thinking && (mode === 'pvp' || pieceColor === humanColor) && pieceColor === game.turn();

  const onPieceDrop = (from, to, piece) => {
    if (!canMovePiece(piece[0])) return false;
    const isPromotion = piece[1] !== 'P' && game.get(from)?.type === 'p';
    return tryMove(from, to, isPromotion ? piece[1].toLowerCase() : 'q');
  };

  const onSquareClick = (square) => {
    const piece = game.get(square);
    if (selected) {
      if (selected === square) return setSelected(null);
      if (piece && piece.color === game.turn() && canMovePiece(piece.color)) return setSelected(square);
      if (tryMove(selected, square)) return undefined;
      return setSelected(null);
    }
    if (piece && canMovePiece(piece.color)) setSelected(square);
    return undefined;
  };

  const newGame = (opts = {}) => {
    requestRef.current++;
    setThinking(false);
    gameRef.current = new Chess();
    const color = opts.humanColor ?? humanColor;
    setFlipped(false);
    if (opts.humanColor) setHumanColor(color);
    if (opts.mode) setMode(opts.mode);
    sync();
  };

  const undo = () => {
    requestRef.current++;
    setThinking(false);
    if (mode === 'ai') {
      game.undo();
      if (game.turn() !== humanColor) game.undo();
    } else {
      game.undo();
    }
    sync();
  };

  // Destaques: último lance, peça selecionada e destinos possíveis
  const squareStyles = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { background: LAST_MOVE };
    squareStyles[lastMove.to] = { background: LAST_MOVE };
  }
  if (game.inCheck()) {
    const kingSq = game
      .board()
      .flat()
      .find((p) => p && p.type === 'k' && p.color === game.turn())?.square;
    if (kingSq) squareStyles[kingSq] = { background: 'radial-gradient(circle, rgba(240,0,27,.85) 0%, rgba(240,0,27,.35) 60%, transparent 75%)' };
  }
  if (selected) {
    squareStyles[selected] = { background: SELECTED };
    game.moves({ square: selected, verbose: true }).forEach((m) => {
      squareStyles[m.to] = m.captured
        ? { background: 'radial-gradient(circle, transparent 58%, rgba(15,26,0,.45) 60%)' }
        : { background: 'radial-gradient(circle, rgba(15,26,0,.4) 22%, transparent 24%)' };
    });
  }

  const caps = capturedBy(history);
  const baseWhite = mode === 'ai' ? humanColor === 'w' : true;
  const orientation = baseWhite !== flipped ? 'white' : 'black';
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1]]);

  const CapturedRow = ({ color }) => (
    <div className="flex min-h-[28px] flex-wrap items-center gap-0.5 text-[20px] leading-none text-muted" aria-label={`Peças capturadas pelas ${colorName(color)}`}>
      {caps[color].map((p, i) => (
        <span key={i} title={PIECE_NAMES[p]} className={color === 'w' ? 'text-[#0C0D14] [text-shadow:0_0_1px_#BDBFCE]' : 'text-ink'}>
          {PIECE_SYMBOLS[p]}
        </span>
      ))}
    </div>
  );

  return (
    <GamePage
      title="Xadrez"
      actions={
        <button type="button" className="btn-lime" onClick={() => newGame()}>
          Novo jogo
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <div ref={boxRef} className="w-full min-w-0">
          <div className="mb-2"><CapturedRow color={orientation === 'white' ? 'b' : 'w'} /></div>
          <div className="w-fit overflow-hidden rounded-xs border-2 border-line">
            <Chessboard
              id="vah-xadrez"
              position={fen}
              boardWidth={boardWidth}
              boardOrientation={orientation}
              onPieceDrop={onPieceDrop}
              onSquareClick={onSquareClick}
              isDraggablePiece={({ piece }) => canMovePiece(piece[0])}
              customSquareStyles={squareStyles}
              customDarkSquareStyle={{ backgroundColor: DARK }}
              customLightSquareStyle={{ backgroundColor: LIGHT }}
              customBoardStyle={{ borderRadius: 0 }}
              customNotationStyle={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '11px' }}
              animationDuration={200}
            />
          </div>
          <div className="mt-2"><CapturedRow color={orientation === 'white' ? 'w' : 'b'} /></div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className={`rounded-xs p-5 ${over ? 'bg-grad-green' : 'bg-grad-violet'}`}>
            <p className="text-caption uppercase text-muted">Situação</p>
            <p className="mt-1 text-heading-xs font-black text-ink" role="status" aria-live="polite">
              {statusText(game, mode, humanColor)}
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
                  value={humanColor}
                  onChange={(c) => newGame({ humanColor: c })}
                  options={[
                    { value: 'w', label: 'Brancas' },
                    { value: 'b', label: 'Pretas' },
                  ]}
                />
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost px-4" onClick={undo} disabled={history.length === 0}>
                Desfazer lance
              </button>
              <button type="button" className="btn-ghost px-4" onClick={() => setFlipped((f) => !f)}>
                Girar tabuleiro
              </button>
            </div>
          </div>

          <div className="panel">
            <h2 className="subheading mb-3">Lances</h2>
            {pairs.length === 0 ? (
              <p className="text-body-md text-muted">Arraste uma peça ou toque nela e depois no destino.</p>
            ) : (
              <ol className="grid max-h-64 grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 overflow-y-auto text-body-md">
                {pairs.map(([w, b], i) => (
                  <React.Fragment key={i}>
                    <span className="text-muted">{i + 1}.</span>
                    <span className="font-bold text-ink">{w.san}</span>
                    <span className="font-bold text-ink">{b ? b.san : ''}</span>
                  </React.Fragment>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </GamePage>
  );
}
