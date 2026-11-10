import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Lobby from './Lobby';
import CanvasBoard from './CanvasBoard';
import GuessBoard from './GuessBoard';
import ResultGallery from './ResultGallery';

const WORD_LISTS = {
    'Diversos': ['Gato', 'Pizza', 'Futebol', 'Batman', 'Praia', 'Fantasma', 'Girafa', 'Sorvete', 'Rock n Roll', 'Aliens'],
    'Natal': ['Papai Noel', 'Árvore de Natal', 'Rena', 'Presente', 'Neve', 'Chaminé', 'Estrela', 'Duende', 'Trenó', 'Ceia'],
    'Animais': ['Leão', 'Elefante', 'Cachorro', 'Gato', 'Tubarão', 'Águia', 'Cobra', 'Macaco', 'Pinguim', 'Baleia'],
    'Comidas': ['Hamburguer', 'Pizza', 'Sushi', 'Macarrão', 'Sorvete', 'Bolo', 'Frango Assado', 'Ovo frito', 'Salada', 'Chocolate'],
    'Objetos': ['Cadeira', 'Mesa', 'Computador', 'Celular', 'Lâmpada', 'Relógio', 'Espelho', 'Guarda-chuva', 'Chave', 'Livro']
};

const TelestrationsGame = () => {
    // Game State: 'LOBBY' | 'DRAWING' | 'GUESSING' | 'RESULTS' | 'INTERMISSION' | 'REVEAL_MOMENT'
    const [gameState, setGameState] = useState('LOBBY');
    const [gameMode, setGameMode] = useState('ONLINE'); // 'ONLINE' | 'LOCAL'

    // Player/Room Info
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [roomId, setRoomId] = useState(null);

    // Game Data
    const [currentRound, setCurrentRound] = useState(0);
    const [myChain, setMyChain] = useState([]); // Steps in my current notebook
    const [currentInput, setCurrentInput] = useState(null); // What I need to draw/guess this turn

    // Local Mode Data
    const [pendingNextInput, setPendingNextInput] = useState(null);
    const [pendingNextState, setPendingNextState] = useState(null);
    const [totalPlayers, setTotalPlayers] = useState(4);

    // Mock Result Data (for Demo)
    const [finalResults, setFinalResults] = useState([]);

    const handleJoin = (room, player, isHost) => {
        setRoomId(room);
        setCurrentPlayer(player);
    };

    const handleStartGame = (mode = 'ONLINE', options = {}) => {
        setGameMode(mode);
        if (options.playerCount) setTotalPlayers(options.playerCount);

        // Word Selection based on Theme
        const theme = options.theme || 'Diversos';
        const currentList = WORD_LISTS[theme] || WORD_LISTS['Diversos'];
        const randomWord = currentList[Math.floor(Math.random() * currentList.length)];

        const startInput = { type: 'word', content: randomWord };

        setCurrentInput(startInput);
        setMyChain([{ ...startInput, author: 'Sistema' }]);

        if (mode === 'LOCAL') {
            setGameState('DRAWING');
        } else {
            setGameState('DRAWING');
        }
    };

    const handleTurnFinish = (data) => {
        // data: { type: 'drawing' | 'guess', content: string }
        const newStep = { ...data, author: currentPlayer || `Jogador ${myChain.length}` }; // myChain[0] é a palavra sorteada
        const newChain = [...myChain, newStep];
        setMyChain(newChain);

        let nextState, nextInput;
        // Chain structure: [Word(0), Step1(1), Step2(2), ... StepN(N)]
        // Current length is newChain.length.
        // If we want N players to play, we need N user steps. 
        // newChain includes system word, so we need newChain.length === totalPlayers + 1.
        // Example: 4 players. chain: Word (1) -> P1 (2) -> P2 (3) -> P3 (4) -> P4 (5). Total 5.
        // So checking if newChain.length > totalPlayers is correct (5 > 4).
        const isGameEnd = newChain.length > totalPlayers;

        if (gameState === 'DRAWING') {
            // Finished Drawing. Next phase: GUESSING
            nextInput = { type: 'drawing', content: data.content };
            nextState = 'GUESSING';
        } else {
            // Finished Guessing. Next phase: DRAWING
            nextInput = { type: 'word', content: data.content };
            nextState = 'DRAWING';
        }

        if (isGameEnd) {
            setFinalResults([
                { initialWord: myChain[0].content, owner: currentPlayer, steps: newChain.slice(1) }
            ]);
            nextState = 'RESULTS';
        }

        if (gameMode === 'LOCAL') {
            if (isGameEnd) {
                // Go to Reveal Moment instead of Results directly
                setGameState('REVEAL_MOMENT');
            } else {
                // Setup intermission
                setPendingNextInput(nextInput);
                setPendingNextState(nextState);
                setGameState('INTERMISSION');
            }
        } else {
            // Online or Results -> Proceed immediately
            if (!isGameEnd) {
                setCurrentInput(nextInput || currentInput);
                setGameState(nextState);
            } else {
                setGameState('RESULTS');
            }
        }
    };

    const startNextLocalTurn = () => {
        setCurrentInput(pendingNextInput);
        setGameState(pendingNextState);
        setPendingNextInput(null);
        setPendingNextState(null);
    };

    const showLocalResults = () => {
        setGameState('RESULTS');
    };

    const handleRestart = () => {
        setGameState('LOBBY');
        setMyChain([]);
        setCurrentInput(null);
        setGameMode('ONLINE');
    };

    return (
        <div className="min-h-screen bg-canvas text-ink flex flex-col items-center px-4 pb-8 pt-4 md:px-8">
            <header className="mb-4 flex w-full max-w-5xl items-center justify-between gap-3 md:mb-8">
                <Link to="/" className="btn-ghost shrink-0 px-4" aria-label="Voltar ao VAH Games">
                    <span aria-hidden="true">←</span>
                    <span className="hidden sm:inline">VAH Games</span>
                </Link>
                <h1 className="font-display min-w-0 truncate text-[20px] md:text-[32px] font-black uppercase text-ink">
                    Lousa Mágica
                </h1>
                <span className="w-10 shrink-0 sm:w-28" aria-hidden="true" />
            </header>

            {gameState === 'LOBBY' && (
                <Lobby onJoinRoom={handleJoin} onGameStart={handleStartGame} />
            )}

            {gameState === 'INTERMISSION' && (
                <div className="flex w-full max-w-xl flex-col items-center justify-center p-6 md:p-8 text-center bg-white/[0.07] rounded-xs border-2 border-lime">
                    <h2 className="text-[28px] md:text-4xl font-bold text-violet-bright mb-4">VEZ DO PRÓXIMO!</h2>
                    <p className="text-xl text-body mb-8">Passe o dispositivo para o próximo jogador.</p>
                    <div className="text-6xl mb-8">🔄📱</div>
                    <button
                        onClick={startNextLocalTurn}
                        className="btn-lime h-auto min-h-12 whitespace-normal px-6 py-3 text-[16px] font-extrabold"
                    >
                        Próximo jogador: toque para começar
                    </button>
                </div>
            )}

            {gameState === 'REVEAL_MOMENT' && (
                <div className="flex flex-col items-center justify-center p-4 md:p-8 bg-canvas rounded-xs max-w-2xl text-center">
                    <h2 className="font-display text-[28px] md:text-[36px] font-black uppercase text-lime mb-8">
                        FIM DE JOGO!
                    </h2>
                    <p className="text-body-xl text-body mb-12">
                        Todos já jogaram. Agora é a hora da verdade...
                    </p>
                    <div className="mb-12">
                        <span className="text-6xl animate-bounce inline-block">🫣</span>
                    </div>
                    <button
                        onClick={showLocalResults}
                        className="btn-lime h-12 px-8 text-[16px] font-extrabold hover:scale-105"
                    >
                        REVELAR RESULTADO
                    </button>
                    <p className="mt-6 text-muted text-sm">Junte todos para ver!</p>
                </div>
            )}

            {gameState === 'DRAWING' && (
                <CanvasBoard
                    wordToDraw={currentInput.content}
                    onFinishTurn={handleTurnFinish}
                />
            )}

            {gameState === 'GUESSING' && (
                <GuessBoard
                    drawingToGuess={currentInput.content}
                    onFinishTurn={handleTurnFinish}
                />
            )}

            {gameState === 'RESULTS' && (
                <ResultGallery results={finalResults} onRestart={handleRestart} />
            )}
        </div>
    );
};

export default TelestrationsGame;
