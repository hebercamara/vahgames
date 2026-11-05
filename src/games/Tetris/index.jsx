import React, { useState, useEffect, useCallback } from 'react';

// Tetromino definitions
const TETROMINOS = {
    0: { shape: [[0]], color: '0, 0, 0' },
    I: { shape: [[0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0]], color: '80, 227, 230' },
    J: { shape: [[0, 'J', 0], [0, 'J', 0], ['J', 'J', 0]], color: '36, 95, 223' },
    L: { shape: [[0, 'L', 0], [0, 'L', 0], [0, 'L', 'L']], color: '223, 173, 36' },
    O: { shape: [['O', 'O'], ['O', 'O']], color: '223, 217, 36' },
    S: { shape: [[0, 'S', 'S'], ['S', 'S', 0], [0, 0, 0]], color: '48, 211, 56' },
    T: { shape: [[0, 'T', 0], ['T', 'T', 'T'], [0, 0, 0]], color: '132, 61, 198' },
    Z: { shape: [['Z', 'Z', 0], [0, 'Z', 'Z'], [0, 0, 0]], color: '227, 78, 78' },
};

const RANDOM_TETROMINO = () => {
    const tetrominos = 'IJLOSTZ';
    const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
    return TETROMINOS[randTetromino];
};

// Stage width and height
const STAGE_WIDTH = 10;
const STAGE_HEIGHT = 20;

const createStage = () =>
    Array.from(Array(STAGE_HEIGHT), () =>
        new Array(STAGE_WIDTH).fill([0, 'clear'])
    );

const checkCollision = (player, stage, { x: moveX, y: moveY }) => {
    for (let y = 0; y < player.tetromino.shape.length; y += 1) {
        for (let x = 0; x < player.tetromino.shape[y].length; x += 1) {
            if (player.tetromino.shape[y][x] !== 0) {
                if (
                    !stage[y + player.pos.y + moveY] ||
                    !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
                    stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !== 'clear'
                ) {
                    return true;
                }
            }
        }
    }
    return false;
};

// Custom Hook: useGameStatus
const useGameStatus = rowsCleared => {
    const [score, setScore] = useState(0);
    const [rows, setRows] = useState(0);
    const [level, setLevel] = useState(0);

    useEffect(() => {
        const calcScore = () => {
            const linePoints = [40, 100, 300, 1200];
            if (rowsCleared > 0) {
                setScore(prev => prev + linePoints[rowsCleared - 1] * (level + 1));
                setRows(prev => prev + rowsCleared);
                setLevel(prev => Math.floor((prev + rowsCleared) / 10));
            }
        };
        calcScore();
    }, [rowsCleared, level]);

    return [score, setScore, rows, setRows, level, setLevel];
};

