import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TelestrationsGame from './games/Telestrations/index';
import PacmanGame from './games/Pacman/index';

// O antigo /tetris agora aponta para o Empilha Blocos (react-tetris), servido como página estática
const RedirectToEmpilhaBlocos = () => {
  window.location.replace('/games/react-tetris/index.html');
  return null;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 font-sans antialiased text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/telestrations/*" element={<TelestrationsGame />} />
          <Route path="/tetris" element={<RedirectToEmpilhaBlocos />} />
          <Route path="/pacman" element={<PacmanGame />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
