import React, { useEffect, useMemo, useRef, useState } from 'react';

// Tabuleiro de xadrez em pixel art com perspectiva.
//
// O tabuleiro é um <div> plano (textura gerada num canvas pequeno e ampliada sem suavizar)
// inclinado com CSS: perspective(P) rotateX(TILT). As peças são sprites "em pé", posicionadas
// com a mesma conta de projeção, então ficam sempre em cima da casa certa.
// As peças do lado de baixo aparecem de costas (viradas para o adversário) e as de cima, de frente.

// Cena em coordenadas de projeto; tudo é escalado para caber na largura disponível
const SCENE_W = 640;
const SCENE_H = 550;
const CENTER_Y = 280; // centro do tabuleiro na cena

const PX = 4; // cada pixel da textura vira 4x4 na tela
const TILE_PX = 14; // casa com 14 pixels de textura
const FRAME_PX = 5; // moldura com 5 pixels
const TILE = TILE_PX * PX; // 56
const FRAME = FRAME_PX * PX; // 20
const BOARD = TILE * 8 + FRAME * 2; // 488

const PERSPECTIVE = 900;
const TILT = (30 * Math.PI) / 180;

// Altura das peças: tamanho do sprite × SPRITE_SCALE × escala da perspectiva
const SPRITE_SCALE = 0.5;

// Tamanho natural (px) de cada sprite em /images/xadrez
export const SPRITES = {
  'wp-frente': [62, 130], 'wp-costas': [62, 130], 'wr-frente': [66, 158], 'wr-costas': [66, 158],
  'wn-frente': [73, 163], 'wn-costas': [70, 163], 'wb-frente': [70, 191], 'wb-costas': [63, 190],
  'wq-frente': [65, 188], 'wq-costas': [64, 188], 'wk-frente': [71, 198], 'wk-costas': [73, 194],
  'bp-frente': [65, 141], 'bp-costas': [64, 141], 'br-frente': [64, 144], 'br-costas': [65, 144],
  'bn-frente': [69, 167], 'bn-costas': [70, 168], 'bb-frente': [71, 190], 'bb-costas': [66, 190],
  'bq-frente': [68, 194], 'bq-costas': [65, 194], 'bk-frente': [77, 199], 'bk-costas': [78, 197],
};
export const spriteUrl = (color, type, side = 'frente') => `/images/xadrez/${color}${type}-${side}.png`;

const FILES = 'abcdefgh';

// Ponto do plano do tabuleiro (relativo ao centro, em px de projeto) -> ponto na cena e escala
function project(x, y) {
  const yr = y * Math.cos(TILT);
  const z = y * Math.sin(TILT);
  const s = PERSPECTIVE / (PERSPECTIVE - z);
  return { x: SCENE_W / 2 + x * s, y: CENTER_Y + yr * s, s };
}

// Casa (ex.: "e4") -> coluna e linha na tela, de acordo com o lado que fica embaixo
function squareToCell(square, orientation) {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  return orientation === 'white' ? { col: file, row: 7 - rank } : { col: 7 - file, row: rank };
}
function cellToSquare(col, row, orientation) {
  return orientation === 'white' ? `${FILES[col]}${8 - row}` : `${FILES[7 - col]}${row + 1}`;
}
const cellCenter = ({ col, row }) => ({ x: FRAME + col * TILE + TILE / 2 - BOARD / 2, y: FRAME + row * TILE + TILE / 2 - BOARD / 2 });

// Gerador pseudoaleatório fixo, para a textura sair sempre igual
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function boardTexture() {
  const size = TILE_PX * 8 + FRAME_PX * 2;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const rand = rng(7);
  const px = (x, y, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, 1, 1);
  };
  // Moldura de madeira escura com filete dourado
  g.fillStyle = '#3B2416';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < size; i++) {
    for (const [x, y] of [[i, 0], [i, size - 1], [0, i], [size - 1, i]]) px(x, y, '#1E120B');
    for (const [x, y] of [[i, 1], [1, i]]) if (i > 0 && i < size - 1) px(x, y, '#5A3822');
  }
  for (let y = 2; y < size - 2; y++) for (let x = 2; x < size - 2; x++) if (rand() < 0.12) px(x, y, rand() < 0.5 ? '#4A2E1C' : '#2F1C11');
  g.fillStyle = '#C9A04A';
  g.fillRect(FRAME_PX - 1, FRAME_PX - 1, TILE_PX * 8 + 2, TILE_PX * 8 + 2);
  // Casas com pontilhado de pixel art
  const light = ['#E9D3A2', '#DFC690', '#F2E0B6'];
  const dark = ['#8E5A35', '#7E4E2D', '#9C6740'];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const pal = (r + f) % 2 === 0 ? light : dark;
      const x0 = FRAME_PX + f * TILE_PX;
      const y0 = FRAME_PX + r * TILE_PX;
      g.fillStyle = pal[0];
      g.fillRect(x0, y0, TILE_PX, TILE_PX);
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const v = rand();
          if (v < 0.1) px(x0 + x, y0 + y, pal[1]);
          else if (v < 0.16) px(x0 + x, y0 + y, pal[2]);
        }
      }
      // Sombra de 1 pixel na borda de baixo/direita: dá volume às casas
      g.fillStyle = 'rgba(0,0,0,0.12)';
      g.fillRect(x0, y0 + TILE_PX - 1, TILE_PX, 1);
      g.fillRect(x0 + TILE_PX - 1, y0, 1, TILE_PX);
    }
  }
  return c.toDataURL();
}

