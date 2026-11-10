import React, { useEffect, useMemo, useRef, useState } from 'react';

// Layout segue DESIGN.md: canvas escuro, sidebar fixa de 68px, carrosséis
// horizontais de cards, CTA lima em pílula e gradientes de seção.

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

const GAMES = [
  {
    id: 'nitro-mania',
    title: 'Nitro Mania',
    image: '/images/site/capa-nitro-mania.jpg',
    rating: 5,
    gameLink: '/games/Nitro Mania.html',
    category: 'corrida',
    tagline: 'Desvie do trânsito e acelere até o limite.',
  },
  {
    id: 'fuga-do-sonic',
    title: 'A Fuga do Sonic',
    image: '/images/site/capa-fuga-do-sonic.jpg',
    rating: 5,
    gameLink: '/games/A Fuga do Sonic.html',
    category: 'acao',
    tagline: 'Corra, pule obstáculos e não pare nunca.',
  },
  {
    id: 'arthur',
    title: 'Arthur: Última Saída',
    image: '/images/site/capa-arthur.jpg',
    rating: 5,
    gameLink: '/games/Arthur Ultima Saida.html',
    category: 'aventura',
    tagline: 'Sobreviva aos zumbis e encontre a saída.',
  },
  {
    id: 'lousa-magica',
    title: 'Lousa Mágica',
    image: '/images/site/capa-lousa-magica.svg',
    rating: 4,
    gameLink: '/telestrations',
    category: 'multijogador',
    tagline: 'Desenhe, adivinhe e ria com os amigos.',
  },
  // Tetris: versão compilada do react-tetris (chvin, Apache-2.0) em public/games/react-tetris
  {
    id: 'tetris',
    title: 'Tetris',
    image: '/images/site/capa-tetris.svg',
    rating: 5,
    gameLink: '/games/react-tetris/index.html',
    category: 'quebra-cabeca',
    tagline: 'Encaixe as peças e limpe as linhas.',
  },
  // Pac-Man: mumuy/pacman (MIT) em public/games/pacman
  {
    id: 'pacman',
    title: 'Pac-Man',
    image: '/images/site/capa-pacman.svg',
    rating: 5,
    gameLink: '/games/pacman/index.html',
    category: 'arcade',
    tagline: 'Coma os pontos e fuja dos fantasmas.',
    isNew: true,
  },
  {
    id: 'xadrez',
    title: 'Xadrez',
    image: '/images/site/capa-xadrez.webp',
    rating: 5,
    gameLink: '/xadrez',
    category: 'tabuleiro',
    tagline: 'Desafie o computador ou um amigo.',
    isNew: true,
  },
  {
    id: 'damas',
    title: 'Damas',
    image: '/images/site/capa-damas.svg',
    rating: 5,
    gameLink: '/damas',
    category: 'tabuleiro',
    tagline: 'Regra brasileira, contra o computador ou a dois.',
    isNew: true,
  },
  {
    id: 'quebra-tijolos',
    title: 'Quebra-Tijolos',
    image: '/images/site/capa-quebra-tijolos.svg',
    rating: 5,
    gameLink: '/quebra-tijolos',
    category: 'arcade',
    tagline: 'Rebata a bola e derrube todos os tijolos.',
    isNew: true,
  },
  // 2048: gabrielecirulli/2048 (MIT) em public/games/2048
  {
    id: '2048',
    title: '2048',
    image: '/images/site/capa-2048.svg',
    rating: 5,
    gameLink: '/games/2048/index.html',
    category: 'quebra-cabeca',
    tagline: 'Junte os números até chegar ao 2048.',
    isNew: true,
  },
  {
    id: 'termo',
    title: 'Termo',
    image: '/images/site/capa-termo.svg',
    rating: 5,
    gameLink: '/termo',
    category: 'quebra-cabeca',
    tagline: 'Descubra a palavra do dia em 6 tentativas.',
    isNew: true,
    latest: true, // leva mais recente: aparece primeiro em Novidades
  },
  // Sudoku: interface própria + motor robatron/sudoku.js (MIT) em src/games/Sudoku
  {
    id: 'sudoku',
    title: 'Sudoku',
    image: '/images/site/capa-sudoku.svg',
    rating: 5,
    gameLink: '/sudoku',
    category: 'quebra-cabeca',
    tagline: 'Complete a grade de 1 a 9 sem repetir.',
    isNew: true,
    latest: true, // leva mais recente: aparece primeiro em Novidades
  },
  {
    id: 'cobrinha',
    title: 'Cobrinha',
    image: '/images/site/capa-cobrinha.svg',
    rating: 5,
    gameLink: '/cobrinha',
    category: 'arcade',
    tagline: 'Coma as frutas, cresça e não bata em nada.',
    isNew: true,
    latest: true, // leva mais recente: aparece primeiro em Novidades
  },
  {
    id: 'duelo-de-mestres',
    title: 'Duelo de Mestres',
    image: '/images/site/capa-duelo-de-mestres.webp',
    rating: 5,
    gameLink: '/duelo-de-mestres',
    category: 'tabuleiro',
    tagline: 'Use as cartas de movimento e derrube o mestre rival.',
    isNew: true,
    latest: true, // leva mais recente: aparece primeiro em Novidades
  },
  // Hextris: Hextris/hextris (GPL-3.0) em public/games/hextris
  {
    id: 'hextris',
    title: 'Hextris',
    image: '/images/site/capa-hextris.svg',
    rating: 5,
    gameLink: '/games/hextris/index.html',
    category: 'quebra-cabeca',
    tagline: 'Gire o hexágono e junte blocos da mesma cor.',
    isNew: true,
    latest: true, // leva mais recente: aparece primeiro em Novidades
  },
  // Torre: iamkun/tower_game (MIT) em public/games/torre
  {
    id: 'torre',
    title: 'Torre',
    image: '/images/site/capa-torre.svg',
    rating: 5,
    gameLink: '/games/torre/index.html',
    category: 'arcade',
    tagline: 'Solte os blocos na hora certa e erga o prédio.',
    isNew: true,
    latest: true, // leva mais recente: aparece primeiro em Novidades
  },
  // Fazenda: hub "Nem que a Vaca Tussa" (repositório hebercamara/Nem-que-a-Vaca-Tussa),
  // build web em public/games/fazenda. Jogos de grupo para um celular só.
  ...[
    {
      id: 'vaca',
      title: 'Nem que a Vaca Tussa!',
      image: '/games/fazenda/img/vaca-tossindo.webp',
      tagline: 'Chute números cada vez maiores e duvide de quem exagerou.',
      players: '2 a 12 jogadores',
      kind: 'Chute e blefe',
      accent: '#FF9F1C',
    },
    {
      id: 'maria',
      title: 'Maria vai com as Outras',
      image: '/games/fazenda/img/maria-logo.webp',
      tagline: 'Pense igual à maioria! Quem acompanha a boiada ganha feno.',
      players: '3 a 12 jogadores',
      kind: 'Pense igual',
      accent: '#6E9455',
    },
    {
      id: 'ovelha',
      title: 'Ovelha Negra',
      image: '/games/fazenda/img/ovelha-logo.webp',
      tagline: 'Fuja do óbvio! Só pontua quem der uma resposta que ninguém mais deu.',
      players: '3 a 12 jogadores',
      kind: 'Pense diferente',
      accent: '#3B3946',
    },
  ].map((g) => ({
    ...g,
    rating: 5,
    gameLink: `/games/fazenda/index.html?jogo=${g.id}`,
    category: 'grupo',
    farm: true,
    isNew: true,
  })),
];

