import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GamePage, { Segmented } from '../../components/GamePage';
import sudoku from './engine';

// Sudoku — interface própria do VAH Games sobre o motor sudoku.js (MIT, veja engine.js).
// O jogador vence quando o tabuleiro está completo e sem repetições (não precisa bater com
// uma solução específica), então quebra-cabeças com mais de uma solução também valem.

const LEVELS = {
  easy: { label: 'Fácil', base: 1000 },
  medium: { label: 'Médio', base: 2000 },
  hard: { label: 'Difícil', base: 3000 },
  'very-hard': { label: 'Muito difícil', base: 4000 },
};
const MAX_HINTS = 3;
const SAVE_KEY = 'vah-sudoku-partida';

const rowOf = (i) => Math.floor(i / 9);
const colOf = (i) => i % 9;
const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
const isPeer = (a, b) => a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));

function createGame(level) {
  const puzzle = sudoku.generate(level);
  const solution = sudoku.solve(puzzle);
  return {
    level,
    puzzle,
    solution,
    values: puzzle.split('').map((c) => (c === '.' ? 0 : Number(c))),
    notes: Array.from({ length: 81 }, () => []),
    seconds: 0,
    hints: 0,
    done: false,
  };
}

function loadSaved() {
  try {
    const g = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (g && LEVELS[g.level] && g.values?.length === 81 && !g.done) return g;
  } catch {
    /* sem partida salva */
  }
  return null;
}

