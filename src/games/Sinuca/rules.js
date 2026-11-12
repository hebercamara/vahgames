// Sinuca (bola 8): regras. Lisas = 1-7, listradas = 9-15, 8 preta, 0 branca.
// Simplificação: não é preciso "cantar" a caçapa; vale qualquer caçapa.
import { newWorld, newShot, groupOf, HEAD_X, MID_Y, R, FOOT, X0, X1, Y0, Y1 } from './physics.js';

export const GROUP_LABEL = { solid: 'Lisas', stripe: 'Listradas' };
export const otherGroup = (g) => (g === 'solid' ? 'stripe' : 'solid');

export function newGame(rnd = Math.random) {
  return {
    world: newWorld(rnd),
    turn: 0, // quem joga (0 = primeiro jogador)
    groups: [null, null], // 'solid' | 'stripe' (mesa aberta até alguém encaçapar)
    isBreak: true,
    ballInHand: false,
    winner: null, // 0 | 1
    reason: '',
    message: '',
    shots: 0,
  };
}

export const remaining = (balls, group) => balls.filter((b) => !b.pocketed && groupOf(b.id) === group).length;

// A tacada que acabou de parar -> o que aconteceu. Não altera o jogo (serve também para a IA comparar tacadas).
export function evaluateShot(game, shot, ballsAfter) {
  const me = game.turn;
  const opp = 1 - me;
  const myGroup = game.groups[me];
  const before = game.world.balls;
  const pocketed = shot.pocketed;
  const cuePocketed = pocketed.includes(0);
  const eightPocketed = pocketed.includes(8);
  const objects = pocketed.filter((id) => id !== 0 && id !== 8);

  // o 8 só vale como alvo depois de limpar as bolas do próprio grupo
  const cleared = myGroup && remaining(before, myGroup) === 0;
  const legalFirst = (id) => {
    if (id === null) return false;
    if (!myGroup) return id !== 8; // mesa aberta: qualquer uma menos a 8
    if (cleared) return id === 8;
    return groupOf(id) === myGroup;
  };

  const reasons = [];
  if (cuePocketed) reasons.push('a bola branca caiu na caçapa');
  if (shot.firstContact === null) reasons.push('a branca não tocou em nenhuma bola');
  else if (!legalFirst(shot.firstContact)) reasons.push(cleared ? 'o primeiro toque devia ser na bola 8' : myGroup ? 'o primeiro toque foi numa bola do adversário' : 'o primeiro toque foi na bola 8');
  if (shot.firstContact !== null && pocketed.length === 0 && !shot.railAfterContact) reasons.push('nenhuma bola tocou na tabela');
  const foul = reasons.length > 0;

  // grupo definido nesta tacada: vale a primeira bola que caiu (mesa aberta, sem falta, fora da quebra)
  let assign = null;
  if (!myGroup && !game.isBreak && !foul && objects.length) assign = groupOf(objects[0]);
  const groupNow = myGroup || assign;

  const result = { foul, reasons, assign, respot8: false, winner: null, reason: '', continues: false, ballInHand: foul, pocketed, objects };

  if (eightPocketed) {
    if (game.isBreak) {
      result.respot8 = true; // 8 na quebra: volta para o lugar e o jogo segue
    } else if (!foul && cleared) {
      result.winner = me;
      result.reason = 'encaçapou a bola 8';
      return result;
    } else {
      result.winner = opp;
      result.reason = foul && cleared ? `falta (${reasons[0]}) na bola 8` : 'a bola 8 caiu antes da hora';
      return result;
    }
  }

  if (foul) return result;

  // continua jogando se encaçapou ao menos uma bola "sua" (na mesa aberta / quebra, qualquer uma que não seja a 8)
  const mine = objects.filter((id) => !groupNow || groupOf(id) === groupNow);
  result.continues = mine.length > 0;
  return result;
}

// Aplica o resultado ao jogo: grupos, vez, bola na mão e vencedor.
export function applyResult(game, res) {
  const me = game.turn;
  game.shots++;
  if (res.assign) {
    game.groups[me] = res.assign;
    game.groups[1 - me] = otherGroup(res.assign);
  }
  const cue = game.world.balls[0];
  if (res.respot8) {
    const eight = game.world.balls.find((b) => b.id === 8);
    eight.pocketed = false;
    eight.vx = eight.vy = 0;
    // volta para o ponto do triângulo (ou o lugar livre mais próximo à direita)
    eight.x = FOOT.x + 2 * Math.sqrt(3) * R;
    eight.y = FOOT.y;
    let guard = 0;
    while (game.world.balls.some((o) => o !== eight && !o.pocketed && Math.hypot(o.x - eight.x, o.y - eight.y) < 2 * R) && guard++ < 40) eight.x += R;
    eight.x = Math.min(eight.x, X1 - R);
  }
  game.isBreak = false;
  game.world.shot = null;

  if (res.winner !== null) {
    game.winner = res.winner;
    game.reason = res.reason;
    return game;
  }
  if (res.foul) {
    game.turn = 1 - me;
    game.ballInHand = true;
    if (cue.pocketed) {
      cue.pocketed = false;
      cue.vx = cue.vy = 0;
      cue.x = HEAD_X;
      cue.y = MID_Y;
    }
  } else if (!res.continues) {
    game.turn = 1 - me;
    game.ballInHand = false;
  } else {
    game.ballInHand = false;
  }
  return game;
}

// Posição válida para a branca "na mão" (dentro da mesa e sem encostar nas outras bolas)
export function validCuePos(game, x, y, headOnly = false) {
  if (x < X0 + R || x > (headOnly ? HEAD_X : X1 - R) || y < Y0 + R || y > Y1 - R) return false;
  return game.world.balls.every((b) => b.id === 0 || b.pocketed || Math.hypot(b.x - x, b.y - y) >= 2 * R + 1);
}

// Leva (x, y) ao ponto válido mais próximo
export function nearestValidCuePos(game, x, y) {
  const cx = Math.min(X1 - R, Math.max(X0 + R, x));
  const cy = Math.min(Y1 - R, Math.max(Y0 + R, y));
  if (validCuePos(game, cx, cy)) return { x: cx, y: cy };
  let best = null;
  for (let r = 4; r <= 200 && !best; r += 4) {
    for (let a = 0; a < 24; a++) {
      const px = cx + Math.cos((a / 24) * Math.PI * 2) * r;
      const py = cy + Math.sin((a / 24) * Math.PI * 2) * r;
      if (validCuePos(game, px, py)) { best = { x: px, y: py }; break; }
    }
  }
  return best || { x: HEAD_X, y: MID_Y };
}

export { newShot };