// Custom Hook: useInterval
function useInterval(callback, delay) {
    const savedCallback = React.useRef();
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

// Main Component
const TetrisGame = () => {
    const [stage, setStage] = useState(createStage());
    const [dropTime, setDropTime] = useState(null);
    const [gameOver, setGameOver] = useState(false);

    const [player, setPlayer] = useState({
        pos: { x: 0, y: 0 },
        tetromino: TETROMINOS[0].shape,
        collided: false,
    });

    const [rowsCleared, setRowsCleared] = useState(0);
    const [score, setScore, rows, setRows, level, setLevel] = useGameStatus(rowsCleared);

    const movePlayer = dir => {
        if (!checkCollision(player, stage, { x: dir, y: 0 })) {
            updatePlayerPos({ x: dir, y: 0 });
        }
    };

    const startGame = () => {
        setStage(createStage());
        setDropTime(1000);
        resetPlayer();
        setGameOver(false);
        setScore(0);
        setRows(0);
        setLevel(0);
    };

    const resetPlayer = useCallback(() => {
        setPlayer({
            pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
            tetromino: RANDOM_TETROMINO().shape,
            collided: false,
        });
    }, []);

    const updatePlayerPos = ({ x, y, collided }) => {
        setPlayer(prev => ({
            ...prev,
            pos: { x: (prev.pos.x += x), y: (prev.pos.y += y) },
            collided,
        }));
    };

    const drop = () => {
        if (rows > (level + 1) * 10) {
            setLevel(prev => prev + 1);
            setDropTime(1000 / (level + 1) + 200);
        }

        if (!checkCollision(player, stage, { x: 0, y: 1 })) {
            updatePlayerPos({ x: 0, y: 1, collided: false });
        } else {
            if (player.pos.y < 1) {
                setGameOver(true);
                setDropTime(null);
            }
            updatePlayerPos({ x: 0, y: 0, collided: true });
        }
    };

    const keyUp = ({ keyCode }) => {
        if (!gameOver) {
            if (keyCode === 40) {
                setDropTime(1000 / (level + 1) + 200);
            }
        }
    };

    const dropPlayer = () => {
        setDropTime(null);
        drop();
    };

    const move = ({ keyCode }) => {
        if (!gameOver) {
            if (keyCode === 37) {
                movePlayer(-1);
            } else if (keyCode === 39) {
                movePlayer(1);
            } else if (keyCode === 40) {
                dropPlayer();
            } else if (keyCode === 38) {
                playerRotate(stage, 1);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameOver) {
                // Prevent default scrolling for arrow keys
                if ([37, 38, 39, 40].includes(e.keyCode)) {
                    e.preventDefault();
                    move(e);
                }
            }
        };

        const handleKeyUp = (e) => {
            if (!gameOver) {
                if (e.keyCode === 40) {
                    keyUp(e);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameOver, move, keyUp]);

    const playerRotate = (stage, dir) => {
        const clonedPlayer = JSON.parse(JSON.stringify(player));
        clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

        const pos = clonedPlayer.pos.x;
        let offset = 1;
        while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
            clonedPlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > clonedPlayer.tetromino[0].length) {
                rotate(clonedPlayer.tetromino, -dir);
                clonedPlayer.pos.x = pos;
                return;
            }
        }
        setPlayer(clonedPlayer);
    };

    const rotate = (matrix, dir) => {
        const rotatedTetro = matrix.map((_, index) =>
            matrix.map(col => col[index])
        );
        if (dir > 0) return rotatedTetro.map(row => row.reverse());
        return rotatedTetro.reverse();
    };

    useInterval(() => {
        drop();
    }, dropTime);

    const updateStage = useCallback(prevStage => {
        // First flush the stage from the previous render
        const newStage = prevStage.map(row =>
            row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
        );

        // Then draw the tetromino
        player.tetromino.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    newStage[y + player.pos.y][x + player.pos.x] = [
                        value,
                        `${player.collided ? 'merged' : 'clear'}`,
                    ];
                }
            });
        });

        // Then check if we collided
        if (player.collided) {
            resetPlayer();
            const sweepRows = newStage.reduce((ack, row) => {
                if (row.findIndex(cell => cell[0] === 0) === -1) {
                    setRowsCleared(prev => prev + 1);
                    ack.unshift(new Array(newStage[0].length).fill([0, 'clear']));
                    return ack;
                }
                ack.push(row);
                return ack;
            }, []);
            return sweepRows;
        }

        return newStage;
    }, [player, resetPlayer]);


    useEffect(() => {
        setRowsCleared(0);
        setStage(prev => updateStage(prev));
    }, [player.collided, player.pos.x, player.pos.y, player.tetromino, updateStage]);


    return (
        <div
            className="w-screen h-screen bg-gray-900 overflow-hidden flex items-center justify-center outline-none"
        >
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Game Stage */}
                <div
                    className="grid grid-cols-10 gap-[1px] bg-gray-700 border-4 border-gray-600 rounded-lg shadow-2xl p-1"
                    style={{ width: 'calc(25px * 10 + 20px)', height: 'calc(25px * 20 + 20px)' }}
                >
                    {stage.map(row =>
                        row.map((cell, x) => (
                            <div
                                key={x}
                                style={{
                                    width: '25px',
                                    height: '25px',
                                    background: `rgba(${cell[0] === 0 ? '0,0,0,0.5' : TETROMINOS[cell[0]].color}, 0.8)`,
                                    border: `${cell[0] === 0 ? '0px solid' : '4px solid'} rgba(${TETROMINOS[cell[0]] ? TETROMINOS[cell[0]].color : '0,0,0'}, 1)`,
                                    borderRadius: '4px'
                                }}
                            />
                        ))
                    )}
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-4 text-white min-w-[200px]">
                    <h1 className="text-4xl font-bold font-mono text-cyan-400 mb-4 drop-shadow-lg">EMPILHA BLOCOS</h1>

                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-600">
                        <p className="text-gray-400 text-sm">Score</p>
                        <p className="text-3xl font-mono text-green-400">{score}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-600">
                        <p className="text-gray-400 text-sm">Rows</p>
                        <p className="text-3xl font-mono text-yellow-400">{rows}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-600">
                        <p className="text-gray-400 text-sm">Level</p>
                        <p className="text-3xl font-mono text-purple-400">{level}</p>
                    </div>

                    {!dropTime && !gameOver ? (
                        <button
                            onClick={startGame}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-xl animate-pulse mt-4"
                        >
                            START GAME
                        </button>
                    ) : null}

                    {gameOver && (
                        <div className="bg-red-600/20 border border-red-500 p-4 rounded-xl text-center animate-bounce mt-4">
                            <p className="text-red-500 font-bold text-xl">GAME OVER</p>
                            <button
                                onClick={startGame}
                                className="text-white underline text-sm mt-2"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    <div className="mt-8 text-gray-500 text-xs">
                        <p>Controls:</p>
                        <p>← → : Move</p>
                        <p>↑ : Rotate</p>
                        <p>↓ : Drop</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TetrisGame;