function conflictsOf(values) {
  const bad = new Set();
  for (let a = 0; a < 81; a++) {
    if (!values[a]) continue;
    for (let b = a + 1; b < 81; b++) {
      if (values[a] === values[b] && isPeer(a, b)) {
        bad.add(a);
        bad.add(b);
      }
    }
  }
  return bad;
}

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function SudokuGame() {
  const [game, setGame] = useState(() => loadSaved() || createGame('easy'));
  const [selected, setSelected] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [paused, setPaused] = useState(false);

  const given = useMemo(() => game.puzzle.split('').map((c) => c !== '.'), [game.puzzle]);
  const conflicts = useMemo(() => conflictsOf(game.values), [game.values]);
  const counts = useMemo(() => {
    const c = Array(10).fill(0);
    game.values.forEach((v) => { c[v] += 1; });
    return c;
  }, [game.values]);

  // Salva a partida em andamento
  useEffect(() => {
    try {
      if (game.done) localStorage.removeItem(SAVE_KEY);
      else localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    } catch {
      /* sem armazenamento local */
    }
  }, [game]);

  // Envia o resultado ao ranking uma vez, quando o jogo é resolvido
  useEffect(() => {
    if (!game.done) return undefined;
    const id = setTimeout(() => window.VAHRanking?.submit('sudoku', game.score), 600);
    return () => clearTimeout(id);
  }, [game.done, game.score]);

  // Cronômetro (para quando a aba fica escondida ou o jogo está pausado)
  useEffect(() => {
    if (game.done || paused) return undefined;
    const id = setInterval(() => {
      if (document.hidden) return;
      setGame((g) => (g.done ? g : { ...g, seconds: g.seconds + 1 }));
    }, 1000);
    return () => clearInterval(id);
  }, [game.done, paused]);

  const newGame = useCallback((level) => {
    setGame(createGame(level));
    setSelected(null);
    setHistory([]);
    setPaused(false);
  }, []);

  const finishIfSolved = (g) => {
    if (g.values.every((v) => v > 0) && conflictsOf(g.values).size === 0) {
      const score = Math.max(100, LEVELS[g.level].base - g.seconds - g.hints * 150);
      return { ...g, done: true, score };
    }
    return g;
  };

  const write = useCallback((digit) => {
    if (selected === null || given[selected] || game.done || paused) return;
    setHistory((h) => [...h.slice(-99), { values: game.values, notes: game.notes }]);
    setGame((g) => {
      const values = g.values.slice();
      const notes = g.notes.map((n) => n.slice());
      if (notesMode && digit) {
        if (values[selected]) return g;
        const set = new Set(notes[selected]);
        if (set.has(digit)) set.delete(digit);
        else set.add(digit);
        notes[selected] = [...set].sort();
        return { ...g, notes };
      }
      values[selected] = values[selected] === digit ? 0 : digit;
      notes[selected] = [];
      // Ao escrever um número, ele sai das anotações da linha, coluna e quadrado
      if (values[selected]) {
        for (let i = 0; i < 81; i++) if (isPeer(i, selected)) notes[i] = notes[i].filter((n) => n !== digit);
      }
      return finishIfSolved({ ...g, values, notes });
    });
  }, [selected, given, game.done, game.values, game.notes, notesMode, paused]);

  const undo = useCallback(() => {
    if (!history.length || game.done) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setGame((g) => ({ ...g, values: last.values, notes: last.notes }));
  }, [history, game.done]);

  const hint = useCallback(() => {
    if (game.done || paused || game.hints >= MAX_HINTS) return;
    // Dica na casa selecionada (se estiver vazia ou errada) ou numa casa vazia qualquer
    let target = selected;
    if (target === null || given[target] || (game.values[target] && String(game.values[target]) === game.solution[target])) {
      const empty = game.values.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      if (!empty.length) return;
      target = empty[Math.floor(Math.random() * empty.length)];
    }
    setHistory((h) => [...h.slice(-99), { values: game.values, notes: game.notes }]);
    setSelected(target);
    setGame((g) => {
      const values = g.values.slice();
      const notes = g.notes.map((n) => n.slice());
      values[target] = Number(g.solution[target]);
      notes[target] = [];
      return finishIfSolved({ ...g, values, notes, hints: g.hints + 1 });
    });
  }, [game, given, selected, paused]);

  // Teclado
  useEffect(() => {
    const down = (e) => {
      if (document.querySelector('.vahr-overlay')) return;
      if (/^[1-9]$/.test(e.key)) write(Number(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') write(0);
      else if (e.key === 'n' || e.key === 'N') setNotesMode((m) => !m);
      else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) undo();
      else if (e.key.startsWith('Arrow')) {
        setSelected((s) => {
          const cur = s ?? 40;
          const r = rowOf(cur);
          const c = colOf(cur);
          if (e.key === 'ArrowUp') return ((r + 8) % 9) * 9 + c;
          if (e.key === 'ArrowDown') return ((r + 1) % 9) * 9 + c;
          if (e.key === 'ArrowLeft') return r * 9 + ((c + 8) % 9);
          return r * 9 + ((c + 1) % 9);
        });
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [write, undo]);

  const selValue = selected !== null ? game.values[selected] : 0;

  const cellClass = (i) => {
    const v = game.values[i];
    const classes = ['relative flex aspect-square items-center justify-center select-none text-[20px] sm:text-[26px] font-extrabold transition-colors'];
    // bordas mais grossas entre os quadrados 3x3
    if (colOf(i) % 3 === 0 && colOf(i)) classes.push('border-l-2 border-l-white/40');
    else if (colOf(i)) classes.push('border-l border-l-white/10');
    if (rowOf(i) % 3 === 0 && rowOf(i)) classes.push('border-t-2 border-t-white/40');
    else if (rowOf(i)) classes.push('border-t border-t-white/10');

    if (i === selected) classes.push('bg-violet-medium/70');
    else if (selValue && v === selValue) classes.push('bg-violet-deep/35');
    else if (selected !== null && isPeer(i, selected)) classes.push('bg-white/[0.07]');

    if (conflicts.has(i) && !given[i]) classes.push('text-[#FF5B8A]');
    else if (given[i]) classes.push('text-ink');
    else classes.push('text-lime');
    return classes.join(' ');
  };

  return (
    <GamePage
      title="Sudoku"
      actions={
        <>
          <button type="button" className="btn-ghost px-4" onClick={() => window.VAHRanking?.show('sudoku')}>
            🏆<span className="hidden sm:inline">Ranking</span>
          </button>
          <button type="button" className="btn-ghost px-4" onClick={() => setPaused((p) => !p)} disabled={game.done}>
            {paused ? 'Continuar' : 'Pausar'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:justify-center">
        <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4">
          <div className="flex items-center justify-between gap-3 text-body-lg font-bold">
            <span className="text-muted">{LEVELS[game.level].label}</span>
            <span className="font-display text-[20px] tabular-nums text-ink">⏱ {fmtTime(game.seconds)}</span>
            <span className="text-muted">Dicas {game.hints}/{MAX_HINTS}</span>
          </div>

          <div className="relative overflow-hidden rounded-sm border-2 border-white/40 bg-surface-raised">
            <div className="grid grid-cols-9" role="grid" aria-label="Tabuleiro do Sudoku">
              {game.values.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  aria-label={`Linha ${rowOf(i) + 1}, coluna ${colOf(i) + 1}${v ? `: ${v}` : ', vazia'}`}
                  className={cellClass(i)}
                  onClick={() => setSelected(i)}
                >
                  {paused ? '' : v ? v : (
                    game.notes[i].length > 0 && (
                      <span className="grid h-full w-full grid-cols-3 p-[2px] text-[9px] font-bold leading-none text-muted sm:text-[11px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <span key={n} className="flex items-center justify-center">{game.notes[i].includes(n) ? n : ''}</span>
                        ))}
                      </span>
                    )
                  )}
                </button>
              ))}
            </div>
            {(paused || game.done) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-canvas/80 p-6 text-center">
                <p className="font-display text-[26px] font-black uppercase text-ink">
                  {game.done ? 'Resolvido! 🎉' : 'Pausado'}
                </p>
                {game.done && (
                  <p className="text-body-lg text-body">
                    {LEVELS[game.level].label} em {fmtTime(game.seconds)}
                    {game.hints ? ` com ${game.hints} dica${game.hints > 1 ? 's' : ''}` : ' sem dicas'} · <strong className="text-lime">{game.score} pontos</strong>
                  </p>
                )}
                <button type="button" className="btn-lime px-6" onClick={() => (game.done ? newGame(game.level) : setPaused(false))}>
                  {game.done ? 'Novo jogo' : 'Continuar'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-9 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                className={`btn h-14 flex-col gap-0 px-0 text-[22px] font-black ${counts[n] >= 9 ? 'bg-white/[0.04] text-white/30' : 'bg-white/10 text-ink hover:bg-white/20'}`}
                onClick={() => write(n)}
                aria-label={`Escrever ${n}`}
              >
                {n}
                <span className="text-[10px] font-bold text-muted">{Math.max(0, 9 - counts[n])}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button type="button" className="btn-ghost" onClick={undo} disabled={!history.length || game.done}>↶ Desfazer</button>
            <button type="button" className="btn-ghost" onClick={() => write(0)} disabled={selected === null || given[selected]}>⌫ Apagar</button>
            <button
              type="button"
              className={`btn ${notesMode ? 'bg-lime text-lime-ink' : 'bg-white/10 text-ink hover:bg-white/20'}`}
              onClick={() => setNotesMode((m) => !m)}
              aria-pressed={notesMode}
            >
              ✎ Notas
            </button>
            <button type="button" className="btn-ghost" onClick={hint} disabled={game.done || game.hints >= MAX_HINTS}>💡 Dica</button>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="panel">
            <Segmented
              label="Novo jogo"
              value={game.level}
              options={Object.entries(LEVELS).map(([value, l]) => ({ value, label: l.label }))}
              onChange={(lvl) => {
                const started = !game.done && game.values.some((v, i) => v && !given[i]);
                if (started && !window.confirm('Começar um jogo novo? O progresso deste será perdido.')) return;
                newGame(lvl);
              }}
            />
          </div>
          <div className="panel">
            <h2 className="subheading mb-3">Como jogar</h2>
            <ul className="list-disc space-y-1 pl-5 text-body-md text-body">
              <li>Preencha a grade para que cada linha, coluna e quadrado 3×3 tenha os números de 1 a 9, sem repetir.</li>
              <li>Toque numa casa e depois no número (ou use o teclado: setas e 1–9).</li>
              <li><strong>Notas</strong> (tecla N) servem para anotar candidatos pequenininhos.</li>
              <li>Números repetidos ficam em vermelho. Você tem {MAX_HINTS} dicas por jogo.</li>
              <li>Pontos: quanto mais difícil e mais rápido, melhor. Cada dica tira 150.</li>
            </ul>
          </div>
          <p className="px-1 text-caption text-muted">
            Gerador de quebra-cabeças: <a className="underline" href="https://github.com/robatron/sudoku.js" target="_blank" rel="noopener noreferrer">sudoku.js</a>, de Rob McGuire-Dale (MIT).
          </p>
        </aside>
      </div>
    </GamePage>
  );
}
