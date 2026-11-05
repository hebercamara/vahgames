// Computador adversário do Xadrez: roda o js-chess-engine (MIT) num Web Worker
// para a busca não travar a interface.
import { ai } from 'js-chess-engine';

self.onmessage = (e) => {
  const { id, fen, level } = e.data;
  try {
    const result = ai(fen, { level, play: false, randomness: 15 });
    const [[from, to]] = Object.entries(result.move);
    self.postMessage({ id, from: from.toLowerCase(), to: to.toLowerCase() });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message ? err.message : err) });
  }
};