const FARM_GAMES = GAMES.filter((g) => g.farm);
const SOLO_GAMES = GAMES.filter((g) => !g.farm);
// Novidades: a leva mais recente (latest) primeiro, depois os outros jogos marcados como novos
const NEW_GAMES = [...SOLO_GAMES.filter((g) => g.isNew && g.latest), ...SOLO_GAMES.filter((g) => g.isNew && !g.latest)];

// Cada categoria usa um dos gradientes de seção do DESIGN.md
const CATEGORIES = [
  { id: 'corrida', label: 'Corrida', gradient: 'bg-grad-blue' },
  { id: 'acao', label: 'Ação', gradient: 'bg-grad-rose' },
  { id: 'aventura', label: 'Aventura', gradient: 'bg-grad-teal' },
  { id: 'arcade', label: 'Arcade', gradient: 'bg-grad-olive' },
  { id: 'quebra-cabeca', label: 'Quebra-cabeça', gradient: 'bg-grad-green' },
  { id: 'tabuleiro', label: 'Tabuleiro', gradient: 'bg-grad-blue' },
  { id: 'multijogador', label: 'Multijogador', gradient: 'bg-grad-violet' },
  { id: 'grupo', label: 'Em grupo', gradient: 'bg-grad-olive' },
];

const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? '';

