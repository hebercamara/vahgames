// src/games/NitroManiaGame.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Importa Link para o botão de voltar

const NitroManiaGame = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      {/* Botão para voltar ao portal principal */}
      <Link to="/" className="mb-8 px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 text-lg">
        ← Voltar para o Portal
      </Link>
      <h2 className="text-4xl font-bold mb-8 text-red-500">Nitro Mania</h2>
      <p className="text-lg mb-4 text-gray-300">
        Prepare-se para a corrida da sua vida!
      </p>
      {/* O iframe vai carregar o seu arquivo HTML do jogo */}
      <iframe
        src="/games/Nitro Mania.html" // Caminho relativo para o arquivo na pasta 'public/games'
        title="Nitro Mania Game"
        // Estilos responsivos para o iframe
        className="w-full h-[600px] md:w-[800px] md:h-[600px] lg:w-[1000px] lg:h-[700px] border-4 border-red-700 rounded-lg shadow-xl"
        allowFullScreen // Permite modo tela cheia
      ></iframe>
      <p className="mt-4 text-sm text-gray-400">
        Se o jogo não carregar, verifique se 'Nitro Mania.html' está na pasta 'public/games' do seu projeto.
      </p>
    </div>
  );
};

export default NitroManiaGame;
