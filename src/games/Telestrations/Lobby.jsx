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
        <div className="flex flex-col items-center w-full max-w-md mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold text-green-400 mb-6 font-mono">LOBBY</h2>

            {!joined ? (
                <div className="w-full flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Seu Nome"
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={createRoom}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
                        >
                            Criar Sala Online
                        </button>
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">JOGO LOCAL</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>

                    <div className="bg-gray-700/50 p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <label className="text-gray-300">Jogadores:</label>
                            <input
                                type="number"
                                min="2"
                                max="20"
                                value={localPlayerCount}
                                onChange={(e) => setLocalPlayerCount(parseInt(e.target.value))}
                                className="w-16 p-2 bg-gray-600 rounded text-center text-white"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="text-gray-300">Tema:</label>
                            <select
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                                className="p-2 bg-gray-600 rounded text-white text-sm"
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
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition mt-2"
                        >
                            Jogar Local (Pass & Play)
                        </button>
                    </div>


                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">JOGO ONLINE</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Código da Sala"
                            className="flex-1 p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        />
                        <button
                            onClick={joinRoom}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
                        >
                            Entrar
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    <div className="bg-gray-900 p-4 rounded-lg mb-6 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Código da Sala:</p>
                        <p className="text-2xl font-mono text-yellow-400 tracking-wider select-all">{roomId}</p>
                    </div>

                    <h3 className="text-xl text-white mb-4 border-b border-gray-700 pb-2">Jogadores ({players.length})</h3>
                    <ul className="space-y-2 mb-8 max-h-60 overflow-y-auto">
                        {players.map((p, i) => (
                            <li key={i} className="flex items-center gap-2 text-lg text-gray-200 bg-gray-700/50 p-2 rounded">
                                <span className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                                {p.name} {i === 0 && '👑'}
                            </li>
                        ))}
                    </ul>

                    {isHost ? (
                        <button
                            onClick={startGame}
                            className="w-full bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-4 rounded-lg shadow-lg transform hover:-translate-y-1 transition text-xl"
                        >
                            INICIAR JOGO ONLINE
                        </button>
                    ) : (
                        <div className="text-center text-gray-400 italic animate-pulse">
                            Aguardando o anfitrião iniciar...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Lobby;
