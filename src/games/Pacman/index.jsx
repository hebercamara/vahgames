import React, { useState, useEffect, useRef } from 'react';

// Maze layout: 1 = Wall, 0 = Dot, 2 = Empty, 3 = Power Pellet
// 20x20 Grid
const INITIAL_MAZE = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 0, 1, 1, 1, 1],
    [2, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 2, 2],
    [1, 1, 1, 1, 0, 1, 2, 1, 1, 2, 2, 1, 1, 2, 1, 0, 1, 1, 1, 1],
    [2, 2, 2, 2, 0, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 0, 2, 2, 2, 2],
    [1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1],
    [2, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 2, 2],
    [1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
};

const PacmanGame = () => {
    const [maze, setMaze] = useState(JSON.parse(JSON.stringify(INITIAL_MAZE)));
    const [pacman, setPacman] = useState({ x: 1, y: 1, dir: DIRECTIONS.RIGHT, nextDir: DIRECTIONS.RIGHT });
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const gameLoopRef = useRef();

    // Ghosts
    const [ghosts, setGhosts] = useState([
        { x: 9, y: 8, color: 'red', dir: DIRECTIONS.UP },
        { x: 10, y: 8, color: 'pink', dir: DIRECTIONS.DOWN },
        { x: 9, y: 9, color: 'cyan', dir: DIRECTIONS.LEFT },
        { x: 10, y: 9, color: 'orange', dir: DIRECTIONS.RIGHT },
    ]);

    const handleKeyDown = (e) => {
        if (gameOver) return;
        switch (e.key) {
            case 'ArrowUp': setPacman(p => ({ ...p, nextDir: DIRECTIONS.UP })); break;
            case 'ArrowDown': setPacman(p => ({ ...p, nextDir: DIRECTIONS.DOWN })); break;
            case 'ArrowLeft': setPacman(p => ({ ...p, nextDir: DIRECTIONS.LEFT })); break;
            case 'ArrowRight': setPacman(p => ({ ...p, nextDir: DIRECTIONS.RIGHT })); break;
            default: break;
        }
    };

    const moveCharacter = (char, intendedDir) => {
        const newX = char.x + intendedDir.x;
        const newY = char.y + intendedDir.y;

        // Check walls (1 is wall)
        if (maze[newY] && maze[newY][newX] !== undefined && maze[newY][newX] !== 1) {
            return { x: newX, y: newY };
        }
        return { x: char.x, y: char.y };
    };

    const gameLoop = () => {
        if (gameOver) return;

        // Move Pacman
        setPacman(prev => {
            let nextPos;
            let newDir = prev.dir;

            // 1. Try to move in nextDir
            const tryNext = moveCharacter(prev, prev.nextDir);
            if (tryNext.x !== prev.x || tryNext.y !== prev.y) {
                // Success moving in nextDir
                nextPos = tryNext;
                newDir = prev.nextDir;
            } else {
                // 2. If nextDir invalid, try continuing in current dir
                const tryCurrent = moveCharacter(prev, prev.dir);
                if (tryCurrent.x !== prev.x || tryCurrent.y !== prev.y) {
                    nextPos = tryCurrent;
                } else {
                    // Blocked in both directions
                    nextPos = { x: prev.x, y: prev.y };
                }
            }

            // Eat Dots
            if (maze[nextPos.y][nextPos.x] === 0) {
                const newMaze = [...maze];
                newMaze[nextPos.y][nextPos.x] = 2; // Empty
                setMaze(newMaze);
                setScore(s => s + 10);
            }

            return { ...prev, ...nextPos, dir: newDir };
        });

        // Move Ghosts (Simple Random AI)
        setGhosts(prevGhosts => prevGhosts.map(ghost => {
            // 20% chance to change direction randomly or if hitting wall
            let currentDir = ghost.dir;
            const nextPos = moveCharacter(ghost, ghost.dir);

            if (nextPos.x === ghost.x && nextPos.y === ghost.y) {
                // Hit wall, pick random valid direction
                const dirs = Object.values(DIRECTIONS);
                currentDir = dirs[Math.floor(Math.random() * dirs.length)];
            } else if (Math.random() < 0.1) {
                const dirs = Object.values(DIRECTIONS);
                currentDir = dirs[Math.floor(Math.random() * dirs.length)];
            }

            const actualNextPos = moveCharacter(ghost, currentDir);
            return { ...ghost, ...actualNextPos, dir: currentDir };
        }));

        // Check Collisions
        // Done in useEffect for state responsiveness
    };

    useEffect(() => {
        const interval = setInterval(gameLoop, 200); // 5 FPS
        return () => clearInterval(interval);
    }, [maze, gameOver]);

    useEffect(() => {
        // Collision detection
        ghosts.forEach(g => {
            if (g.x === pacman.x && g.y === pacman.y) {
                setGameOver(true);
            }
        });
    }, [pacman, ghosts]);


    useEffect(() => {
        const handleKeyDownWindow = (e) => {
            if (gameOver) return;
            // Prevent default scrolling for arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                handleKeyDown(e);
            }
        };
        window.addEventListener('keydown', handleKeyDownWindow);
        return () => window.removeEventListener('keydown', handleKeyDownWindow);
    }, [gameOver]);

    return (
        <div
            className="w-screen h-screen bg-black flex flex-col items-center justify-center outline-none"
        >
            <h1 className="text-4xl font-bold text-yellow-400 mb-4 tracking-widest font-mono glow">LABIRINTO</h1>

            <div className="relative bg-gray-900 p-2 border-4 border-blue-900 rounded-lg shadow-2xl">
                {maze.map((row, y) => (
                    <div key={y} className="flex">
                        {row.map((cell, x) => (
                            <div
                                key={`${x}-${y}`}
                                className={`w-6 h-6 flex items-center justify-center`}
                            >
                                {cell === 1 && <div className="w-full h-full bg-blue-900 border border-blue-800 rounded-sm"></div>}
                                {cell === 0 && <div className="w-1.5 h-1.5 bg-yellow-200 rounded-full"></div>}
                            </div>
                        ))}
                    </div>
                ))}

                {/* Pacman */}
                <div
                    className="absolute w-5 h-5 bg-yellow-400 rounded-full transition-all duration-150"
                    style={{
                        left: `${pacman.x * 24 + 10}px`,
                        top: `${pacman.y * 24 + 10}px`
                    }}
                >
                    <div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full"></div>
                </div>

                {/* Ghosts */}
                {ghosts.map((ghost, i) => (
                    <div
                        key={i}
                        className="absolute w-5 h-5 rounded-t-full transition-all duration-150"
                        style={{
                            backgroundColor: ghost.color,
                            left: `${ghost.x * 24 + 10}px`,
                            top: `${ghost.y * 24 + 10}px`
                        }}
                    >
                        <div className="flex justify-around pt-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"><div className="w-0.5 h-0.5 bg-blue-900 rounded-full ml-0.5 mt-0.5"></div></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full"><div className="w-0.5 h-0.5 bg-blue-900 rounded-full ml-0.5 mt-0.5"></div></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex gap-8">
                <div className="text-white text-2xl font-mono">
                    SCORE: <span className="text-yellow-400">{score}</span>
                </div>
            </div>

            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                    <h2 className="text-6xl text-red-600 font-bold mb-8 animate-pulse">GAME OVER</h2>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-full text-2xl"
                    >
                        TRY AGAIN
                    </button>
                </div>
            )}
        </div>
    );
};

export default PacmanGame;
