import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import GamePage from '../../components/GamePage';
import PixelBoard, { spriteUrl } from './PixelBoard';
import './pixel.css';

// Xadrez do VAH Games.
// Regras: chess.js (BSD-2-Clause) · Computador: js-chess-engine (MIT)
// Visual em pixel art com perspectiva: PixelBoard.jsx + sprites em public/images/xadrez

const LEVELS = [
  { value: 1, label: 'Fácil' },
  { value: 2, label: 'Médio' },
  { value: 3, label: 'Difícil' },
  { value: 4, label: 'Mestre' },
];

const PIECE_NAMES = { p: 'peão', n: 'cavalo', b: 'bispo', r: 'torre', q: 'dama', k: 'rei' };
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const colorName = (c) => (c === 'w' ? 'Brancas' : 'Pretas');

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
  const [promotion, setPromotion] = useState(null); // { from, to } esperando a escolha da peça

  const game = gameRef.current;
  // fen muda a cada lance; os valores abaixo são recalculados a partir do estado do chess.js
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const history = useMemo(() => game.history({ verbose: true }), [fen]);
  const lastMove = history[history.length - 1];
  const over = game.isGameOver();
  const aiTurn = mode === 'ai' && game.turn() !== humanColor && !over;

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
  const interactive = !over && !thinking && !aiTurn && !promotion;

  const targets = selected ? game.moves({ square: selected, verbose: true }).map((m) => ({ to: m.to, captured: !!m.captured })) : [];

  const onSquareClick = (square) => {
    const piece = game.get(square);
    if (selected) {
      if (selected === square) return setSelected(null);
      if (piece && piece.color === game.turn() && canMovePiece(piece.color)) return setSelected(square);
      const move = game.moves({ square: selected, verbose: true }).find((m) => m.to === square);
      if (move?.promotion) return setPromotion({ from: selected, to: square });
      if (move && tryMove(selected, square)) return undefined;
      return setSelected(null);
    }
    if (piece && canMovePiece(piece.color)) setSelected(square);
    return undefined;
  };

  const promote = (type) => {
    if (promotion) tryMove(promotion.from, promotion.to, type);
    setPromotion(null);
  };

  const newGame = (opts = {}) => {
    requestRef.current++;
    setThinking(false);
    setPromotion(null);
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
    setPromotion(null);
    if (mode === 'ai') {
      game.undo();
      if (game.turn() !== humanColor) game.undo();
    } else {
      game.undo();
    }
    sync();
  };

  const checkSquare = game.inCheck()
    ? game
        .board()
        .flat()
        .find((p) => p && p.type === 'k' && p.color === game.turn())?.square
    : null;

  const caps = capturedBy(history);
  const baseWhite = mode === 'ai' ? humanColor === 'w' : true;
  const orientation = baseWhite !== flipped ? 'white' : 'black';
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1]]);

  // Peças capturadas por uma cor = peças da outra cor, mostradas de frente e pequenas
  const CapturedRow = ({ color }) => (
    <div className="flex min-h-[36px] flex-wrap items-end gap-0.5 px-2" aria-label={`Peças capturadas pelas ${colorName(color)}`}>
      {caps[color].map((p, i) => (
        <img key={i} src={spriteUrl(color === 'w' ? 'b' : 'w', p)} alt={PIECE_NAMES[p]} title={PIECE_NAMES[p]} className="h-9 w-auto" draggable={false} />
      ))}
    </div>
  );

  const PxOptions = ({ label, value, options, onChange }) => (
    <div className="flex flex-col gap-2">
      <span className="px-font text-[9px] uppercase text-[#A99BE0]">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button key={String(opt.value)} type="button" role="radio" aria-checked={opt.value === value} className="px-btn" onClick={() => onChange(opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const promoColor = game.turn();

  return (
    <GamePage
      title="Xadrez"
      actions={
        <button type="button" className="px-btn px-btn-lime" onClick={() => newGame()}>
          Novo jogo
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,680px)_minmax(0,1fr)]">
        <div className="relative w-full min-w-0">
          <CapturedRow color={orientation === 'white' ? 'b' : 'w'} />
          <PixelBoard
            board={game.board()}
            orientation={orientation}
            selected={selected}
            targets={targets}
            lastMove={lastMove}
            checkSquare={checkSquare}
            interactive={interactive}
            onSquare={onSquareClick}
          />
          <CapturedRow color={orientation === 'white' ? 'w' : 'b'} />

          {promotion && (
            <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4">
              <div className="px-panel px-panel-gold flex flex-col items-center gap-4">
                <p className="px-font text-center text-[11px] text-[#F2E0B6]">Promover peão para:</p>
                <div className="flex gap-3">
                  {['q', 'r', 'b', 'n'].map((t) => (
                    <button key={t} type="button" className="px-btn flex flex-col items-center gap-2 !p-2" onClick={() => promote(t)}>
                      <img src={spriteUrl(promoColor, t)} alt="" className="h-20 w-auto" draggable={false} />
                      <span className="text-[8px]">{PIECE_NAMES[t]}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="px-btn" onClick={() => setPromotion(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <div className={`px-panel ${over ? 'px-panel-gold' : ''}`}>
            <p className="px-font text-[9px] uppercase text-[#A99BE0]">Situação</p>
            <p className={`px-font mt-3 text-[13px] leading-relaxed text-white ${thinking ? 'px-blink' : ''}`} role="status" aria-live="polite">
              {statusText(game, mode, humanColor)}
            </p>
          </div>

          <div className="px-panel flex flex-col gap-5">
            <PxOptions
              label="Modo"
              value={mode}
              onChange={(m) => newGame({ mode: m })}
              options={[
                { value: 'ai', label: 'Computador' },
                { value: 'pvp', label: '2 jogadores' },
              ]}
            />
            {mode === 'ai' && (
              <>
                <PxOptions label="Dificuldade" value={level} onChange={setLevel} options={LEVELS} />
                <PxOptions
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
            <div className="flex flex-wrap gap-3">
              <button type="button" className="px-btn" onClick={undo} disabled={history.length === 0}>
                Desfazer
              </button>
              <button type="button" className="px-btn" onClick={() => setFlipped((f) => !f)}>
                Girar
              </button>
            </div>
          </div>

          <div className="px-panel">
            <h2 className="px-font mb-4 text-[12px] uppercase text-white">Lances</h2>
            {pairs.length === 0 ? (
              <p className="text-body-md text-[#C9C0F0]">Toque numa peça e depois na casa de destino. As suas peças aparecem de costas, viradas para o adversário.</p>
            ) : (
              <ol className="px-font grid max-h-64 grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-2 overflow-y-auto text-[10px]">
                {pairs.map(([w, b], i) => (
                  <React.Fragment key={i}>
                    <span className="text-[#A99BE0]">{i + 1}.</span>
                    <span className="text-white">{w.san}</span>
                    <span className="text-white">{b ? b.san : ''}</span>
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