function skyTexture() {
  const w = SCENE_W / PX;
  const h = SCENE_H / PX;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const bands = ['#120C24', '#181030', '#1F143B', '#271946', '#2F1E50', '#38235A', '#412863'];
  const bandH = Math.ceil(h / bands.length);
  bands.forEach((color, i) => {
    g.fillStyle = color;
    g.fillRect(0, i * bandH, w, bandH);
    // Pontilhado na transição entre faixas
    if (i > 0) {
      g.fillStyle = bands[i - 1];
      for (let x = i % 2; x < w; x += 2) g.fillRect(x, i * bandH, 1, 1);
    }
  });
  const rand = rng(42);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(rand() * h * 0.45);
    g.fillStyle = rand() < 0.2 ? '#C7FF5B' : rand() < 0.5 ? '#FFFFFF' : '#8F86C9';
    g.fillRect(x, y, 1, 1);
  }
  return c.toDataURL();
}

// Mantém a identidade de cada peça entre lances (para animar o deslize)
function assignIds(prev, pieces, nextId) {
  const left = new Map(prev.map((p) => [p.id, p]));
  const result = [];
  const pending = [];
  for (const p of pieces) {
    const same = prev.find((q) => left.has(q.id) && q.square === p.square && q.color === p.color && q.type === p.type);
    if (same) {
      left.delete(same.id);
      result.push({ ...p, id: same.id });
    } else pending.push(p);
  }
  for (const p of pending) {
    const cands = [...left.values()].filter((q) => q.color === p.color && (q.type === p.type || q.type === 'p'));
    cands.sort((a, b) => (a.type === p.type ? 0 : 1) - (b.type === p.type ? 0 : 1));
    const q = cands[0];
    if (q) {
      left.delete(q.id);
      result.push({ ...p, id: q.id });
    } else result.push({ ...p, id: nextId.current++ });
  }
  return result;
}