// ---------------------------------------------------------------------------
// Ícones (SVG inline, 24x24, traço em currentColor)
// ---------------------------------------------------------------------------

const Icon = ({ path, className = 'h-6 w-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  games: (
    <>
      <rect x="2.5" y="7" width="19" height="11" rx="5.5" />
      <path d="M7.5 10.5v4M5.5 12.5h4M15.5 11.5h.01M18 13.5h.01" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M16 6h3a2 2 0 0 1-2 4h-1M8 6H5a2 2 0 0 0 2 4h1M12 13v4M8.5 20.5h7M10 17h4" />
    </>
  ),
  barn: (
    <>
      <path d="M3 10 12 4l9 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M8 21v-7h8v7M8 14l8 7M16 14l-8 7" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />,
  left: <path d="m15 5-7 7 7 7" />,
  right: <path d="m9 5 7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  shuffle: <path d="M3 7h3.5a5 5 0 0 1 4 2l3 4a5 5 0 0 0 4 2H21M18 12l3 3-3 3M3 17h3.5a5 5 0 0 0 4-2M17.5 9H21M18 6l3 3" />,
};

// ---------------------------------------------------------------------------
// Navegação lateral (68px). No computador fica sempre visível; no celular fica escondida
// à esquerda e abre deslizando ao tocar no logo do VAH Games na barra de cima.
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { href: '#inicio', label: 'Início', icon: icons.home },
  { href: '#jogos', label: 'Jogos', icon: icons.games },
  { href: '#categorias', label: 'Gêneros', icon: icons.grid },
  { href: '#fazenda', label: 'Fazenda', icon: icons.barn },
  { href: '#ranking', label: 'Ranking', icon: icons.trophy },
];

const Sidebar = ({ open, onClose }) => (
  <>
    {open && <div className="fixed inset-0 z-top bg-black/60 md:hidden" onClick={onClose} aria-hidden="true" />}
  <nav
    id="menu-principal"
    aria-label="Navegação principal"
    className={`fixed inset-y-0 left-0 flex w-sidebar flex-col items-center gap-1 bg-canvas py-3 transition-transform duration-200 md:z-sticky md:translate-x-0 ${
      open ? 'z-top translate-x-0 shadow-lift' : 'z-top -translate-x-full'
    }`}
    onClick={(e) => e.target.closest('a') && onClose()}
  >
    <a href="#inicio" className="mb-3 flex h-12 w-12 items-center justify-center rounded-xs bg-white/[0.07] transition hover:scale-110" aria-label="VAH Games — início">
      <span className="font-display text-[13px] font-black leading-none text-lime">VAH</span>
    </a>
    {NAV_ITEMS.map((item) => (
      <a
        key={item.href}
        href={item.href}
        className="group flex w-full flex-col items-center gap-1 py-2 text-ink transition hover:text-violet-bright"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full transition group-hover:scale-110 group-hover:bg-white/10">
          <Icon path={item.icon} />
        </span>
        <span className="text-[11px] font-bold leading-none">{item.label}</span>
      </a>
    ))}
  </nav>
  </>
);

// ---------------------------------------------------------------------------
// Barra superior: logo, busca e CTA lima
// ---------------------------------------------------------------------------

const TopBar = ({ query, onQueryChange, onRandom, menuOpen, onMenu }) => (
  <header className="sticky top-0 z-popover bg-canvas/95 backdrop-blur">
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:px-8">
      {/* No celular o logo abre o menu lateral; no computador leva ao início */}
      <button
        type="button"
        onClick={onMenu}
        className="flex shrink-0 items-center gap-2 md:hidden"
        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={menuOpen}
        aria-controls="menu-principal"
      >
        <Icon path={icons.menu} className="h-5 w-5 text-muted" />
        <img src="/images/site/logo.png" alt="" className="h-9 w-auto" />
      </button>
      <a href="#inicio" className="hidden shrink-0 md:block">
        <img src="/images/site/logo.png" alt="VAH Games" className="h-10 w-auto" />
      </a>
      <label className="relative order-last w-full md:order-none md:mx-auto md:max-w-md">
        <span className="sr-only">Buscar jogos</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
          <Icon path={icons.search} className="h-[18px] w-[18px]" />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar jogos"
          className="input pl-11"
        />
      </label>
      <button type="button" onClick={onRandom} className="btn-lime ml-auto w-10 shrink-0 px-0 sm:w-auto sm:px-[14px] md:ml-0" aria-label="Jogo aleatório">
        <Icon path={icons.shuffle} className="h-[18px] w-[18px]" />
        <span className="hidden sm:inline">Jogo aleatório</span>
      </button>
    </div>
  </header>
);

