import React, { useEffect, useRef, useState } from 'react';

const GuessBoard = ({ drawingToGuess, onFinishTurn }) => {
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const guessRef = useRef('');
  const finishedRef = useRef(false);

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinishTurn({ type: 'guess', content: guessRef.current.trim() || 'Sem resposta' });
  };
  const finishRef = useRef(handleFinish);
  finishRef.current = handleFinish;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => finishRef.current(), 0); // envia o que já foi digitado
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const urgent = timeLeft < 10;

  return (
    <div className="flex w-full max-w-4xl flex-col gap-3 md:gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-black uppercase text-ink md:text-[26px]">O que é isso?</h2>
        <div
          className={`shrink-0 rounded-xs px-4 py-2 font-mono text-[28px] font-black md:text-[36px] ${
            urgent ? 'animate-pulse bg-red-500/20 text-red-400' : 'bg-white/[0.07] text-ink'
          }`}
          aria-live="polite"
        >
          {timeLeft}s
        </div>
      </div>

      <div className="mx-auto w-full max-w-[calc((100dvh-300px)*4/3)] rounded-lg border-[6px] border-yellow-900 bg-[#2F4F4F] md:max-w-[min(760px,calc((100dvh-330px)*4/3))] md:border-8">
        <img src={drawingToGuess} alt="Desenho para adivinhar" className="block h-auto w-full" style={{ aspectRatio: '4 / 3' }} />
      </div>

      <form
        className="mx-auto flex w-full max-w-lg flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleFinish();
        }}
      >
        <input
          type="text"
          placeholder="Digite seu palpite..."
          className="input h-14 text-center text-[20px] font-bold"
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value);
            guessRef.current = e.target.value;
          }}
          autoFocus
        />
        <button type="submit" className="btn-lime h-12 w-full text-[16px]">
          Confirmar palpite
        </button>
      </form>
    </div>
  );
};

export default GuessBoard;
