import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GamePage, { Segmented } from '../../components/GamePage';
import RESPOSTAS from './respostas';

// Termo — jogo próprio do VAH Games (gênero "adivinhe a palavra em 6 tentativas").
// Respostas: lista própria de palavras comuns (respostas.js).
// Chutes válidos: palavras de 5 letras do dicionário VERO (LibreOffice pt-BR, LGPLv3/MPL),
// em public/data/termo/palavras.txt. Acentos não precisam ser digitados.

const LETTERS = 5;
const TRIES = 6;
const START_DAY = Date.UTC(2026, 10, 1); // dia nº 1 do Termo do VAH Games (01/11/2026)
const STATS_KEY = 'vah-termo-estatisticas';
const DAILY_KEY = 'vah-termo-diario';
const KEYBOARD = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'apagar'],
];
// "ç" conta como "c" (como no Termo original): a tecla escreve "c"
const normalize = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Embaralhamento fixo (mesma ordem em todos os aparelhos)
function seededShuffle(list, seed) {
  const a = list.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const ORDER = seededShuffle(RESPOSTAS, 20261101);

// Dia de hoje no horário de Brasília
function todayNumber() {
  const now = new Date(Date.now() - 3 * 3600 * 1000);
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(1, Math.floor((utcMidnight - START_DAY) / 86400000) + 1);
}

function evaluate(guess, answer) {
  // guess e answer normalizados (sem acento)
  const res = Array(LETTERS).fill('absent');
  const left = {};
  for (let i = 0; i < LETTERS; i++) {
    if (guess[i] === answer[i]) res[i] = 'correct';
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < LETTERS; i++) {
    if (res[i] !== 'correct' && left[guess[i]]) {
      res[i] = 'present';
      left[guess[i]] -= 1;
    }
  }
  return res;
}

const readJson = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sem armazenamento local */
  }
};

const EMPTY_STATS = { played: 0, wins: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0] };

function newRound(mode) {
  const day = todayNumber();
  if (mode === 'diario') {
    const saved = readJson(DAILY_KEY, null);
    if (saved && saved.day === day) return saved;
    return { mode, day, answer: ORDER[(day - 1) % ORDER.length], guesses: [], status: 'playing' };
  }
  const answer = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];
  return { mode, day, answer, guesses: [], status: 'playing' };
}

const COLORS = {
  correct: 'bg-[#2E9E5B] border-[#2E9E5B] text-white',
  present: 'bg-[#D9A400] border-[#D9A400] text-white',
  absent: 'bg-navy border-navy text-white/80',
};
const EMOJI = { correct: '🟩', present: '🟨', absent: '⬛' };

