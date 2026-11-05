// Computador das Damas: busca em segundo plano para não travar a interface
import { bestMove } from './logic';

self.onmessage = (e) => {
  const { id, state, depth, randomness } = e.data;
  self.postMessage({ id, move: bestMove(state, depth, randomness) });
};
