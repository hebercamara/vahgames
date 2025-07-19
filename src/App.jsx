import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Importa React Router

// Importe seus componentes de jogo aqui. Certifique-se de que JogoDaVelha.jsx existe em src/games/
import JogoDaVelha from './games/JogoDaVelha.jsx'; // Alterado para incluir a extensão .jsx
// import JogoDeCorrida from './games/JogoDeCorrida'; // Exemplo para outro jogo

// Componente principal da aplicação
const App = () => {
    // Estado para armazenar o tema atualmente selecionado
    const [currentTheme, setCurrentTheme] = useState(null);
    // Estado para controlar se a música está tocando. Inicia como false.
    const [isPlaying, setIsPlaying] = useState(false);
    // Referência para o objeto de áudio Tone.js, para poder parar e iniciar
    const audioRef = useRef(null);

    // Dados dos temas e seus jogos associados
    const themes = [
        {
            id: 'space-adventure',
            name: 'Aventura Espacial',
            image: 'https://placehold.co/600x400/6366f1/ffffff?text=Aventura+Espacial',
            createMusic: () => {
                const synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "sawtooth" },
                    envelope: { attack: 2, decay: 1, sustain: 0.5, release: 4 },
                    volume: -12
                }).toDestination();
                const loop = new Tone.Loop(time => {
                    synth.triggerAttackRelease(["C3", "E3", "G3", "B3"], "8n", time);
                }, "4n").start(0);
                return { synth, loop };
            },
            games: [
                // Adicione a propriedade 'path' para o React Router
                { id: 1, name: 'Navegador Estelar', image: 'https://placehold.co/300x180/6366f1/ffffff?text=Navegador+Estelar', description: 'Explore galáxias distantes!', path: '/games/navegador-estelar' },
                { id: 2, name: 'Invasores Cósmicos', image: 'https://placehold.co/300x180/6366f1/ffffff?text=Invasores+Cósmicos', description: 'Defenda a Terra de alienígenas!', path: '/games/invasores-cosmicos' },
                { id: 3, name: 'Planeta Perdido', image: 'https://placehold.co/300x180/6366f1/ffffff?text=Planeta+Perdido', description: 'Sobreviva em um mundo hostil!', path: '/games/planeta-perdido' },
            ],
        },
        {
            id: 'magic-forest',
            name: 'Floresta Mágica',
            image: 'https://placehold.co/600x400/ec4899/ffffff?text=Floresta+Mágica',
            createMusic: () => {
                const synth = new Tone.MetalSynth({
                    frequency: 200, envelope: { attack: 0.001, decay: 1.4, sustain: 0.1, release: 0.2 },
                    harmonicity: 3.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, volume: -15
                }).toDestination();
                const reverb = new Tone.Reverb(4).toDestination();
                synth.connect(reverb);
                const sequence = new Tone.Sequence((time, note) => {
                    synth.triggerAttackRelease(note, "8n", time);
                }, ["C5", "E5", "G5", "A5", "G5", "E5", "C5", null], "4n").start(0);
                return { synth, sequence };
            },
            games: [
                { id: 4, name: 'Contos da Floresta', image: 'https://placehold.co/300x180/ec4899/ffffff?text=Contos+da+Floresta', description: 'Descubra segredos antigos!', path: '/games/contos-da-floresta' },
                { id: 5, name: 'Guardiões da Árvore', image: 'https://placehold.co/300x180/ec4899/ffffff?text=Guardiões+da+Árvore', description: 'Proteja a floresta encantada!', path: '/games/guardioes-da-arvore' },
                { id: 6, name: 'Corrida dos Gnomos', image: 'https://placehold.co/300x180/ec4899/ffffff?text=Corrida+dos+Gnomos', description: 'Uma corrida divertida na floresta!', path: '/games/corrida-dos-gnomos' },
            ],
        },
        {
            id: 'cyberpunk-city',
            name: 'Cidade Cyberpunk',
            image: 'https://placehold.co/600x400/0f172a/ffffff?text=Cidade+Cyberpunk',
            createMusic: () => {
                const synth = new Tone.Synth({
                    oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.5 },
                    volume: -10
                }).toDestination();
                const delay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
                synth.connect(delay);
                const pattern = new Tone.Pattern((time, note) => {
                    synth.triggerAttackRelease(note, "16n", time);
                }, ["C2", "G2", "A#2", "F2"]).start(0);
                return { synth, pattern };
                },
                games: [
                    { id: 7, name: 'Ruas de Neon', image: 'https://placehold.co/300x180/0f172a/ffffff?text=Ruas+de+Neon', description: 'Explore a cidade futurista!', path: '/games/ruas-de-neon' },
                    { id: 8, name: 'Hackers da Rede', image: 'https://placehold.co/300x180/0f172a/ffffff?text=Hackers+da+Rede', description: 'Infiltre-se em sistemas digitais!', path: '/games/hackers-da-rede' },
                    { id: 9, name: 'Duelos de Robôs', image: 'https://placehold.co/300x180/0f172a/ffffff?text=Duelos+de+Robôs', description: 'Lute em arenas high-tech!', path: '/games/duelos-de-robos' },
                ],
            },
        ];

        // Função para parar e descartar qualquer áudio Tone.js ativo
        const stopAndDisposeAudio = () => {
            if (audioRef.current) {
                Tone.Transport.stop();
                audioRef.current.synth.dispose();
                if (audioRef.current.loop) audioRef.current.loop.dispose();
                if (audioRef.current.sequence) audioRef.current.sequence.dispose();
                if (audioRef.current.pattern) audioRef.current.pattern.dispose();
                audioRef.current = null;
            }
        };

        // Efeito para gerenciar a reprodução de música quando o tema muda ou o estado de reprodução
        useEffect(() => {
            if (!currentTheme || !isPlaying) {
                stopAndDisposeAudio();
                return;
            }
            stopAndDisposeAudio();
            const newAudio = currentTheme.createMusic();
            audioRef.current = newAudio;
            Tone.Transport.start();
        }, [currentTheme, isPlaying]);

        // Função para lidar com a seleção de um tema
        const handleThemeSelect = async (theme) => {
            if (Tone.context.state !== 'running') {
                await Tone.start();
                console.log("Audio context started by theme selection");
            }
            setCurrentTheme(theme);
            setIsPlaying(true);
        };

        // Função para voltar para a seleção de temas
        const handleBackToThemes = () => {
            setCurrentTheme(null);
            setIsPlaying(false);
        };

        // Função para alternar a reprodução da música
        const toggleMusic = async () => {
            if (!isPlaying) {
                if (Tone.context.state !== 'running') {
                    try {
                        await Tone.start();
                        console.log("Audio context resumed by toggle button");
                    } catch (e) {
                        console.error("Failed to resume audio context:", e);
                        return;
                    }
                }
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
            }
        };

        // Componente para a página inicial (seleção de temas ou jogos do tema)
        const HomePage = () => (
            <main className="flex-grow w-full max-w-7xl p-6">
                {currentTheme ? (
                    <div className="flex flex-col items-center">
                        <button
                            onClick={handleBackToThemes}
                            className="mb-8 px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 text-lg"
                        >
                            ← Voltar para Temas
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full justify-items-center">
                            {currentTheme.games.map(game => (
                                <Link // Usamos Link do React Router aqui
                                    key={game.id}
                                    to={game.path} // Linka para a rota do jogo
                                    className="game-card bg-cardBg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:translate-y-[-10px] hover:scale-102 border-4 border-transparent hover:border-primary flex flex-col items-center text-center"
                                >
                                    <img
                                        src={game.image}
                                        alt={game.name}
                                        className="w-full h-48 object-cover rounded-xl mb-4 border-2 border-secondary"
                                    />
                                    <h3 className="font-bold text-2xl text-primary mb-2">{game.name}</h3>
                                    <p className="text-lg text-indigo-200 flex-grow mb-4">{game.description}</p>
                                    <span className="play-button bg-gradient-to-r from-secondary to-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                        Jogar Agora!
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full justify-items-center">
                            {themes.map(theme => (
                                <div
                                    key={theme.id}
                                    onClick={() => handleThemeSelect(theme)}
                                    className="theme-card relative w-full max-w-sm rounded-2xl overflow-hidden shadow-xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-4 border-transparent hover:border-primary group"
                                >
                                    <img
                                        src={theme.image}
                                        alt={theme.name}
                                        className="w-full h-64 object-cover group-hover:opacity-80 transition-opacity duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex items-end p-6">
                                        <h3 className="font-display text-3xl text-secondary drop-shadow-lg">
                                            {theme.name}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        );

        return (
            <Router> {/* O Router envolve toda a aplicação para habilitar o roteamento */}
                <div className="min-h-screen flex flex-col items-center bg-darkBg text-textColor font-sans antialiased overflow-x-hidden">
                    <header className="w-full py-2 shadow-lg sticky top-0 z-10 bg-gradient-to-r from-primary to-secondary">
                        {/* Você pode colocar sua logo VAHgames aqui */}
                    </header>

                    <div className="w-full flex justify-center py-4">
                        <button
                            onClick={toggleMusic}
                            className="bg-secondary hover:bg-primary text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-secondary focus:ring-opacity-50 text-lg"
                        >
                            {isPlaying ? '🔇 Desligar Música' : '🔊 Ligar Música'}
                        </button>
                    </div>

                    {/* Define as rotas da sua aplicação */}
                    <Routes>
                        <Route path="/" element={<HomePage />} /> {/* Rota para a página inicial */}
                        <Route path="/games/navegador-estelar" element={<JogoDaVelha />} /> {/* Exemplo de rota para um jogo */}
                        {/* Adicione mais rotas para seus outros jogos aqui */}
                        {/* <Route path="/games/invasores-cosmicos" element={<ComponenteDoJogo2 />} /> */}
                    </Routes>
                </div>
            </Router>
        );
    };

    export default App;
    