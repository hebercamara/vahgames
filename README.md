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
  games/                jogos em React (Pacman, Lousa Mágica/Telestrations, ...)
  services/firebase.js  configuração do Firebase (Realtime Database)
public/
  games/                jogos em HTML estático (Nitro Mania, A Fuga do Sonic, Arthur, Tetris)
  images/               imagens do portal e dos jogos
```

Para adicionar um jogo à galeria, inclua um item na lista `games` em `src/pages/Home.jsx`.

## Rodar localmente (opcional)

```bash
npm install
npm run dev
```

## Créditos

- Tetris: baseado em [react-tetris](https://github.com/chvin/react-tetris) de Chvin (Apache-2.0).
  Detalhes em `public/games/react-tetris/LICENSE-NOTICE.txt`.
