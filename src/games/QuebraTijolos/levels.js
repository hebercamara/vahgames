// Campanha do Quebra-Tijolos: 30 fases em 4 mundos, da partida rápida ao desafio de mestre.
//
// Cada linha tem 10 casas:
//   '.' vazio · '1' '2' '3' tijolo com 1 a 3 batidas
//   '#' aço (não quebra, não conta para terminar a fase)
//   '*' explosivo (ao quebrar, destrói os vizinhos; explosivos vizinhos explodem em cadeia)
//   '$' ouro (vale muitos pontos e sempre solta um item)
//   '?' surpresa (sempre solta um item)
//
// Opções da fase:
//   speed  velocidade inicial da bola (px/s)
//   paddle largura da raquete (px)
//   drift  fileiras que deslizam de um lado para o outro: { rows: [índices], amp: px, speed: rad/s }
//          fileiras vizinhas andam em sentidos opostos

export const WORLDS = [
  { name: 'Aquecimento', color: '#C7FF5B', from: 0 },
  { name: 'Formas e metais', color: '#5BC8FF', from: 8 },
  { name: 'Mecanismos', color: '#FF9F1C', from: 16 },
  { name: 'Mestre', color: '#FF5B8A', from: 24 },
];

export const LEVELS = [
  // ---------------- Mundo 1: Aquecimento (rápidas e fáceis) ----------------
  { name: 'Primeiro saque', speed: 250, paddle: 120, rows: ['..........', '..........', '.11111111.', '.11111111.'] },
  { name: 'Três linhas', speed: 265, paddle: 112, rows: ['..........', '1111111111', '1111111111', '1111111111'] },
  {
    name: 'Sorriso',
    speed: 275,
    paddle: 108,
    rows: ['..........', '.11....11.', '.11....11.', '..........', '1........1', '.1......1.', '..111111..'],
  },
  {
    name: 'Casinha',
    speed: 285,
    paddle: 104,
    rows: ['....22....', '...2112...', '..211112..', '.21111112.', '..111111..', '..1.11.1..', '..1.11.1..'],
  },
  {
    name: 'Coração',
    speed: 295,
    paddle: 100,
    rows: ['.22....22.', '2112..2112', '2111221112', '.21111112.', '..211112..', '...2112...', '....22....'],
  },
  {
    name: 'Tabuleiro',
    speed: 305,
    paddle: 96,
    rows: ['2.2.2.2.2.', '.1.1.1.1.1', '2.2.2.2.2.', '.1.1.1.1.1', '2.2.2.2.2.', '.1.1.1.1.1'],
  },
  { name: 'Baú do tesouro', speed: 310, paddle: 96, rows: ['1111111111', '1?11$$11?1', '1111111111', '2222222222', '2222222222'] },
  {
    name: 'Pirâmide',
    speed: 320,
    paddle: 92,
    rows: ['....22....', '...2112...', '..211112..', '.21111112.', '2111111112', '1111111111'],
  },

  // ---------------- Mundo 2: Formas e metais (aço e tijolos de 3 batidas) ----------------
  {
    name: 'Muralha',
    speed: 325,
    paddle: 92,
    rows: ['1111111111', '2222222222', '1111111111', '..........', '###....###'],
  },
  {
    name: 'Fortaleza',
    speed: 330,
    paddle: 90,
    rows: ['3333333333', '3........3', '3.222222.3', '3.2.11.2.3', '3.222222.3', '3........3', '3333333333'],
  },
  {
    name: 'Diamante',
    speed: 335,
    paddle: 90,
    rows: ['....33....', '...3223...', '..321123..', '.32111123.', '..321123..', '...3223...', '....33....'],
  },
  {
    name: 'Escada',
    speed: 340,
    paddle: 88,
    rows: ['1.........', '21........', '321.......', '3321......', '33321.....', '333321....', '3333321...', '33333321..'],
  },
  {
    name: 'Cofre aberto',
    speed: 345,
    paddle: 88,
    rows: ['#22222222#', '#........#', '#.111111.#', '#.1$$$$1.#', '#.111111.#', '#........#', '###....###'],
  },
  {
    name: 'Arco-íris',
    speed: 350,
    paddle: 86,
    rows: ['1221221221', '2332332332', '3113113113', '1221221221', '2332332332', '3113113113', '1111111111'],
  },
  {
    name: 'Foguete',
    speed: 355,
    paddle: 86,
    rows: ['....33....', '...3113...', '...1$$1...', '...1111...', '..211112..', '.2.1111.2.', '2..1..1..2'],
  },
  {
    name: 'Zigue-zague de aço',
    speed: 360,
    paddle: 84,
    rows: ['3333333333', '#########.', '2222222222', '.#########', '1111111111'],
  },

  // ---------------- Mundo 3: Mecanismos (explosivos e fileiras que se movem) ----------------
  {
    name: 'Barril de pólvora',
    speed: 360,
    paddle: 86,
    rows: ['1111111111', '11*1111*11', '1111111111', '2222*22222', '2222222222'],
  },
  {
    name: 'Correnteza',
    speed: 365,
    paddle: 86,
    rows: ['.22222222.', '..........', '.11111111.', '..........', '.22222222.'],
    drift: { rows: [0, 2, 4], amp: 30, speed: 1.2 },
  },
  {
    name: 'Reação em cadeia',
    speed: 370,
    paddle: 84,
    rows: ['3333333333', '3333333333', '**********', '2222222222', '2222222222', '1?1111111?'],
  },
  {
    name: 'Pêndulo',
    speed: 375,
    paddle: 84,
    rows: ['###....###', '.33333333.', '.22222222.', '.11111111.'],
    drift: { rows: [1, 2, 3], amp: 38, speed: 1.4 },
  },
  {
    name: 'Olho',
    speed: 380,
    paddle: 84,
    rows: ['...3333...', '..322223..', '.32111123.', '321*##*123', '.32111123.', '..322223..', '...3333...'],
  },
  {
    name: 'Engrenagens',
    speed: 385,
    paddle: 82,
    rows: ['.1.1.1.1..', '..2.2.2.2.', '.3.3.3.3..', '..2.2.2.2.', '.1.1.1.1..'],
    drift: { rows: [0, 1, 2, 3, 4], amp: 38, speed: 2 },
  },
  {
    name: 'Cofre-forte',
    speed: 390,
    paddle: 82,
    rows: ['##########', '#$$$$$$$$#', '#$$$$$$$$#', '###*..*###', '3333333333', '2222222222'],
  },
  {
    name: 'Tempestade',
    speed: 395,
    paddle: 80,
    rows: ['3*33333*33', '3333333333', '33*3333*33', '2222222222', '2*222222*2', '2222222222', '1111?11111'],
  },

  // ---------------- Mundo 4: Mestre (tudo junto, mais rápido) ----------------
  {
    name: 'Grades',
    speed: 400,
    paddle: 80,
    rows: ['3333333333', '#..####..#', '2222222222', '####..####', '1111111111', '#..####..#'],
  },
  {
    name: 'Ondas',
    speed: 405,
    paddle: 78,
    rows: ['.33333333.', '.22222222.', '.33333333.', '.22222222.', '.33333333.', '.22222222.'],
    drift: { rows: [0, 1, 2, 3, 4, 5], amp: 38, speed: 1.6 },
  },
  {
    name: 'Ampulheta',
    speed: 410,
    paddle: 78,
    rows: ['3333333333', '.33333333.', '..333333..', '...3**3...', '....##....', '...2**2...', '..222222..', '.22222222.', '2222222222'],
  },
  {
    name: 'Bunker',
    speed: 415,
    paddle: 76,
    rows: ['##########', '#33*33*33#', '#3$$$$$$3#', '#33333333#', '###....###', '2222222222'],
  },
  {
    name: 'Galáxia',
    speed: 420,
    paddle: 76,
    rows: ['..3....3..', '.3*3..3*3.', '..3....3..', '....33....', '...3**3...', '....33....', '..3....3..', '.3*3..3*3.', '..3....3..'],
    drift: { rows: [0, 1, 2, 6, 7, 8], amp: 30, speed: 1.3 },
  },
  {
    name: 'O Grande Final',
    speed: 430,
    paddle: 74,
    rows: ['#33333333#', '3$3*33*3$3', '3333333333', '33######33', '.22222222.', '.2*2222*2.', '.11111111.'],
    drift: { rows: [4, 5, 6], amp: 20, speed: 1.8 },
  },
];

export const worldOf = (levelIndex) => {
  let w = 0;
  WORLDS.forEach((world, i) => {
    if (levelIndex >= world.from) w = i;
  });
  return w;
};
