// Motor de Damas — regra brasileira (tabuleiro 8x8, regras internacionais da FMJD):
// - as Claras (w) começam e jogam de baixo para cima; casas escuras jogáveis
// - pedra anda 1 casa na diagonal para frente, mas captura para frente e para trás
// - captura é obrigatória e é obrigatório capturar o maior número de peças (lei da maioria)
// - dama "voadora": anda e captura a qualquer distância na diagonal
// - as peças capturadas só saem no fim do lance e não podem ser puladas duas vezes
// - pedra que passa pela última fileira no meio de uma captura e não termina nela não vira dama
// - empate após 20 lances seguidos só com damas, sem captura nem movimento de pedra

export const SIZE = 8;
const DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export const colorOf = (p) => (p ? p.toLowerCase() : null);
export const isKing = (p) => p === 'W' || p === 'B';
export const opponent = (c) => (c === 'w' ? 'b' : 'w');
const inside = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const forward = (color) => (color === 'w' ? -1 : 1);
const lastRow = (color) => (color === 'w' ? 0 : SIZE - 1);

export function initialBoard() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = 'b';
        else if (r > 4) board[r][c] = 'w';
      }
    }
  }
  return board;
}

export function initialState() {
  return { board: initialBoard(), turn: 'w', kingMoves: 0 };
}

const key = (r, c) => r * SIZE + c;

// Sequências de captura a partir de (r, c). Cada uma: { path: [[r,c], ...], captured: [[r,c], ...] }
function captureSequences(board, r0, c0) {
  const piece = board[r0][c0];
  const color = colorOf(piece);
  const king = isKing(piece);
  const results = [];

  const occupied = (r, c) => !(r === r0 && c === c0) && board[r][c] !== null; // a casa de origem fica vaga

  const dfs = (r, c, path, captured, capturedSet) => {
    let extended = false;
    for (const [dr, dc] of DIRS) {
      if (king) {
        let rr = r + dr;
        let cc = c + dc;
        while (inside(rr, cc) && !occupied(rr, cc)) {
          rr += dr;
          cc += dc;
        }
        if (!inside(rr, cc)) continue;
        const target = board[rr][cc];
        if (colorOf(target) !== opponent(color) || capturedSet.has(key(rr, cc))) continue;
        let lr = rr + dr;
        let lc = cc + dc;
        while (inside(lr, lc) && !occupied(lr, lc)) {
          extended = true;
          const set = new Set(capturedSet).add(key(rr, cc));
          dfs(lr, lc, [...path, [lr, lc]], [...captured, [rr, cc]], set);
          lr += dr;
          lc += dc;
        }
      } else {
        const mr = r + dr;
        const mc = c + dc;
        const lr = r + 2 * dr;
        const lc = c + 2 * dc;
        if (!inside(lr, lc)) continue;
        if (colorOf(board[mr][mc]) !== opponent(color) || capturedSet.has(key(mr, mc))) continue;
        if (occupied(lr, lc)) continue;
        extended = true;
        dfs(lr, lc, [...path, [lr, lc]], [...captured, [mr, mc]], new Set(capturedSet).add(key(mr, mc)));
      }
    }
    if (!extended && captured.length > 0) results.push({ path, captured });
  };

  dfs(r0, c0, [[r0, c0]], [], new Set());
  return results;
}

function simpleMoves(board, r, c) {
  const piece = board[r][c];
  const color = colorOf(piece);
  const moves = [];
  for (const [dr, dc] of DIRS) {
    if (isKing(piece)) {
      let rr = r + dr;
      let cc = c + dc;
      while (inside(rr, cc) && board[rr][cc] === null) {
        moves.push({ path: [[r, c], [rr, cc]], captured: [] });
        rr += dr;
        cc += dc;
      }
    } else if (dr === forward(color)) {
      const rr = r + dr;
      const cc = c + dc;
      if (inside(rr, cc) && board[rr][cc] === null) moves.push({ path: [[r, c], [rr, cc]], captured: [] });
    }
  }
  return moves;
}

// Todos os lances legais do jogador da vez (já aplicando captura obrigatória e lei da maioria)
export function legalMoves(state) {
  const { board, turn } = state;
  let captures = [];
  let max = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (colorOf(board[r][c]) !== turn) continue;
      for (const seq of captureSequences(board, r, c)) {
        if (seq.captured.length > max) {
          max = seq.captured.length;
          captures = [seq];
        } else if (seq.captured.length === max) {
          captures.push(seq);
        }
      }
    }
  }
  if (captures.length) return captures;
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (colorOf(board[r][c]) === turn) moves.push(...simpleMoves(board, r, c));
    }
  }
  return moves;
}

export function applyMove(state, move) {
  const board = state.board.map((row) => row.slice());
  const [fr, fc] = move.path[0];
  const [tr, tc] = move.path[move.path.length - 1];
  let piece = board[fr][fc];
  board[fr][fc] = null;
  move.captured.forEach(([r, c]) => {
    board[r][c] = null;
  });
  const promoted = !isKing(piece) && tr === lastRow(colorOf(piece));
  if (promoted) piece = piece.toUpperCase();
  board[tr][tc] = piece;
  const quietKingMove = isKing(state.board[fr][fc]) && move.captured.length === 0;
  return {
    board,
    turn: opponent(state.turn),
    kingMoves: quietKingMove ? state.kingMoves + 1 : 0,
    promoted,
  };
}

// null enquanto o jogo segue; senão { winner: 'w' | 'b' | null, reason }
export function result(state, moves = legalMoves(state)) {
  if (moves.length === 0) {
    const hasPieces = state.board.some((row) => row.some((p) => colorOf(p) === state.turn));
    return { winner: opponent(state.turn), reason: hasPieces ? 'sem lances' : 'sem peças' };
  }
  if (state.kingMoves >= 20) return { winner: null, reason: '20 lances só com damas' };
  return null;
}

export const sameSquare = (a, b) => a[0] === b[0] && a[1] === b[1];

// ---------------------------------------------------------------------------
// Computador: negamax com poda alfa-beta
// ---------------------------------------------------------------------------

function evaluate(state) {
  let score = 0;
  const { board } = state;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      const color = colorOf(p);
      let v;
      if (isKing(p)) {
        v = 320;
      } else {
        const advance = color === 'w' ? SIZE - 1 - r : r;
        v = 100 + advance * 4;
        if (c === 0 || c === SIZE - 1) v += 4; // pedras na borda são mais difíceis de capturar
        if (r === (color === 'w' ? SIZE - 1 : 0)) v += 6; // guardar a última fileira atrasa as damas rivais
      }
      score += color === state.turn ? v : -v;
    }
  }
  return score;
}

function negamax(state, depth, alpha, beta, ply) {
  const moves = legalMoves(state);
  if (moves.length === 0) return -100000 + ply;
  if (state.kingMoves >= 20) return 0;
  // continua buscando enquanto houver capturas (evita o "efeito horizonte")
  if (depth <= 0 && moves[0].captured.length === 0) return evaluate(state);
  if (depth <= -6) return evaluate(state);
  let best = -Infinity;
  for (const move of moves) {
    const score = -negamax(applyMove(state, move), depth - 1, -beta, -alpha, ply + 1);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

export function bestMove(state, depth, randomness = 0) {
  const moves = legalMoves(state);
  if (moves.length <= 1) return moves[0] ?? null;
  const scored = moves.map((move) => ({
    move,
    score: -negamax(applyMove(state, move), depth - 1, -Infinity, Infinity, 1) + Math.random() * randomness,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}