export default function PixelBoard({ board, orientation, selected, targets, lastMove, checkSquare, interactive, onSquare }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const textures = useMemo(() => ({ board: boardTexture(), sky: skyTexture() }), []);
  const nextId = useRef(1);
  const idsRef = useRef([]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / SCENE_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pieces = useMemo(() => {
    const list = board.flat().filter(Boolean).map(({ square, type, color }) => ({ square, type, color }));
    const withIds = assignIds(idsRef.current, list, nextId);
    idsRef.current = withIds;
    return withIds;
  }, [board]);

  const bottomColor = orientation === 'white' ? 'w' : 'b';
  const targetMap = new Map(targets.map((t) => [t.to, t]));

  // Clique: vale a casa do chão sob o cursor quando ela é um destino ou tem peça;
  // senão vale o sprite clicado (cabeça de uma peça cobrindo uma casa vazia); senão, a casa.
  const handleClick = (e) => {
    if (!interactive) return;
    if (e.detail === 0) {
      const sq = e.target.closest('[data-sq]')?.dataset.sq;
      if (sq) onSquare(sq);
      return;
    }
    const els = document.elementsFromPoint(e.clientX, e.clientY);
    const floor = els.find((el) => el.dataset?.sq)?.dataset.sq;
    const piece = els.find((el) => el.dataset?.pieceSq)?.dataset.pieceSq;
    const occupied = floor && pieces.some((p) => p.square === floor);
    if (floor && ((selected && targetMap.has(floor)) || occupied)) onSquare(floor);
    else if (piece) onSquare(piece);
    else if (floor) onSquare(floor);
  };

  const cells = [];
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) cells.push({ col, row, sq: cellToSquare(col, row, orientation) });

  return (
    <div ref={wrapRef} className="px-scene relative w-full overflow-hidden" style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}` }}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: SCENE_W, height: SCENE_H, transform: `scale(${scale})`, backgroundImage: `url(${textures.sky})`, backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
        onClick={handleClick}
        role="presentation"
      >
        {/* Tabuleiro inclinado */}
        <div
          className="absolute"
          style={{
            width: BOARD,
            height: BOARD,
            left: (SCENE_W - BOARD) / 2,
            top: CENTER_Y - BOARD / 2,
            transform: `perspective(${PERSPECTIVE}px) rotateX(${TILT}rad)`,
            backgroundImage: `url(${textures.board})`,
            backgroundSize: '100% 100%',
            imageRendering: 'pixelated',
            boxShadow: '0 28px 0 #1E120B, 0 40px 30px rgba(0,0,0,.5)',
          }}
          role="grid"
          aria-label="Tabuleiro de xadrez"
        >
          {cells.map(({ col, row, sq }) => {
            const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const target = targetMap.get(sq);
            const occupant = pieces.find((p) => p.square === sq);
            return (
              <button
                key={sq}
                type="button"
                data-sq={sq}
                tabIndex={interactive ? 0 : -1}
                aria-label={`${sq}${occupant ? `, ${occupant.color === 'w' ? 'branca' : 'preta'}` : ''}`}
                className="absolute focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
                style={{ left: FRAME + col * TILE, top: FRAME + row * TILE, width: TILE, height: TILE }}
              >
                {isLast && <span className="absolute inset-0 bg-[#F7D354]/45" />}
                {checkSquare === sq && <span className="absolute inset-0 bg-[#F0001B]/55" />}
                {selected === sq && <span className="absolute inset-0 border-[6px] border-[#C7FF5B] bg-[#C7FF5B]/25" />}
                {target && !target.captured && <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 bg-[#1A3A0C]/70 shadow-[0_0_0_4px_rgba(199,255,91,.6)]" />}
                {target && target.captured && (
                  <>
                    {['left-0 top-0', 'right-0 top-0', 'left-0 bottom-0', 'right-0 bottom-0'].map((pos) => (
                      <span key={pos} className={`absolute ${pos} h-3 w-3 bg-[#F0001B]`} />
                    ))}
                  </>
                )}
              </button>
            );
          })}
          {/* Sombra das peças, no plano do tabuleiro */}
          {pieces.map((p) => {
            const c = cellCenter(squareToCell(p.square, orientation));
            return (
              <span
                key={`s${p.id}`}
                className="pointer-events-none absolute rounded-full bg-black/35 transition-all duration-300"
                style={{ width: 34, height: 26, left: c.x + BOARD / 2 - 17, top: c.y + BOARD / 2 - 6 }}
              />
            );
          })}
          {/* Coordenadas na moldura */}
          {[...Array(8).keys()].map((i) => (
            <React.Fragment key={i}>
              <span className="px-font pointer-events-none absolute text-[10px] text-[#E9D3A2]" style={{ left: FRAME + i * TILE + TILE / 2 - 4, top: BOARD - FRAME + 5 }}>
                {orientation === 'white' ? FILES[i] : FILES[7 - i]}
              </span>
              <span className="px-font pointer-events-none absolute text-[10px] text-[#E9D3A2]" style={{ left: 5, top: FRAME + i * TILE + TILE / 2 - 5 }}>
                {orientation === 'white' ? 8 - i : i + 1}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Peças em pé */}
        {pieces.map((p) => {
          const c = cellCenter(squareToCell(p.square, orientation));
          const foot = project(c.x, c.y + TILE * 0.18);
          const side = p.color === bottomColor ? 'costas' : 'frente';
          const [w, h] = SPRITES[`${p.color}${p.type}-${side}`];
          const dw = w * SPRITE_SCALE * foot.s;
          const dh = h * SPRITE_SCALE * foot.s;
          const isSel = selected === p.square;
          return (
            <img
              key={p.id}
              src={spriteUrl(p.color, p.type, side)}
              alt=""
              draggable={false}
              data-piece-sq={p.square}
              className={`absolute select-none transition-[left,top,width,height] duration-300 ease-out ${interactive ? 'cursor-pointer' : ''} ${isSel ? 'px-selected' : ''}`}
              style={{ left: foot.x - dw / 2, top: foot.y - dh - (isSel ? 6 : 0), width: dw, height: dh, zIndex: Math.round(foot.y) }}
            />
          );
        })}
      </div>
    </div>
  );
}
