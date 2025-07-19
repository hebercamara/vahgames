// src/games/JogoDaVelha.jsx
import React from 'react';

const JogoDaVelha = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
      <h2 className="text-4xl font-bold mb-8 text-purple-400">Jogo da Velha</h2>
      <p className="text-lg mb-4">
        Aqui viria o código do seu Jogo da Velha!
        Você pode incorporar um canvas, lógica JavaScript, etc.
      </p>
      {/* Exemplo de onde seu jogo real seria renderizado */}
      <div className="w-64 h-64 bg-gray-700 border-4 border-purple-500 flex items-center justify-center text-gray-400 text-xl">
        [Seu Jogo da Velha aqui]
      </div>
      {/* Você pode adicionar um botão para voltar à página principal se desejar */}
    </div>
  );
};

export default JogoDaVelha;