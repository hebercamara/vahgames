import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TelestrationsGame from './games/Telestrations/index';
import XadrezGame from './games/Xadrez/index';
import DamasGame from './games/Damas/index';
import QuebraTijolosGame from './games/QuebraTijolos/index';

// Jogos servidos como páginas estáticas em public/games
const redirectTo = (url) => {
  const Redirect = () => {
    window.location.replace(url);
    return null;
  };
  return Redirect;
};
// /tetris aponta para o Tetris (react-tetris, Apache-2.0)
const RedirectToTetris = redirectTo('/games/react-tetris/index.html');
// /pacman aponta para o Pac-Man (mumuy/pacman, MIT)
const RedirectToPacman = redirectTo('/games/pacman/index.html');
// /2048 aponta para o 2048 (gabrielecirulli/2048, MIT)
const RedirectTo2048 = redirectTo('/games/2048/index.html');

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-canvas font-sans text-body antialiased">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/telestrations/*" element={<TelestrationsGame />} />
          <Route path="/tetris" element={<RedirectToTetris />} />
          <Route path="/pacman" element={<RedirectToPacman />} />
          <Route path="/xadrez" element={<XadrezGame />} />
          <Route path="/damas" element={<DamasGame />} />
          <Route path="/quebra-tijolos" element={<QuebraTijolosGame />} />
          <Route path="/2048" element={<RedirectTo2048 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
