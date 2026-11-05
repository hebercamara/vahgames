import React, { useState, useEffect } from 'react';

const GuessBoard = ({ drawingToGuess, onFinishTurn }) => {
    const [guess, setGuess] = useState('');
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

    const handleFinish = () => {
        onFinishTurn({ type: 'guess', content: guess || 'Sem resposta' });
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
            <div className="w-full flex justify-end px-4 mb-4">
                <div className={`text-4xl font-bold font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-ink'}`}>
                    {timeLeft}s
                </div>
            </div>

            <div className="w-full bg-white/[0.07] p-4 rounded-xs border border-line text-center">
                <h2 className="text-2xl text-body mb-4">O que é isso?</h2>

                <div className="bg-[#2F4F4F] p-4 rounded-lg border-4 border-yellow-900 mb-6 inline-block">
                    <img src={drawingToGuess} alt="Desenho para adivinhar" className="max-w-[700px] max-h-[500px] object-contain bg-white/5" />
                </div>

                <div className="w-full max-w-lg mx-auto">
                    <input
                        type="text"
                        placeholder="Digite seu palpite..."
                        className="input mb-4 h-14 text-center text-[20px] font-bold"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFinish()}
                        autoFocus
                    />
                    <button
                        onClick={handleFinish}
                        className="btn-lime w-full"
                    >
                        CONFIRMAR PALPITE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuessBoard;
