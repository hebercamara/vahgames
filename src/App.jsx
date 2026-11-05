import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TelestrationsGame from './games/Telestrations/index';
import PacmanGame from './games/Pacman/index';

// /tetris aponta para o Tetris (react-tetris), servido como página estática
const RedirectToTetris = () => {
  window.location.replace('/games/react-tetris/index.html');
  return null;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-canvas font-sans text-body antialiased">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/telestrations/*" element={<TelestrationsGame />} />
          <Route path="/tetris" element={<RedirectToTetris />} />
          <Route path="/pacman" element={<PacmanGame />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
