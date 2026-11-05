import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
// import { ref, set, onValue, push, child, update } from "firebase/database";
// import { database } from '../../services/firebase';

// NOTE: For now, using local state mock to demonstrate UI until Firebase keys are added.
// Uncomment Firebase imports and logic when keys are ready.

const Lobby = ({ onGameStart, onJoinRoom }) => {
    const [playerName, setPlayerName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [players, setPlayers] = useState([]);
    const [joined, setJoined] = useState(false);

    // Local Game Settings
    const [localPlayerCount, setLocalPlayerCount] = useState(4);
    const [selectedTheme, setSelectedTheme] = useState('Diversos');

    const createRoom = () => {
        if (!playerName) return alert("Digite seu nome!");
        const newRoomId = uuidv4().slice(0, 6).toUpperCase();
        setRoomId(newRoomId);
        setIsHost(true);
        setJoined(true);
        setPlayers([{ name: playerName, id: uuidv4() }]);

        onJoinRoom(newRoomId, playerName, true);
    };

    const joinRoom = () => {
        if (!playerName || !roomId) return alert("Digite nome e código da sala!");
        setJoined(true);
        // Mock joining
        setPlayers(prev => [...prev, { name: playerName, id: uuidv4() }]);
        onJoinRoom(roomId, playerName, false);
    };

    const startGame = () => {
        onGameStart('ONLINE');
    };

    const startLocalGame = () => {
        if (localPlayerCount < 2) return alert("Mínimo de 2 jogadores!");
        onGameStart('LOCAL', { playerCount: localPlayerCount, theme: selectedTheme });
    }

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto p-6 bg-white/[0.07] rounded-xs border border-line">
            <h2 className="heading mb-6">LOBBY</h2>

            {!joined ? (
                <div className="w-full flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Seu Nome"
                        className="input"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={createRoom}
                            className="btn-lime flex-1"
                        >
                            Criar Sala Online
                        </button>
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-line"></div>
                        <span className="flex-shrink mx-4 text-muted text-sm">JOGO LOCAL</span>
                        <div className="flex-grow border-t border-line"></div>
                    </div>

                    <div className="bg-white/[0.05] p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <label className="text-body">Jogadores:</label>
                            <input
                                type="number"
                                min="2"
                                max="20"
                                value={localPlayerCount}
                                onChange={(e) => setLocalPlayerCount(parseInt(e.target.value))}
                                className="w-16 h-10 rounded-full bg-white/10 text-center text-ink"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-body">Tema:</label>
                            <select
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                                className="h-10 rounded-full bg-white/10 px-3 text-ink text-[14px]"
                            >
                                <option value="Diversos">Diversos</option>
                                <option value="Natal">Natal</option>
                                <option value="Animais">Animais</option>
                                <option value="Comidas">Comidas</option>
                                <option value="Objetos">Objetos</option>
                            </select>
                        </div>
                        <button
                            onClick={startLocalGame}
                            className="btn-light mt-2 h-10 w-full"
                        >
                            Jogar Local (Pass & Play)
                        </button>
                    </div>


                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-line"></div>
                        <span className="flex-shrink mx-4 text-muted text-sm">JOGO ONLINE</span>
                        <div className="flex-grow border-t border-line"></div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Código da Sala"
                            className="input flex-1"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        />
                        <button
                            onClick={joinRoom}
                            className="btn-ghost px-6"
                        >
                            Entrar
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    <div className="bg-canvas p-4 rounded-lg mb-6 border border-line">
                        <p className="text-muted text-sm mb-1">Código da Sala:</p>
                        <p className="text-2xl font-mono text-violet-bright tracking-wider select-all">{roomId}</p>
                    </div>

                    <h3 className="text-xl text-ink mb-4 border-b border-line pb-2">Jogadores ({players.length})</h3>
                    <ul className="space-y-2 mb-8 max-h-60 overflow-y-auto">
                        {players.map((p, i) => (
                            <li key={i} className="flex items-center gap-2 text-lg text-body bg-white/[0.05] p-2 rounded">
                                <span className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-lime' : 'bg-violet-bright'}`}></span>
                                {p.name} {i === 0 && '👑'}
                            </li>
                        ))}
                    </ul>

                    {isHost ? (
                        <button
                            onClick={startGame}
                            className="w-full btn-lime h-12 w-full text-[16px] font-extrabold"
                        >
                            INICIAR JOGO ONLINE
                        </button>
                    ) : (
                        <div className="text-center text-muted italic animate-pulse">
                            Aguardando o anfitrião iniciar...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Lobby;
