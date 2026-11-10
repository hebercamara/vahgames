// Duelo de Mestres — lógica do jogo (tabuleiro 5x5, cartas de movimento).
//
// Tabuleiro: linhas 0..4 de cima para baixo. Azul começa embaixo (linha 4) e Vermelho em cima (linha 0).
// Peças: 'b'/'r' = aprendiz azul/vermelho, 'B'/'R' = mestre azul/vermelho.
// Cada carta lista deslocamentos [dx, dy] do ponto de vista de quem joga: dx > 0 = direita, dy > 0 = frente.

export const SIZE = 5;
export const BLUE = 'b';
export const RED = 'r';

export const CARDS = {
  tigre: { name: 'Tigre', color: BLUE, moves: [[0, 2], [0, -1]] },
  dragao: { name: 'Dragão', color: RED, moves: [[-2, 1], [2, 1], [-1, -1], [1, -1]] },
  sapo: { name: 'Sapo', color: RED, moves: [[-2, 0], [-1, 1], [1, -1]] },
  coelho: { name: 'Coelho', color: BLUE, moves: [[2, 0], [1, 1], [-1, -1]] },
  caranguejo: { name: 'Caranguejo', color: BLUE, moves: [[0, 1], [-2, 0], [2, 0]] },
  elefante: { name: 'Elefante', color: RED, moves: [[-1, 1], [1, 1], [-1, 0], [1, 0]] },
  ganso: { name: 'Ganso', color: BLUE, moves: [[-1, 1], [-1, 0], [1, 0], [1, -1]] },
  galo: { name: 'Galo', color: RED, moves: [[1, 1], [1, 0], [-1, 0], [-1, -1]] },
  macaco: { name: 'Macaco', color: BLUE, moves: [[-1, 1], [1, 1], [-1, -1], [1, -1]] },
  louva: { name: 'Louva-a-deus', color: RED, moves: [[-1, 1], [1, 1], [0, -1]] },
  cavalo: { name: 'Cavalo', color: RED, moves: [[0, 1], [-1, 0], [0, -1]] },
  boi: { name: 'Boi', color: BLUE, moves: [[0, 1], [1, 0], [0, -1]] },
  garca: { name: 'Garça', color: BLUE, moves: [[0, 1], [-1, -1], [1, -1]] },
  javali: { name: 'Javali', color: RED, moves: [[0, 1], [-1, 0], [1, 0]] },
  enguia: { name: 'Enguia', color: BLUE, moves: [[-1, 1], [-1, -1], [1, 0]] },
  cobra: { name: 'Cobra', color: RED, moves: [[1, 1], [1, -1], [-1, 0]] },
};
export const CARD_IDS = Object.keys(CARDS);

// Templo de cada cor: casa central da fileira inicial
export const TEMPLE = { [BLUE]: [SIZE - 1, 2], [RED]: [0, 2] };

export const other = (p) => (p === BLUE ? RED : BLUE);
export const colorOf = (piece) => (piece ? piece.toLowerCase() : null);
export const isMaster = (piece) => piece === 'B' || piece === 'R';
export const sameSquare = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];

// Converte um deslocamento da carta em [dLinha, dColuna] no tabuleiro para o jogador
export function delta(player, [dx, dy]) {
  return player === BLUE ? [-dy, dx] : [dy, -dx];
}

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initialState(cards = shuffle(CARD_IDS).slice(0, 5)) {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (let c = 0; c < SIZE; c++) {
    board[0][c] = c === 2 ? 'R' : 'r';
    board[SIZE - 1][c] = c === 2 ? 'B' : 'b';
  }
  const side = cards[4];
  return {
    board,
    hands: { [BLUE]: [cards[0], cards[1]], [RED]: [cards[2], cards[3]] },
    side,
    // A cor da carta do lado define quem começa
    turn: CARDS[side].color,
  };
}

