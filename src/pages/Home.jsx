import React, { useState } from 'react';

// Componente para o cabeçalho
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gray-950 text-white p-4 shadow-lg rounded-b-xl">
      <div className="container mx-auto flex justify-between items-center flex-wrap">
        {/* Novo logo no cabeçalho */}
        <div className="text-3xl font-bold text-green-400">
          <img src="/images/site/logo.png" alt="VAHgames Logo" className="h-10" />
        </div>
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
          </svg>
        </button>
        <nav className={`w-full md:w-auto md:flex ${isMenuOpen ? 'block' : 'hidden'} mt-4 md:mt-0`}>
          <ul className="flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0 text-lg">
            <li><a href="#" className="hover:text-green-400 transition duration-300">Início</a></li>
            <li><a href="#jogos" className="hover:text-green-400 transition duration-300">Jogos</a></li> {/* Âncora para Jogos */}
            <li><a href="#ranking" className="hover:text-green-400 transition duration-300">Ranking</a></li> {/* Âncora para Ranking */}
            <li><a href="#comunidade" className="hover:text-green-400 transition duration-300">Comunidade</a></li> {/* Âncora para Comunidade */}
            {/* Botão "Cadastrar" removido */}
          </ul>
        </nav>
      </div>
    </header>
  );
};

// Componente para a seção Hero (agora com a nova imagem e cor de fundo)
const HeroSection = () => {
  return (
    <section className="bg-[#0a0732] text-white py-10 px-4 md:px-0 flex justify-center items-center min-h-[400px]"> {/* Nova cor de fundo e centralização */}
      <div className="container mx-auto flex justify-center items-center">
        <img
          src="/images/site/header.png"
          alt="VAH Games"
          className="max-w-full h-auto object-contain px-4" // Garante que a imagem seja responsiva e se ajuste
        />
      </div>
    </section>
  );
};

// Componente para um card de jogo
const GameCard = ({ title, image, rating, gameLink }) => { // Adicionado gameLink
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center text-center transform hover:scale-105 transition duration-300">
      <img src={image} alt={title} className="w-32 h-32 object-cover rounded-lg mb-4 border-2 border-green-400" />
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <div className="text-yellow-400 mb-4">{rating}</div>
      <a href={gameLink} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300"> {/* Link para o jogo */}
        Jogar
      </a>
    </div>
  );
};

