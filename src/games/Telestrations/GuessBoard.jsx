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
                <div className={`text-4xl font-bold font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {timeLeft}s
                </div>
            </div>

            <div className="w-full bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-700 text-center">
                <h2 className="text-2xl text-gray-300 mb-4">O que é isso?</h2>

                <div className="bg-[#2F4F4F] p-4 rounded-lg border-4 border-yellow-900 mb-6 inline-block">
                    <img src={drawingToGuess} alt="Desenho para adivinhar" className="max-w-[700px] max-h-[500px] object-contain bg-white/5" />
                </div>

                <div className="w-full max-w-lg mx-auto">
                    <input
                        type="text"
                        placeholder="Digite seu palpite..."
                        className="w-full p-4 text-2xl text-center bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400 mb-4 border-b-4 border-gray-600"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFinish()}
                        autoFocus
                    />
                    <button
                        onClick={handleFinish}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition text-xl shadow-lg"
                    >
                        CONFIRMAR PALPITE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuessBoard;
