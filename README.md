# VAH Games

Portal de jogos para navegador — https://vah-games.web.app

Feito com React + Vite + Tailwind, hospedado no Firebase Hosting (projeto `vah-games`).

## Como publicar mudanças

O site é publicado **automaticamente pelo GitHub Actions** — não é preciso rodar nada no computador.

| O que você faz | O que acontece |
| --- | --- |
| Abre um Pull Request | O GitHub gera o site e comenta no PR um **link de prévia** (válido por 7 dias) |
| Faz merge na `main` (ou push direto nela) | O site oficial em vah-games.web.app é atualizado em ~2 minutos |

Fluxo recomendado: crie uma branch → faça as mudanças → abra um PR → confira a prévia → faça o merge.

Os workflows ficam em `.github/workflows/`. A chave de acesso ao Firebase é o secret
`FIREBASE_SERVICE_ACCOUNT_VAH_GAMES` (Settings → Secrets and variables → Actions).

## Estrutura

```
src/
  pages/Home.jsx        página inicial (galeria, ranking, comunidade)
  games/                jogos em React (Xadrez, Damas, Quebra-Tijolos, Termo, Sudoku, Cobrinha, Duelo de Mestres, Sinuca, Lousa Mágica/Telestrations)
  components/GamePage.jsx  moldura comum das páginas de jogo
  services/firebase.js  configuração do Firebase (Realtime Database)
public/
  games/                jogos em HTML estático (Nitro Mania, A Fuga do Sonic, Arthur, Tetris, Pac-Man, 2048, Hextris, Torre, Fazenda)
  data/termo/           palavras aceitas no Termo (dicionário VERO)
  images/               imagens do portal e dos jogos
```

Para adicionar um jogo à galeria, inclua um item na lista `GAMES` em `src/pages/Home.jsx`.

## Rodar localmente (opcional)

```bash
npm install
npm run dev
```

## Créditos

- Tetris: baseado em [react-tetris](https://github.com/chvin/react-tetris) de Chvin (Apache-2.0).
  Detalhes em `public/games/react-tetris/LICENSE-NOTICE.txt`.
- Pac-Man: [mumuy/pacman](https://github.com/mumuy/pacman) de Haole Zheng (MIT), com fonte
  Press Start 2P (SIL Open Font License 1.1). Licença em `public/games/pacman/LICENSE`.
- Xadrez: regras com [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause) e computador com
  [js-chess-engine](https://github.com/josefjadrny/js-chess-engine) (MIT). Tabuleiro em pixel art com perspectiva
  (`src/games/Xadrez/PixelBoard.jsx`) e peças desenhadas para o VAH Games em `public/images/xadrez`.
  Fonte Press Start 2P (SIL Open Font License 1.1) em `public/fonts`.
- Damas: implementação própria com a regra brasileira (`src/games/Damas/logic.js`).
- Sinuca (bola 8): jogo próprio do VAH Games (`src/games/Sinuca`): física, regras e computador escritos do zero,
  mesa e bolas desenhadas por código e sons sintetizados (sem arquivos de imagem ou áudio).
- Duelo de Mestres: implementação própria de um jogo de tabuleiro 5x5 com cartas de movimento (`src/games/DueloDeMestres`),
  com tabuleiro, fichas e cartas em aquarela feitos para o VAH Games (`public/images/duelo`).
- Quebra-Tijolos: jogo próprio do VAH Games (`src/games/QuebraTijolos`).
- 2048: [gabrielecirulli/2048](https://github.com/gabrielecirulli/2048) de Gabriele Cirulli (MIT), com tema
  visual VAH em `public/games/2048/style/vah.css`. Licença em `public/games/2048/LICENSE.txt`.
- Termo: jogo próprio do VAH Games (`src/games/Termo`). Respostas escolhidas à mão (`respostas.js`);
  palavras aceitas tiradas do dicionário pt-BR [VERO](https://pt-br.libreoffice.org/projetos/vero/) do LibreOffice
  (LGPLv3 / MPL), em `public/data/termo/palavras.txt`. Licença em `public/data/termo/LICENCA-VERO.txt`.
- Sudoku: interface própria com o gerador [sudoku.js](https://github.com/robatron/sudoku.js) de Rob McGuire-Dale
  (MIT), em `src/games/Sudoku/engine.js`. Licença em `src/games/Sudoku/LICENSE-sudoku.js.txt`.
- Cobrinha: jogo próprio do VAH Games (`src/games/Cobrinha`). Feito do zero porque, no
  [javascript-snakes](https://github.com/jakesgordon/javascript-snakes), só o código é MIT: músicas, efeitos,
  fontes e imagens são de terceiros.
- Hextris: [Hextris/hextris](https://github.com/Hextris/hextris) de Logan Engstrom e Garrett Finucane (GPL-3.0),
  traduzido e sem anúncios/rastreadores. O código modificado fica em `public/games/hextris` (licença em `LICENSE.md`).
- Torre: [iamkun/tower_game](https://github.com/iamkun/tower_game) (MIT), com abertura e fim de jogo novos em
  português. Licença em `public/games/torre/LICENSE`.
- Fazenda (Nem que a Vaca Tussa!, Maria vai com as Outras e Ovelha Negra): hub de jogos em grupo do
  repositório [Nem-que-a-Vaca-Tussa](https://github.com/hebercamara/Nem-que-a-Vaca-Tussa).

## Atualizar a Fazenda

`public/games/fazenda` é o build web do repositório Nem-que-a-Vaca-Tussa. Para atualizar:

```bash
cd ../Nem-que-a-Vaca-Tussa
npm install
npm run build:portal
rm -rf ../vahgames/public/games/fazenda
cp -r dist-portal ../vahgames/public/games/fazenda
```

Cada jogo abre direto com `/games/fazenda/index.html?jogo=vaca`, `?jogo=maria` ou `?jogo=ovelha`.

## Ranking geral

`public/js/vah-ranking.js` guarda o melhor resultado de cada nome em cada jogo (Tetris, Pac-Man,
2048, Quebra-Tijolos, Nitro Mania, A Fuga do Sonic, Arthur, Termo, Sudoku, Cobrinha, Hextris e Torre) no Firebase Realtime Database, em
`/rankings/{jogo}/{nome}`. As regras de segurança estão em `database.rules.json`. Enquanto o banco
não existir ou não responder, o ranking fica salvo só no aparelho de cada jogador.

Para ligar o ranking online (uma vez), no console do Firebase, projeto `vah-games`:
1. Realtime Database → Criar banco de dados (`us-central1`). A URL esperada é
   `https://vah-games-default-rtdb.firebaseio.com` (se for outra, troque `DATABASE_URL` no arquivo acima).
2. Aba Regras → colar `database.rules.json` → Publicar.

Sempre que um jogo novo ganhar ranking, cole e publique as regras de novo: o deploy automático só publica
o site (Hosting), não as regras do banco.

O rascunho das salas online da Fazenda está em [`docs/salas-online.md`](docs/salas-online.md).
