import React, { useMemo, useRef, useState } from 'react';

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
    image: '/images/site/capa-xadrez.svg',
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
];

// Cada categoria usa um dos gradientes de seção do DESIGN.md
const CATEGORIES = [
  { id: 'corrida', label: 'Corrida', gradient: 'bg-grad-blue' },
  { id: 'acao', label: 'Ação', gradient: 'bg-grad-rose' },
  { id: 'aventura', label: 'Aventura', gradient: 'bg-grad-teal' },
  { id: 'arcade', label: 'Arcade', gradient: 'bg-grad-olive' },
  { id: 'quebra-cabeca', label: 'Quebra-cabeça', gradient: 'bg-grad-green' },
  { id: 'tabuleiro', label: 'Tabuleiro', gradient: 'bg-grad-blue' },
  { id: 'multijogador', label: 'Multijogador', gradient: 'bg-grad-violet' },
];

const RANKING = [
  { player: 'Arthur Santos', score: 12890 },
  { player: 'Vitor Santos', score: 12500 },
  { player: 'Heber Câmara', score: 12300 },
  { player: 'Elite99', score: 12600 },
  { player: 'ProMaster', score: 11750 },
].sort((a, b) => b.score - a.score);

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
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
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
// Navegação lateral fixa (68px, sempre visível — sem menu hambúrguer)
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { href: '#inicio', label: 'Início', icon: icons.home },
  { href: '#jogos', label: 'Jogos', icon: icons.games },
  { href: '#categorias', label: 'Gêneros', icon: icons.grid },
  { href: '#ranking', label: 'Ranking', icon: icons.trophy },
  { href: '#comunidade', label: 'Turma', icon: icons.users },
];

const Sidebar = () => (
  <nav
    aria-label="Navegação principal"
    className="fixed inset-y-0 left-0 z-sticky flex w-sidebar flex-col items-center gap-1 bg-canvas py-3"
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
);

// ---------------------------------------------------------------------------
// Barra superior: logo, busca e CTA lima
// ---------------------------------------------------------------------------

const TopBar = ({ query, onQueryChange, onRandom }) => (
  <header className="sticky top-0 z-popover bg-canvas/95 backdrop-blur">
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:px-8">
      <a href="#inicio" className="shrink-0">
        <img src="/images/site/logo.png" alt="VAH Games" className="h-9 w-auto md:h-10" />
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
            Corrida, aventura, arcade, xadrez, damas e desenho com os amigos. Sem instalar nada — é só clicar e jogar.
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
// Ranking e comunidade
// ---------------------------------------------------------------------------

const WeeklyRanking = () => (
  <div id="ranking" className="panel scroll-mt-24">
    <h2 className="subheading mb-4">Ranking da semana</h2>
    <ol className="flex flex-col gap-2">
      {RANKING.map((item, index) => (
        <li key={item.player} className="flex items-center gap-3 rounded-full bg-white/[0.05] py-2 pl-2 pr-4">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-black ${
              index === 0 ? 'bg-lime text-lime-ink' : 'bg-white/10 text-ink'
            }`}
          >
            {index + 1}
          </span>
          <span className="flex-1 truncate text-body-lg font-bold text-ink">{item.player}</span>
          <span className="text-body-md font-extrabold text-violet-bright">{item.score.toLocaleString('pt-BR')}</span>
        </li>
      ))}
    </ol>
  </div>
);

const Community = () => (
  <section id="comunidade" className="scroll-mt-24 px-4 md:px-8">
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col items-start justify-center gap-4 rounded-xs bg-grad-teal p-5 md:p-8">
        <h2 className="heading">Comunidade</h2>
        <p className="max-w-xl font-display text-[18px] font-bold leading-[1.4] text-ink md:text-body-xl">
          Junte-se à turma VAH! Troque dicas, desafie os amigos e mostre quem manda no ranking.
        </p>
        <p className="max-w-xl text-body-lg text-body">
          Participe das discussões, sugira novos jogos e faça novos amigos que curtem jogar tanto quanto você.
        </p>
        <button type="button" className="btn-light">Acesse o fórum</button>
      </div>
      <WeeklyRanking />
    </div>
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
    const game = GAMES[Math.floor(Math.random() * GAMES.length)];
    window.location.href = game.gameLink;
  };

  const clearFilters = () => {
    setQuery('');
    setCategory(null);
  };

  const topRated = GAMES.filter((g) => g.rating === 5);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div className="pl-sidebar">
        <TopBar query={query} onQueryChange={setQuery} onRandom={playRandom} />
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

          <Carousel id="novidades" title="Novidades" games={GAMES.filter((g) => g.isNew)} />
          <Categories active={category} onSelect={setCategory} />
          <Carousel id="jogos" title="Todos os jogos" games={GAMES} />
          <Carousel id="favoritos" title="Mais bem avaliados" games={topRated} />
          <Community />
        </main>
        <Footer />
      </div>
    </div>
  );
}
