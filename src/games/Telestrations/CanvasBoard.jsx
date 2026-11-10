import React, { useEffect, useRef, useState } from 'react';

// Lousa: o desenho tem sempre 800x600 por dentro (fica igual em qualquer aparelho) e é mostrado
// no tamanho que cabe na tela. Celular: quadro na largura toda e ferramentas embaixo.
// Tablet/computador: quadro grande e ferramentas numa coluna ao lado.

const BOARD_W = 800;
const BOARD_H = 600;
const CHALK_BG = '#2F4F4F';

const TOOLS = [
  { id: 'branco', color: '#ffffff', width: 4, label: 'Giz branco', swatch: 'bg-white' },
  { id: 'amarelo', color: '#FFD700', width: 4, label: 'Giz amarelo', swatch: 'bg-yellow-400' },
  { id: 'vermelho', color: '#FF6347', width: 4, label: 'Giz vermelho', swatch: 'bg-red-500' },
  { id: 'azul', color: '#7FD3FF', width: 4, label: 'Giz azul', swatch: 'bg-sky-300' },
  { id: 'apagador', color: CHALK_BG, width: 28, label: 'Apagador', swatch: 'bg-gray-600', icon: '🧽' },
];

const CanvasBoard = ({ wordToDraw, onFinishTurn }) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const finishedRef = useRef(false);
  const [tool, setTool] = useState(TOOLS[0]);
  const [timeLeft, setTimeLeft] = useState(60);

  const paintBackground = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = CHALK_BG;
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  };

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinishTurn({ type: 'drawing', content: canvasRef.current.toDataURL('image/png') });
  };
  const finishRef = useRef(handleFinish);
  finishRef.current = handleFinish;

  useEffect(() => {
    paintBackground();
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => finishRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Posição do dedo/mouse convertida para a resolução interna do quadro
  const toBoard = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * BOARD_W,
      y: ((e.clientY - rect.top) / rect.height) * BOARD_H,
    };
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    const { x, y } = toBoard(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = tool.color;
    ctx.fillStyle = tool.color;
    ctx.lineWidth = tool.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(x, y, tool.width / 2, 0, Math.PI * 2); // um toque já deixa um ponto
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingRef.current = true;
  };

  const onPointerMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = toBoard(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const urgent = timeLeft < 10;

  const toolButtons = (
    <>
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTool(t)}
          aria-label={t.label}
          aria-pressed={tool.id === t.id}
          title={t.label}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-[18px] transition md:h-12 md:w-12 ${t.swatch} ${
            tool.id === t.id ? 'scale-110 border-lime ring-2 ring-lime/40' : 'border-line'
          }`}
        >
          {t.icon}
        </button>
      ))}
    </>
  );

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3 md:gap-4">
      {/* Palavra e tempo */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 rounded-xs bg-white/[0.07] px-4 py-2">
          <span className="text-caption uppercase text-muted">Desenhe</span>
          <p className="truncate text-[20px] font-black uppercase tracking-wider text-violet-bright md:text-[26px]">{wordToDraw}</p>
        </div>
        <div
          className={`shrink-0 rounded-xs px-4 py-2 font-mono text-[28px] font-black md:text-[36px] ${
            urgent ? 'animate-pulse bg-red-500/20 text-red-400' : 'bg-white/[0.07] text-ink'
          }`}
          aria-live="polite"
        >
          {timeLeft}s
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {/* Quadro: cabe na largura e, no celular, também na altura da tela */}
        <div className="mx-auto w-full min-w-0 md:flex-1">
          <div className="mx-auto w-full max-w-[calc((100dvh-260px)*4/3)] rounded-lg border-[6px] border-yellow-900 bg-[#1a1a1a] shadow-lift md:max-w-[calc((100dvh-230px)*4/3)] md:border-8">
            <canvas
              ref={canvasRef}
              width={BOARD_W}
              height={BOARD_H}
              className="block h-auto w-full cursor-crosshair select-none"
              style={{ aspectRatio: `${BOARD_W} / ${BOARD_H}`, touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
              aria-label={`Lousa para desenhar: ${wordToDraw}`}
            />
          </div>
        </div>

        {/* Ferramentas: fileira embaixo no celular, coluna ao lado no tablet/computador */}
        <div className="flex flex-col gap-3 md:w-40 md:shrink-0">
          <div className="flex items-center justify-center gap-2 md:flex-wrap md:justify-start md:rounded-xs md:bg-white/[0.07] md:p-3">
            {toolButtons}
          </div>
          <div className="flex gap-2 md:flex-col">
            <button type="button" onClick={paintBackground} className="btn-ghost flex-1 px-4 md:flex-none">
              Limpar tudo
            </button>
            <button type="button" onClick={handleFinish} className="btn-lime h-12 flex-[2] px-6 text-[16px] md:flex-none">
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasBoard;