// Lances: { card, from, to }. Sem nenhum movimento possível, o jogador só troca uma carta: { card, from: null, to: null }.
export function legalMoves(state) {
  const { board, hands, turn } = state;
  const moves = [];
  for (const card of hands[turn]) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (colorOf(board[r][c]) !== turn) continue;
        for (const m of CARDS[card].moves) {
          const [dr, dc] = delta(turn, m);
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
          if (colorOf(board[nr][nc]) === turn) continue;
          moves.push({ card, from: [r, c], to: [nr, nc] });
        }
      }
    }
  }
  if (!moves.length) for (const card of hands[turn]) moves.push({ card, from: null, to: null });
  return moves;
}

export function applyMove(state, move) {
  const { turn } = state;
  const board = state.board.map((row) => [...row]);
  let captured = null;
  if (move.from) {
    const [fr, fc] = move.from;
    const [tr, tc] = move.to;
    captured = board[tr][tc];
    board[tr][tc] = board[fr][fc];
    board[fr][fc] = null;
  }
  const hand = state.hands[turn].map((c) => (c === move.card ? state.side : c));
  return {
    board,
    hands: { ...state.hands, [turn]: hand },
    side: move.card,
    turn: other(turn),
    captured,
  };
}

function findMaster(board, player) {
  const target = player === BLUE ? 'B' : 'R';
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (board[r][c] === target) return [r, c];
  return null;
}

// Fim de jogo: { winner, reason } ou null
export function result(state) {
  for (const p of [BLUE, RED]) {
    const master = findMaster(state.board, p);
    if (!master) return { winner: other(p), reason: 'Caminho da Pedra: o mestre foi capturado' };
    if (sameSquare(master, TEMPLE[other(p)])) return { winner: p, reason: 'Caminho do Riacho: o mestre chegou ao templo' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Computador: negamax com poda alfa-beta
// ---------------------------------------------------------------------------

const WIN = 100000;

// Avaliação do ponto de vista de quem joga (state.turn)
function evaluate(state) {
  const me = state.turn;
  let score = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = state.board[r][c];
      if (!piece) continue;
      const owner = colorOf(piece);
      const sign = owner === me ? 1 : -1;
      if (isMaster(piece)) {
        // Mestre perto do templo inimigo é ameaça
        const [tr, tc] = TEMPLE[other(owner)];
        score += sign * (8 - Math.abs(r - tr) - Math.abs(c - tc)) * 6;
      } else {
        score += sign * 100;
        // Aprendizes no centro controlam mais casas
        score += sign * (4 - Math.abs(r - 2) - Math.abs(c - 2)) * 3;
      }
    }
  }
  // Mobilidade: quantos movimentos cada lado tem com as cartas da mão
  score += (countMoves(state, me) - countMoves(state, other(me))) * 2;
  return score;
}

function countMoves(state, player) {
  let n = 0;
  for (const card of state.hands[player]) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (colorOf(state.board[r][c]) !== player) continue;
        for (const m of CARDS[card].moves) {
          const [dr, dc] = delta(player, m);
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && colorOf(state.board[nr][nc]) !== player) n++;
        }
      }
    }
  }
  return n;
}

// Capturas e vitórias primeiro: melhora muito a poda
function ordered(state, moves) {
  const key = (m) => {
    if (!m.from) return 0;
    const target = state.board[m.to[0]][m.to[1]];
    if (isMaster(target)) return 1000;
    if (isMaster(state.board[m.from[0]][m.from[1]]) && sameSquare(m.to, TEMPLE[other(state.turn)])) return 1000;
    return target ? 100 : 0;
  };
  return moves.map((m) => [key(m), m]).sort((a, b) => b[0] - a[0]).map(([, m]) => m);
}

function negamax(state, depth, alpha, beta, ply) {
  // Quem acabou de jogar é other(state.turn): se o jogo acabou, ele venceu
  if (result(state)) return -(WIN - ply);
  if (depth === 0) return evaluate(state);
  let best = -Infinity;
  for (const move of ordered(state, legalMoves(state))) {
    const score = -negamax(applyMove(state, move), depth - 1, -beta, -alpha, ply + 1);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

export function bestMove(state, depth, randomness = 0) {
  const moves = legalMoves(state);
  if (moves.length <= 1) return moves[0] ?? null;
  const scored = ordered(state, moves).map((move) => ({
    move,
    score: -negamax(applyMove(state, move), depth - 1, -Infinity, Infinity, 1) + Math.random() * randomness,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}