// Componente para a seção de jogos em destaque
const FeaturedGames = () => {
  const games = [
    { title: 'Nitro Mania', image: '/images/site/capa-nitro-mania.jpg', rating: '★★★★★', gameLink: '/games/Nitro Mania.html' }, // Link para o jogo Nitro Mania
    { title: 'A Fuga do Sonic', image: '/images/site/capa-fuga-do-sonic.jpg', rating: '★★★★★', gameLink: '/games/A Fuga do Sonic.html' },
    { title: 'Arthur: Última Saída', image: '/images/site/capa-arthur.jpg', rating: '★★★★★', gameLink: '/games/Arthur Ultima Saida.html' },
    { title: 'Lousa Mágica', image: '/images/site/capa-lousa-magica.svg', rating: '★★★★☆', gameLink: '/telestrations' },
    // Empilha Blocos: versão compilada do react-tetris (chvin, Apache-2.0) em public/games/react-tetris
    { title: 'Empilha Blocos', image: '/images/site/capa-empilha-blocos.svg', rating: '★★★★★', gameLink: '/games/react-tetris/index.html' },
    { title: 'Labirinto', image: '/images/site/capa-labirinto.svg', rating: '★★★★★', gameLink: '/pacman' },
  ];

  return (
    <section id="jogos" className="bg-gray-900 py-16 px-4 md:px-0">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-white mb-10 text-center">Galeria de Jogos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <GameCard key={index} {...game} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Componente para o ranking da semana
const WeeklyRanking = () => {
  const rankingData = [
    { player: 'Arthur Santos', score: 12890 },
    { player: 'Vitor Santos', score: 12500 },
    { player: 'Heber Câmara', score: 12300 },
    { player: 'Elite99', score: 12600 },
    { player: 'ProMaster', score: 11750 },
  ]
    .sort((a, b) => b.score - a.score)
    .map((item) => ({ ...item, score: item.score.toLocaleString('pt-BR') }));

  return (
    <div id="ranking" className="bg-gray-800 rounded-xl shadow-lg p-6 text-white">
      <h3 className="text-2xl font-bold text-green-400 mb-6">Ranking da Semana</h3>
      <ul>
        {rankingData.map((item, index) => (
          <li key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
            <span className="text-lg">{index + 1}. {item.player}</span>
            <span className="text-green-300 font-semibold">{item.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Componente para a seção de comunidade
const CommunitySection = () => {
  return (
    <section id="comunidade" className="bg-gray-900 py-16 px-4 md:px-0">
      <div className="container mx-auto flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3 bg-gray-800 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-4xl font-bold text-green-400 mb-6">Comunidade</h2>
          <p className="text-lg mb-6 text-gray-300">
            Participe da nossa comunidade vibrante! Conecte-se com outros jogadores, compartilhe dicas, participe de discussões e faça novos amigos.
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300">
            Acesse o Fórum
          </button>
        </div>
        <div className="md:w-1/3">
          <WeeklyRanking />
        </div>
      </div>
    </section>
  );
};

// Componente para o rodapé
const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-400 py-8 px-4 md:px-0 rounded-t-xl">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
        <div className="flex space-x-6 mb-4 md:mb-0">
          <a href="#" className="hover:text-white transition duration-300">Sobre nós</a>
          <a href="#" className="hover:text-white transition duration-300">Termos</a>
          <a href="#" className="hover:text-white transition duration-300">Suporte</a>
          <a href="#" className="hover:text-white transition duration-300">Contato</a>
        </div>
        <div className="flex space-x-6">
          {/* Ícones de redes sociais SVG */}
          <a href="#" className="hover:text-white transition duration-300">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.62H8.04V12h2.398V9.36c0-2.363 1.443-3.65 3.54-3.65 1.025 0 1.91.076 2.164.11v2.51h-1.48c-1.166 0-1.393.555-1.393 1.36v1.77h2.774l-.45 2.87H13.25V22c5.313-.842 9.25-5.646 9.25-11C22 6.477 17.523 2 12 2z" />
            </svg>
          </a>
          <a href="#" className="hover:text-white transition duration-300">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.46 6.03c-.69.31-1.43.52-2.2.61.8-.48 1.4-1.24 1.7-2.14-.75.45-1.58.78-2.46.96-.7-1.02-1.7-1.66-2.96-1.66-2.24 0-4.06 1.82-4.06 4.06 0 .32.04.63.1.93-3.37-.17-6.36-1.78-8.36-4.23-.35.6-.55 1.29-.55 2.04 0 1.4.7 2.64 1.77 3.37-.65-.02-1.26-.2-1.8-.5v.05c0 1.97 1.4 3.61 3.26 3.98-.34.09-.7.14-1.07.14-.26 0-.52-.03-.77-.07.52 1.62 2.03 2.8 3.82 2.83-1.39 1.09-3.14 1.75-5.06 1.75-.33 0-.66-.02-.98-.06C4.4 19.34 6.56 20 8.8 20c10.56 0 16.34-8.74 16.34-16.34 0-.25-.01-.5-.02-.75.7-.5 1.3-1.12 1.78-1.83z" />
            </svg>
          </a>
          <a href="#" className="hover:text-white transition duration-300">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.251-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0 2.163c-3.204 0-3.584.012-4.85.07-2.77.126-3.858 1.17-3.984 3.984-.058 1.265-.07 1.645-.07 4.85s.012 3.584.07 4.85c.126 2.77 1.17 3.858 3.984 3.984 1.265.058 1.645.07 4.85.07s3.584-.012 4.85-.07c2.77-.126 3.858-1.17 3.984-3.984.058-1.265.07-1.645.07-4.85s-.012-3.584-.07-4.85c-.126-2.77-1.17-3.858-3.984-3.984-1.265-.058-1.645-.07-4.85-.07zm0 1.882c-3.154 0-5.706 2.552-5.706 5.706s2.552 5.706 5.706 5.706 5.706-2.552 5.706-5.706-2.552-5.706-5.706-5.706zm0 2.163c2.067 0 3.706 1.639 3.706 3.706s-1.639 3.706-3.706 3.706-3.706-1.639-3.706-3.706 1.639-3.706 3.706-3.706zm6.538-6.19c-.813 0-1.472.659-1.472 1.472s.659 1.472 1.472 1.472 1.472-.659 1.472-1.472-.659-1.472-1.472-1.472z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturedGames />
        <CommunitySection />
      </main>
      <Footer />
    </>
  );
}
