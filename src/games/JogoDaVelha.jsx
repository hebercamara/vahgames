// src/games/JogoDaVelha.jsx
import React, { useState } from 'react';

const JogoDaVelha = () => {
  // Estado para o tabuleiro do jogo (array de 9 elementos, null para vazio, 'X' ou 'O')
  const [board, setBoard] = useState(Array(9).fill(null));
  // Estado para o próximo jogador ('X' ou 'O')
  const [xIsNext, setXIsNext] = useState(true);

  // Função para lidar com o clique em uma casa
  const handleClick = (i) => {
    // Se a casa já estiver preenchida ou o jogo já tiver um vencedor, não faz nada
    if (calculateWinner(board) || board[i]) {
      return;
    }
    // Cria uma cópia do tabuleiro para não modificar o estado diretamente
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? 'X' : 'O'; // Preenche a casa com 'X' ou 'O'
    setBoard(newBoard); // Atualiza o tabuleiro
    setXIsNext(!xIsNext); // Alterna o jogador
  };

  // Função para calcular o vencedor
  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]; // Retorna 'X' ou 'O' se houver um vencedor
      }
    }
    return null; // Não há vencedor
  };

  const winner = calculateWinner(board);
  const status = winner ? `Vencedor: ${winner}` : `Próximo jogador: ${xIsNext ? 'X' : 'O'}`;

  // Componente funcional para renderizar um quadrado individual do tabuleiro
  const Square = ({ value, onClick }) => (
    <button
      className="w-24 h-24 bg-gray-700 text-white text-5xl font-bold flex items-center justify-center border-2 border-purple-500 rounded-lg hover:bg-gray-600 transition-colors duration-200"
      onClick={onClick}
    >
      {value}
    </button>
  );

  // Função para renderizar o tabuleiro
  const renderSquare = (i) => (
    <Square value={board[i]} onClick={() => handleClick(i)} />
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
      <h2 className="text-4xl font-bold mb-8 text-purple-400">Jogo da Velha</h2>
      <div className="text-2xl mb-4">{status}</div>
      <div className="grid grid-cols-3 gap-2 w-72"> {/* Adicionado w-72 para forçar a largura e garantir 3 colunas */}
        {/* Renderiza as 9 casas do tabuleiro */}
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
      <button
        className="mt-8 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
        onClick={() => {
          setBoard(Array(9).fill(null)); // Reinicia o tabuleiro
          setXIsNext(true); // Reinicia o jogador
        }}
      >
        Reiniciar Jogo
      </button>
    </div>
  );
};

export default JogoDaVelha;