export default function TermoGame() {
  const [words, setWords] = useState(null); // Map normalizado -> forma com acento
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState('diario');
  const [round, setRound] = useState(() => newRound('diario'));
  const [current, setCurrent] = useState('');
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [stats, setStats] = useState(() => ({ ...EMPTY_STATS, ...readJson(STATS_KEY, {}) }));
  const msgTimer = useRef(null);

  // Lista de palavras válidas
  useEffect(() => {
    let alive = true;
    fetch('/data/termo/palavras.txt')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((txt) => {
        if (!alive) return;
        const map = new Map();
        txt.split('\n').forEach((w) => {
          const t = w.trim();
          if (t) {
            const n = normalize(t);
            // prefere a forma sem acento quando as duas existem (ex.: "sabia" e "sabiá")
            if (!map.has(n) || t === n) map.set(n, t);
          }
        });
        RESPOSTAS.forEach((w) => map.set(normalize(w), w));
        setWords(map);
      })
      .catch(() => alive && setLoadError(true));
    return () => {
      alive = false;
    };
  }, []);

  // Salva a palavra do dia em andamento
  useEffect(() => {
    if (round.mode === 'diario') writeJson(DAILY_KEY, round);
  }, [round]);

  const flash = useCallback((text, ms = 1800) => {
    setMessage(text);
    clearTimeout(msgTimer.current);
    if (ms) msgTimer.current = setTimeout(() => setMessage(''), ms);
  }, []);

  const changeMode = (m) => {
    setMode(m);
    setRound(newRound(m));
    setCurrent('');
    setMessage('');
  };

  const answerNorm = normalize(round.answer);

  const finish = useCallback((won, tries) => {
    const dist = stats.dist.slice();
    if (won) dist[tries - 1] += 1;
    const streak = won ? stats.streak + 1 : 0;
    const next = { played: stats.played + 1, wins: stats.wins + (won ? 1 : 0), streak, best: Math.max(stats.best, streak), dist };
    writeJson(STATS_KEY, next);
    setStats(next);
    if (won) setTimeout(() => window.VAHRanking?.submit('termo', streak), 1600);
  }, [stats]);

  const submit = useCallback(() => {
    if (round.status !== 'playing' || !words) return;
    if (current.length < LETTERS) {
      setShake(true);
      flash('A palavra precisa ter 5 letras');
      return;
    }
    if (!words.has(current)) {
      setShake(true);
      flash('Essa palavra não está na nossa lista');
      return;
    }
    const guesses = [...round.guesses, words.get(current)];
    const won = current === answerNorm;
    const lost = !won && guesses.length >= TRIES;
    setRound({ ...round, guesses, status: won ? 'won' : lost ? 'lost' : 'playing' });
    setCurrent('');
    if (won) {
      flash(['Genial!', 'Magnífico!', 'Impressionante!', 'Muito bem!', 'Boa!', 'Ufa!'][guesses.length - 1], 0);
      finish(true, guesses.length);
    } else if (lost) {
      flash(`A palavra era ${round.answer.toUpperCase()}`, 0);
      finish(false, guesses.length);
    }
  }, [round, current, words, answerNorm, flash, finish]);

  const press = useCallback((key) => {
    if (round.status !== 'playing') return;
    if (key === 'enter') submit();
    else if (key === 'apagar') setCurrent((c) => c.slice(0, -1));
    else {
      const k = normalize(key);
      if (/^[a-z]$/.test(k)) setCurrent((c) => (c.length < LETTERS ? c + k : c));
    }
  }, [round.status, submit]);

  useEffect(() => {
    const down = (e) => {
      if (document.querySelector('.vahr-overlay') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') press('enter');
      else if (e.key === 'Backspace') press('apagar');
      else if (/^[a-zA-ZçÇáàâãéêíóôõúÁÀÂÃÉÊÍÓÔÕÚ]$/.test(e.key)) press(e.key.toLowerCase());
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [press]);

  useEffect(() => {
    if (!shake) return undefined;
    const id = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(id);
  }, [shake]);

  // Estado de cada letra no teclado
  const keyState = useMemo(() => {
    const st = {};
    const rank = { absent: 1, present: 2, correct: 3 };
    round.guesses.forEach((g) => {
      const n = normalize(g);
      evaluate(n, answerNorm).forEach((r, i) => {
        if (!st[n[i]] || rank[r] > rank[st[n[i]]]) st[n[i]] = r;
      });
    });
    return st;
  }, [round.guesses, answerNorm]);

  const share = async () => {
    const rows = round.guesses.map((g) => evaluate(normalize(g), answerNorm).map((r) => EMOJI[r]).join('')).join('\n');
    const title = round.mode === 'diario' ? `Termo VAH #${round.day}` : 'Termo VAH (treino)';
    const text = `${title} ${round.status === 'won' ? round.guesses.length : 'X'}/${TRIES}\n\n${rows}\n\n${window.location.origin}/termo`;
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        flash('Resultado copiado! É só colar no grupo 😉');
      }
    } catch {
      /* compartilhamento cancelado */
    }
  };

  const rows = Array.from({ length: TRIES }, (_, r) => {
    if (r < round.guesses.length) {
      const g = round.guesses[r];
      const res = evaluate(normalize(g), answerNorm);
      return { letters: g.split(''), res, done: true };
    }
    if (r === round.guesses.length && round.status === 'playing') {
      return { letters: current.split('').concat(Array(LETTERS - current.length).fill('')), res: null, current: true };
    }
    return { letters: Array(LETTERS).fill(''), res: null };
  });

  const maxDist = Math.max(1, ...stats.dist);
  const ended = round.status !== 'playing';

  return (
    <GamePage
      title="Termo"
      actions={
        <button type="button" className="btn-ghost px-4" onClick={() => window.VAHRanking?.show('termo')}>
          🏆<span className="hidden sm:inline">Ranking</span>
        </button>
      }
    >
      <style>{`
        @keyframes termo-shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-7px)} 40%,60%{transform:translateX(7px)} }
        @keyframes termo-flip { 0%{transform:rotateX(0)} 50%{transform:rotateX(90deg)} 100%{transform:rotateX(0)} }
        @keyframes termo-pop { 50%{transform:scale(1.08)} }
      `}</style>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] lg:justify-center">
        <div className="mx-auto flex w-full max-w-[500px] flex-col items-center gap-4">
          <Segmented
            label=""
            value={mode}
            options={[
              { value: 'diario', label: `Palavra do dia #${todayNumber()}` },
              { value: 'treino', label: 'Treino (sem limite)' },
            ]}
            onChange={changeMode}
          />

          <div className="relative flex w-full max-w-[330px] flex-col gap-1.5" aria-label="Tentativas">
            {rows.map((row, r) => (
              <div
                key={r}
                className="grid grid-cols-5 gap-1.5"
                style={row.current && shake ? { animation: 'termo-shake .45s' } : undefined}
              >
                {row.letters.map((ch, i) => (
                  <div
                    key={i}
                    className={`flex aspect-square items-center justify-center rounded-[10px] border-2 font-display text-[28px] font-black uppercase ${
                      row.res
                        ? COLORS[row.res[i]]
                        : ch
                          ? 'border-white/60 bg-white/[0.07] text-ink'
                          : row.current
                            ? 'border-white/25 bg-transparent text-ink'
                            : 'border-white/10 bg-transparent text-ink'
                    }`}
                    style={
                      row.res
                        ? { animation: `termo-flip .5s ease ${i * 0.12}s both` }
                        : ch
                          ? { animation: 'termo-pop .12s' }
                          : undefined
                    }
                  >
                    {ch}
                  </div>
                ))}
              </div>
            ))}
            {message && (
              <div className="pointer-events-none absolute inset-x-0 top-[38%] flex justify-center">
                <span className="rounded-full bg-light-fill px-4 py-2 text-[15px] font-extrabold text-navy shadow-lift">{message}</span>
              </div>
            )}
          </div>

          {!words && !loadError && <p className="text-body-md text-muted">Carregando palavras…</p>}
          {loadError && <p className="text-body-md text-[#FF5B8A]">Não deu para carregar a lista de palavras. Verifique a internet e recarregue.</p>}

          {ended ? (
            <div className="flex w-full flex-col items-center gap-3 rounded-xs bg-white/[0.07] p-5 text-center">
              <p className="text-body-lg text-body">
                {round.status === 'won' ? 'Você acertou' : 'Não foi dessa vez. A palavra era'}{' '}
                <strong className="font-display uppercase text-lime">{round.answer}</strong>
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" className="btn-lime px-5" onClick={share}>Compartilhar</button>
                {round.mode === 'treino' ? (
                  <button type="button" className="btn-ghost px-5" onClick={() => changeMode('treino')}>Outra palavra</button>
                ) : (
                  <button type="button" className="btn-ghost px-5" onClick={() => changeMode('treino')}>Jogar no treino</button>
                )}
              </div>
              {round.mode === 'diario' && <p className="text-caption text-muted">Uma palavra nova todo dia, à meia-noite (horário de Brasília).</p>}
            </div>
          ) : (
            <div className="flex w-full flex-col gap-1.5" aria-label="Teclado">
              {KEYBOARD.map((line, li) => (
                <div key={li} className="flex justify-center gap-1.5">
                  {line.map((k) => {
                    const st = keyState[normalize(k)];
                    const wide = k === 'enter' || k === 'apagar';
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => press(k)}
                        className={`flex h-14 items-center justify-center rounded-[8px] text-[16px] font-extrabold uppercase transition active:opacity-70 ${
                          wide ? 'flex-[1.6] text-[12px]' : 'flex-1'
                        } ${st ? COLORS[st] : 'bg-white/15 text-ink hover:bg-white/25'}`}
                        aria-label={k === 'apagar' ? 'Apagar letra' : k === 'enter' ? 'Enviar palavra' : `Letra ${k}`}
                      >
                        {k === 'apagar' ? '⌫' : k === 'enter' ? 'Enter' : k}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="panel">
            <h2 className="subheading mb-3">Como jogar</h2>
            <ul className="list-disc space-y-1 pl-5 text-body-md text-body">
              <li>Descubra a palavra de 5 letras em até 6 tentativas.</li>
              <li><span className="rounded bg-[#2E9E5B] px-1.5 font-bold text-white">Verde</span>: a letra está no lugar certo.</li>
              <li><span className="rounded bg-[#D9A400] px-1.5 font-bold text-white">Amarelo</span>: a letra existe, mas em outro lugar.</li>
              <li><span className="rounded bg-navy px-1.5 font-bold text-white">Cinza</span>: a letra não está na palavra.</li>
              <li>Não precisa digitar acentos nem ç: eles aparecem sozinhos.</li>
              <li>A <strong>palavra do dia</strong> é a mesma para todo mundo. No <strong>treino</strong>, jogue quantas vezes quiser.</li>
            </ul>
          </div>
          <div className="panel">
            <h2 className="subheading mb-3">Suas estatísticas</h2>
            <div className="mb-4 grid grid-cols-4 gap-2 text-center">
              {[
                ['Jogos', stats.played],
                ['Vitórias', stats.played ? `${Math.round((stats.wins / stats.played) * 100)}%` : '0%'],
                ['Sequência', stats.streak],
                ['Melhor', stats.best],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-heading-xs font-black text-ink">{value}</p>
                  <p className="text-caption uppercase text-muted">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {stats.dist.map((n, i) => (
                <div key={i} className="flex items-center gap-2 text-body-md">
                  <span className="w-3 font-bold text-muted">{i + 1}</span>
                  <span
                    className="rounded-full bg-violet-medium px-2 text-right text-[12px] font-bold text-white"
                    style={{ width: `${Math.max(8, (n / maxDist) * 100)}%` }}
                  >
                    {n}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-caption text-muted">O ranking geral guarda a sua maior sequência de acertos.</p>
          </div>
          <p className="px-1 text-caption text-muted">
            Palavras aceitas: dicionário <a className="underline" href="/data/termo/LICENCA-VERO.txt" target="_blank" rel="noopener noreferrer">VERO</a> (LibreOffice pt-BR, LGPLv3/MPL).
          </p>
        </aside>
      </div>
    </GamePage>
  );
}
