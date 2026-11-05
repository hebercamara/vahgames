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
  games/                jogos em React (Xadrez, Damas, Quebra-Tijolos, Lousa Mágica/Telestrations)
  components/GamePage.jsx  moldura comum das páginas de jogo
  services/firebase.js  configuração do Firebase (Realtime Database)
public/
  games/                jogos em HTML estático (Nitro Mania, A Fuga do Sonic, Arthur, Tetris, Pac-Man, 2048, Fazenda)
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
- Xadrez: regras com [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), tabuleiro com
  [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT) e computador com
  [js-chess-engine](https://github.com/josefjadrny/js-chess-engine) (MIT).
- Damas: implementação própria com a regra brasileira (`src/games/Damas/logic.js`).
- Quebra-Tijolos: jogo próprio do VAH Games (`src/games/QuebraTijolos`).
- 2048: [gabrielecirulli/2048](https://github.com/gabrielecirulli/2048) de Gabriele Cirulli (MIT), com tema
  visual VAH em `public/games/2048/style/vah.css`. Licença em `public/games/2048/LICENSE.txt`.
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