// ---------------------------------------------------------------------------
// Destaque (hero)
// ---------------------------------------------------------------------------

const Hero = ({ game }) => (
  <section id="inicio" className="scroll-mt-24 px-4 md:px-8">
    <div className="relative overflow-hidden rounded-sm bg-grad-violet">
      <div className="grid items-center gap-6 p-5 md:grid-cols-[1.1fr_1fr] md:gap-8 md:p-12">
        <div className="relative z-[1] flex flex-col items-start gap-4">
          <span className="rounded-full bg-white/10 px-3 py-1 text-caption uppercase text-violet-bright">
            Em destaque
          </span>
          <h1 className="font-display text-[28px] font-black uppercase leading-[1.1] text-ink md:text-[40px]">
            Jogue grátis,<br />direto no navegador
          </h1>
          <p className="max-w-md text-body-lg text-body">
            Corrida, arcade, Termo, Sudoku, xadrez, damas e desenho com os amigos. Sem instalar nada — é só clicar e jogar.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={game.gameLink} className="btn-lime px-5">
              <Icon path={icons.play} className="h-4 w-4" />
              Jogar {game.title}
            </a>
            <a href="#jogos" className="btn-ghost px-5">Ver todos os jogos</a>
          </div>
        </div>
        <img
          src="/images/site/header.png"
          alt="Arte do VAH Games"
          className="w-full rounded-xs object-contain"
        />
      </div>
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// Card de jogo + carrossel horizontal
// ---------------------------------------------------------------------------

const Stars = ({ value }) => (
  <span className="text-caption text-lime" aria-label={`${value} de 5 estrelas`}>
    {'★'.repeat(value)}
    <span className="text-white/25">{'★'.repeat(5 - value)}</span>
  </span>
);

const GameCard = ({ game }) => (
  <a
    href={game.gameLink}
    className="card group relative block w-[240px] shrink-0 snap-start overflow-hidden transition duration-200 hover:scale-[1.03] hover:border-ink sm:w-[280px] lg:w-[300px]"
  >
    <div className="relative aspect-video overflow-hidden bg-surface-raised">
      <img src={game.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
      {game.isNew && (
        <span className="absolute left-2 top-2 rounded-full bg-badge px-2 py-0.5 text-caption uppercase text-ink">Novo</span>
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-canvas/50 opacity-0 transition group-hover:opacity-100">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-lime-ink shadow-lift">
          <Icon path={icons.play} className="h-5 w-5" />
        </span>
      </span>
    </div>
    <div className="flex flex-col gap-1 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-body-lg font-extrabold text-ink">{game.title}</h3>
        <Stars value={game.rating} />
      </div>
      <p className="truncate text-body-md text-muted">{game.tagline}</p>
      <span className="mt-1 text-caption uppercase text-violet-bright">{categoryLabel(game.category)}</span>
    </div>
  </a>
);

const Carousel = ({ id, title, games, emptyText, action }) => {
  const trackRef = useRef(null);
  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-3 px-4 md:px-8">
        <h2 className="heading">{title}</h2>
        <div className="flex items-center gap-2">
          {action}
          <button type="button" className="btn-icon" onClick={() => scrollBy(-1)} aria-label="Rolar para a esquerda">
            <Icon path={icons.left} className="h-5 w-5" />
          </button>
          <button type="button" className="btn-icon" onClick={() => scrollBy(1)} aria-label="Rolar para a direita">
            <Icon path={icons.right} className="h-5 w-5" />
          </button>
        </div>
      </div>
      {games.length > 0 ? (
        <div ref={trackRef} className="no-scrollbar flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 py-2 md:scroll-px-8 md:px-8">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <p className="mx-4 rounded-xs bg-white/[0.07] p-5 text-body-lg text-muted md:mx-8">{emptyText}</p>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Gêneros (tiles com gradiente)
// ---------------------------------------------------------------------------

const Categories = ({ active, onSelect }) => (
  <section id="categorias" className="scroll-mt-24">
    <h2 className="heading mb-3 px-4 md:px-8">Gêneros</h2>
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-2 md:px-8">
      {CATEGORIES.map((cat) => {
        const count = GAMES.filter((g) => g.category === cat.id).length;
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(isActive ? null : cat.id)}
            aria-pressed={isActive}
            className={`${cat.gradient} flex h-20 w-[168px] shrink-0 flex-col items-start justify-center rounded-xs border-2 px-5 text-left transition hover:scale-105 active:opacity-70 ${
              isActive ? 'border-lime' : 'border-transparent hover:border-ink'
            }`}
          >
            <span className="text-body-lg font-black text-ink">{cat.label}</span>
            <span className="text-caption text-muted">{count} {count === 1 ? 'jogo' : 'jogos'}</span>
          </button>
        );
      })}
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fazenda: seção à parte com os jogos de grupo, no tema de quadro-negro e madeira do app
// ---------------------------------------------------------------------------

const FARM = {
  board: '#2E3B33',
  wood: '#8B5A2B',
  woodDark: '#5C3A1A',
  cream: '#FFF6E5',
  paper: '#FDF8EE',
  orange: '#FF9F1C',
};

const FarmCard = ({ game }) => (
  <a
    href={game.gameLink}
    className="group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-xs border-[3px] transition duration-200 hover:-translate-y-1 hover:shadow-lift sm:w-[300px]"
    style={{ background: FARM.paper, borderColor: FARM.woodDark, boxShadow: `0 5px 0 ${FARM.woodDark}` }}
  >
    <div className="h-2" style={{ background: game.accent }} />
    <div className="flex items-center gap-4 p-4">
      <img
        src={game.image}
        alt=""
        loading="lazy"
        className="h-20 w-20 shrink-0 rounded-xs border-[3px] object-cover"
        style={{ borderColor: game.accent }}
      />
      <div className="min-w-0">
        <h3 className="text-[18px] font-black leading-tight" style={{ color: FARM.woodDark }}>{game.title}</h3>
        <p className="mt-1 text-caption uppercase" style={{ color: FARM.wood }}>{game.kind} · {game.players}</p>
      </div>
    </div>
    <p className="px-4 text-body-md" style={{ color: '#5B4636' }}>{game.tagline}</p>
    <span
      className="mx-4 mb-4 mt-4 inline-flex h-10 items-center justify-center rounded-full text-[14px] font-extrabold text-white transition group-hover:brightness-105"
      style={{ background: FARM.orange, boxShadow: `0 4px 0 ${FARM.woodDark}` }}
    >
      Jogar
    </span>
  </a>
);

const FarmSection = () => (
  <section id="fazenda" className="scroll-mt-24 px-4 md:px-8">
    <div
      className="relative overflow-hidden rounded-sm border-[6px] p-5 md:p-8"
      style={{ background: FARM.board, borderColor: FARM.wood, boxShadow: `inset 0 0 0 2px ${FARM.woodDark}` }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <img src="/games/fazenda/img/vaca.webp" alt="" className="h-14 w-auto shrink-0 drop-shadow-lg md:h-24" />
          <div className="min-w-0">
            <p className="text-caption uppercase" style={{ color: FARM.orange }}>Jogos em grupo · um celular só</p>
            <h2 className="font-display text-[24px] font-black uppercase leading-tight text-ink md:text-[32px]">Fazenda</h2>
            <p className="mt-1 max-w-xl text-body-md text-body">
              Junte a turma em volta do celular: blefe, pense igual à boiada ou seja a ovelha negra.
            </p>
          </div>
        </div>
        <a
          href="/games/fazenda/index.html"
          className="inline-flex h-10 shrink-0 items-center justify-center self-start rounded-full px-5 text-[14px] font-extrabold md:self-auto"
          style={{ background: FARM.cream, color: FARM.woodDark, boxShadow: `0 4px 0 ${FARM.woodDark}` }}
        >
          Abrir a Fazenda
        </a>
      </div>
      <div className="no-scrollbar -mx-5 mt-6 flex snap-x gap-4 overflow-x-auto px-5 pb-3 pt-1 md:-mx-8 md:px-8">
        {FARM_GAMES.map((game) => (
          <FarmCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  </section>
);

// Ranking geral real (public/js/vah-ranking.js): melhor resultado de cada nome em cada jogo
const RANKED_GAMES = [
  ['tetris', 'Tetris'],
  ['pacman', 'Pac-Man'],
  ['2048', '2048'],
  ['quebra-tijolos', 'Quebra-Tijolos'],
  ['nitro-mania', 'Nitro Mania'],
  ['fuga-do-sonic', 'A Fuga do Sonic'],
  ['arthur', 'Arthur'],
  ['termo', 'Termo'],
  ['sudoku', 'Sudoku'],
  ['cobrinha', 'Cobrinha'],
  ['hextris', 'Hextris'],
  ['torre', 'Torre'],
];

const GeneralRanking = () => {
  const [game, setGame] = useState(RANKED_GAMES[0][0]);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    const load = () => {
      if (!window.VAHRanking) return;
      window.VAHRanking.top(game, 5).then((res) => alive && setData(res));
    };
    if (window.VAHRanking) load();
    else window.addEventListener('load', load, { once: true });
    return () => {
      alive = false;
      window.removeEventListener('load', load);
    };
  }, [game]);

  const unit = game === 'arthur' ? 'fases' : 'pts';

  return (
    <div id="ranking" className="panel flex min-w-0 scroll-mt-24 flex-col">
      <h2 className="subheading">Ranking geral</h2>
      <p className="mb-3 text-body-md text-muted">Os melhores resultados de cada jogo.</p>
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 md:flex-wrap md:overflow-visible" role="tablist" aria-label="Jogo do ranking">
        {RANKED_GAMES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={game === id}
            onClick={() => setGame(id)}
            className={`btn h-[34px] shrink-0 px-4 ${game === id ? 'bg-lime text-lime-ink' : 'bg-white/10 text-ink hover:bg-white/20'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {!data ? (
        <p className="text-body-md text-muted">Carregando…</p>
      ) : data.entries.length === 0 ? (
        <p className="text-body-md text-muted">Ninguém no ranking ainda. Jogue e seja o primeiro!</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {data.entries.map((item, index) => (
            <li key={item.name} className="flex items-center gap-3 rounded-full bg-white/[0.05] py-2 pl-2 pr-4">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-black ${
                  index === 0 ? 'bg-lime text-lime-ink' : 'bg-white/10 text-ink'
                }`}
              >
                {index + 1}
              </span>
              <span className="flex-1 truncate text-body-lg font-bold text-ink">{item.name}</span>
              <span className="text-body-md font-extrabold text-violet-bright">
                {item.score.toLocaleString('pt-BR')} {unit}
              </span>
            </li>
          ))}
        </ol>
      )}
      {data && !data.online && (
        <p className="mt-3 text-caption text-muted">Ranking online indisponível: mostrando os resultados deste aparelho.</p>
      )}
      <button type="button" className="btn-ghost mt-4 self-start px-4" onClick={() => window.VAHRanking?.show(game)}>
        Ver top 10
      </button>
    </div>
  );
};

const RankingSection = () => (
  <section className="px-4 md:px-8">
    <GeneralRanking />
  </section>
);

// ---------------------------------------------------------------------------
// Rodapé
// ---------------------------------------------------------------------------

const SOCIAL = [
  {
    label: 'Facebook',
    path: 'M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.62H8.04V12h2.398V9.36c0-2.363 1.443-3.65 3.54-3.65 1.025 0 1.91.076 2.164.11v2.51h-1.48c-1.166 0-1.393.555-1.393 1.36v1.77h2.774l-.45 2.87H13.25V22c5.313-.842 9.25-5.646 9.25-11C22 6.477 17.523 2 12 2z',
  },
  {
    label: 'Twitter',
    path: 'M22.46 6.03c-.69.31-1.43.52-2.2.61.8-.48 1.4-1.24 1.7-2.14-.75.45-1.58.78-2.46.96-.7-1.02-1.7-1.66-2.96-1.66-2.24 0-4.06 1.82-4.06 4.06 0 .32.04.63.1.93-3.37-.17-6.36-1.78-8.36-4.23-.35.6-.55 1.29-.55 2.04 0 1.4.7 2.64 1.77 3.37-.65-.02-1.26-.2-1.8-.5v.05c0 1.97 1.4 3.61 3.26 3.98-.34.09-.7.14-1.07.14-.26 0-.52-.03-.77-.07.52 1.62 2.03 2.8 3.82 2.83-1.39 1.09-3.14 1.75-5.06 1.75-.33 0-.66-.02-.98-.06C4.4 19.34 6.56 20 8.8 20c10.56 0 16.34-8.74 16.34-16.34 0-.25-.01-.5-.02-.75.7-.5 1.3-1.12 1.78-1.83z',
  },
  {
    label: 'Instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.251-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0 2.163c-3.204 0-3.584.012-4.85.07-2.77.126-3.858 1.17-3.984 3.984-.058 1.265-.07 1.645-.07 4.85s.012 3.584.07 4.85c.126 2.77 1.17 3.858 3.984 3.984 1.265.058 1.645.07 4.85.07s3.584-.012 4.85-.07c2.77-.126 3.858-1.17 3.984-3.984.058-1.265.07-1.645.07-4.85s-.012-3.584-.07-4.85c-.126-2.77-1.17-3.858-3.984-3.984-1.265-.058-1.645-.07-4.85-.07zm0 1.882c-3.154 0-5.706 2.552-5.706 5.706s2.552 5.706 5.706 5.706 5.706-2.552 5.706-5.706-2.552-5.706-5.706-5.706zm0 2.163c2.067 0 3.706 1.639 3.706 3.706s-1.639 3.706-3.706 3.706-3.706-1.639-3.706-3.706 1.639-3.706 3.706-3.706zm6.538-6.19c-.813 0-1.472.659-1.472 1.472s.659 1.472 1.472 1.472 1.472-.659 1.472-1.472-.659-1.472-1.472-1.472z',
  },
];

const Footer = () => (
  <footer className="mt-section border-t border-line px-4 py-8 md:px-8">
    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2">
        <img src="/images/site/logo.png" alt="VAH Games" className="h-8 w-auto self-start" />
        <p className="text-caption text-muted">© {new Date().getFullYear()} VAH Games. Feito para jogar.</p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {['Sobre nós', 'Termos', 'Suporte', 'Contato'].map((label) => (
          <a key={label} href="#" className="text-[14px] font-bold text-ink transition hover:opacity-80">
            {label}
          </a>
        ))}
      </div>
      <div className="flex gap-2">
        {SOCIAL.map((s) => (
          <a key={s.label} href="#" aria-label={s.label} className="btn-icon">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d={s.path} />
            </svg>
          </a>
        ))}
      </div>
    </div>
  </footer>
);

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return GAMES.filter(
      (g) =>
        (!category || g.category === category) &&
        (!q || normalize(`${g.title} ${g.tagline} ${categoryLabel(g.category)}`).includes(q)),
    );
  }, [query, category]);

  const isFiltering = Boolean(query.trim() || category);
  const filterTitle = category ? categoryLabel(category) : `Resultados para “${query.trim()}”`;

  const playRandom = () => {
    const game = SOLO_GAMES[Math.floor(Math.random() * SOLO_GAMES.length)];
    window.location.href = game.gameLink;
  };

  const clearFilters = () => {
    setQuery('');
    setCategory(null);
  };

  const topRated = SOLO_GAMES.filter((g) => g.rating === 5);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-w-0 md:pl-sidebar">
        <TopBar query={query} onQueryChange={setQuery} onRandom={playRandom} menuOpen={menuOpen} onMenu={() => setMenuOpen((o) => !o)} />
        <main className="flex flex-col gap-8 pb-4 pt-2">
          {!isFiltering && <Hero game={GAMES[0]} />}

          {isFiltering && (
            <Carousel
              id="busca"
              title={filterTitle}
              games={filtered}
              emptyText="Nenhum jogo encontrado. Tente outro nome ou gênero."
              action={
                <button type="button" onClick={clearFilters} className="btn-ghost px-4">
                  <Icon path={icons.close} className="h-4 w-4" />
                  Limpar
                </button>
              }
            />
          )}

          <Carousel id="novidades" title="Novidades" games={NEW_GAMES} />
          <Categories active={category} onSelect={setCategory} />
          <Carousel id="jogos" title="Todos os jogos" games={SOLO_GAMES} />
          <FarmSection />
          <Carousel id="favoritos" title="Mais bem avaliados" games={topRated} />
          <RankingSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
