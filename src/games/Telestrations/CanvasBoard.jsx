import React, { useRef, useState, useEffect } from 'react';

const CanvasBoard = ({ wordToDraw, onFinishTurn }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ffffff'); // Chalk white
    const [lineWidth, setLineWidth] = useState(3);
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleFinish();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const getTouchPos = (canvas, touchEvent) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: touchEvent.touches[0].clientX - rect.left,
            y: touchEvent.touches[0].clientY - rect.top
        };
    };

    const startTouchDrawing = (e) => {
        e.preventDefault(); // Prevent scrolling
        const { x, y } = getTouchPos(canvasRef.current, e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const touchDraw = (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const { x, y } = getTouchPos(canvasRef.current, e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.closePath();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleFinish = () => {
        const dataUrl = canvasRef.current.toDataURL();
        onFinishTurn({ type: 'drawing', content: dataUrl });
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
            <div className="flex justify-between w-full mb-4 px-4 items-center">
                <div className="bg-white/[0.07] px-4 py-2 rounded text-ink">
                    <span className="text-muted text-sm">Palavra Secreta:</span>
                    <br />
                    <span className="text-2xl font-bold text-violet-bright uppercase tracking-widest">{wordToDraw}</span>
                </div>
                <div className={`text-4xl font-bold font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-ink'}`}>
                    {timeLeft}s
                </div>
            </div>

            <div className="relative border-8 border-yellow-900 rounded-lg bg-[#1a1a1a]">
                {/* Chalkboard Texture Effect */}
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="cursor-crosshair bg-[#2F4F4F] touch-none" // touch-none prevents browser scrolling
                    style={{ touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startTouchDrawing}
                    onTouchMove={touchDraw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            <div className="flex gap-4 mt-6">
                <button
                    onClick={() => { setColor('#ffffff'); setLineWidth(3); }}
                    className={`w-12 h-12 rounded-full bg-white border-2 ${color === '#ffffff' ? 'border-lime scale-110' : 'border-line'}`}
                    title="Giz Branco"
                />
                <button
                    onClick={() => { setColor('#FFD700'); setLineWidth(3); }}
                    className={`w-12 h-12 rounded-full bg-yellow-400 border-2 ${color === '#FFD700' ? 'border-lime scale-110' : 'border-line'}`}
                    title="Giz Amarelo"
                />
                <button
                    onClick={() => { setColor('#FF6347'); setLineWidth(3); }}
                    className={`w-12 h-12 rounded-full bg-red-500 border-2 ${color === '#FF6347' ? 'border-lime scale-110' : 'border-line'}`}
                    title="Giz Vermelho"
                />
                <button
                    onClick={() => { setColor('#2F4F4F'); setLineWidth(20); }} // Eraser is just drawing background color
                    className={`w-12 h-12 rounded-full bg-gray-600 border-2 flex items-center justify-center ${color === '#2F4F4F' ? 'border-lime scale-110' : 'border-line'}`}
                    title="Apagador"
                >
                    🧽
                </button>

                <div className="w-8"></div>

                <button
                    onClick={clearCanvas}
                    className="btn-ghost px-4"
                >
                    Limpar Tudo
                </button>

                <button
                    onClick={handleFinish}
                    className="btn-lime ml-auto px-6"
                >
                    ENVIAR
                </button>
            </div>
        </div>
    );
};

export default CanvasBoard;
