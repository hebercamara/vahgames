# Salas online da Fazenda — rascunho

Hoje os três jogos da Fazenda (Nem que a Vaca Tussa!, Maria vai com as Outras e Ovelha Negra)
funcionam com **um celular só**, passado de mão em mão. A ideia é que cada pessoa jogue **no
próprio celular**, cada uma na sua casa, numa **sala online**.

## 1. Como a pessoa usa

1. **Criar sala**: na Fazenda, escolhe o jogo, toca em **Criar sala online** e digita o próprio
   nome. Quem cria vira o **anfitrião**.
2. **Convidar**: a sala recebe um **código de 5 letras** (ex.: `MUUUH`, sem letras confusas como
   O/0 e I/1) e um link `vah-games.web.app/games/fazenda/?sala=MUUUH`. Botões prontos:
   **Enviar no WhatsApp** (abre `wa.me/?text=...` com o convite), **Copiar link** e
   **Compartilhar** (menu nativo do celular).
3. **Entrar**: quem recebe abre o link (ou digita o código em **Entrar numa sala**), põe o nome
   e escolhe o bichinho. Todo mundo aparece na **sala de espera** em tempo real.
4. **Começar**: o anfitrião ajusta as opções (meta de pontos, categorias, tempo da rodada) e
   toca em **Começar** quando houver o mínimo de jogadores (2 na Vaca, 3 na Maria e na Ovelha).
5. **Jogar** (detalhes por jogo abaixo). O placar fica visível o tempo todo para todos.
6. **Fim**: pódio igual ao de hoje, com **Jogar de novo** (mesma sala, mesmas pessoas).

Quem cair (fechar o app, perder a internet) volta para a mesma cadeira ao abrir o link de novo
no mesmo aparelho. Se o anfitrião sair, o próximo da lista vira anfitrião.

## 2. Nem que a Vaca Tussa! online

- A carta aparece para todos ao mesmo tempo. A **ordem de chute** é a ordem da roda (sorteada no
  começo e girando a cada rodada).
- **Na sua vez**: um teclado numérico grande com o campo do chute; só aceita número **maior** que
  o último. Os outros veem "Fulano está pensando…" e o histórico de chutes da rodada.
- **Botão NEM QUE A VACA TUSSA!**: fica disponível para **todos menos quem acabou de chutar**,
  a partir do primeiro chute. O primeiro toque que chegar ao servidor vale (os outros veem quem
  tossiu).
- **Revelação automática**: a carta vira para todos com a resposta e a curiosidade. O app compara
  com o último chute e já entrega a carta para quem perdeu:
  - resposta **menor** que o chute → quem chutou leva a carta;
  - resposta **maior ou igual** → quem tossiu leva a carta.
- Tempo limite opcional por vez (ex.: 40 s); se estourar, a pessoa é obrigada a tossir ou chutar
  o mínimo possível (a definir).

## 3. Maria vai com as Outras e Ovelha Negra online

- A pergunta aparece para todos e começa um **timer** (padrão 30 s, ajustável na sala).
- Cada um **digita a resposta escondido** no próprio celular. Dá para ver quem já respondeu, mas
  não o quê. Quando todos respondem, o timer acaba antes.
- **Agrupamento automático**: o app junta respostas iguais ignorando acentos, maiúsculas, plural
  e espaços (o motor atual da Maria/Ovelha já faz isso com `textKey`).
- **Mediação** (para "carro vermelho" × "vermelho"):
  - Tela de **revisão** de 20 s para todos, com os grupos formados.
  - Qualquer jogador pode **arrastar uma resposta para outro grupo** (ou tocar em "Juntar com…").
    Cada junção vira uma **proposta**; aprovada com voto da maioria, ou pelo anfitrião direto
    (opção da sala: "Anfitrião decide" ou "Votação").
  - Acabou o tempo ou todos tocaram em **Confirmar**: os pontos saem sozinhos.
- **Pontuação** igual à de hoje:
  - Maria: quem está no grupo **mais popular** ganha feno; empate na maioria, ninguém ganha;
    quem ficar **sozinho** com uma resposta leva o sino 🔔.
  - Ovelha: só pontua quem ficou **sozinho** com a resposta.
- Quem não respondeu no tempo fica sem resposta na rodada (não pontua e não leva sino).

## 4. Como funciona por dentro

**Firebase Realtime Database**, que já está no projeto (mesmo banco do ranking), mais o
**login anônimo** do Firebase Auth para identificar cada aparelho sem pedir cadastro.

```
/salas/{codigo}
  jogo: "vaca" | "maria" | "ovelha"
  anfitriao: uid
  criadaEm, atualizadaEm
  opcoes: { meta, categorias, tempoResposta, mediacao: "anfitriao" | "votacao" }
  jogadores/{uid}: { nome, avatar, ordem, pontos, online, sino }
  rodada:
    numero, fase: "espera" | "chutes" | "resposta" | "revisao" | "revelacao" | "fim"
    perguntaId, prazo (timestamp do servidor)
    vaca:   { vez: uid, chutes: [{ uid, valor }], tosse: { uid, em } }
    rebanho: { grupos: { chave: [uid] }, propostas/{id}: { de, para, votos } }
  respostas/{rodada}/{uid}: "texto"     <- cada um só escreve a própria
/salasPorCodigo/{codigo}: true          <- reserva do código
```

- **Quem manda no jogo**: o celular do anfitrião calcula a revelação e os pontos e grava o
  resultado; os outros só gravam o próprio chute, a tosse, a resposta e os votos. É simples e
  não precisa de servidor pago. Se um dia houver trapaça, essa parte pode ir para uma Cloud
  Function (plano Blaze) sem mudar as telas.
- **Respostas escondidas**: cada resposta fica em `respostas/{rodada}/{uid}`, que as regras só
  deixam o próprio dono ler até a fase `revisao`.
- **Tosse**: gravada com transação (`tosse` só é escrita se ainda estiver vazia), então só vale o
  primeiro toque.
- **Timers**: o prazo é gravado com o horário do servidor (`ServerValue.TIMESTAMP`) e cada
  celular conta o tempo a partir dele, então todos veem o mesmo relógio.
- **Presença**: `onDisconnect()` marca `online: false`; salas sem ninguém por 24 h podem ser
  apagadas.
- **Perguntas**: o banco de perguntas já fica dentro do app; a sala só guarda o `perguntaId`.

## 5. Etapas sugeridas

1. **Base**: ligar o Firebase de verdade (ver abaixo), login anônimo, criar/entrar na sala,
   sala de espera com convite pelo WhatsApp e reconexão.
2. **Ovelha Negra online**: o mais simples (pergunta, timer, respostas, agrupamento, pontos).
3. **Mediação** (juntar grupos com voto ou anfitrião) e **Maria online** (mesmo motor + sino).
4. **Vaca online** (vez de cada um, teclado de chute, botão de tosse com transação, revelação).
5. Acabamento: sons e vibração sincronizados, emojis de reação, "jogar de novo", limpeza de salas.

Onde fica o código: no repositório **Nem-que-a-Vaca-Tussa** (é lá que estão os jogos), com o
modo online aparecendo só na versão web (a do portal) até ser testado no app Android.

## 6. Situação atual

As etapas 1 a 4 estão prontas no repositório **Nem-que-a-Vaca-Tussa** (`src/online/`), com testes
das regras (`npm test`). O build da Fazenda no VAH já inclui as salas, mas elas ficam **escondidas**
até o Firebase ser configurado. Para testar antes disso, abra
`/games/fazenda/index.html?rede=local` em duas ou mais abas do mesmo navegador.

Ainda não feito: tempo limite por vez na Vaca, mata-mata no empate online, emojis de reação e
limpeza automática de salas antigas.

## 7. Passo a passo no Firebase (uma vez)

No [console do Firebase](https://console.firebase.google.com/), entre no projeto **vah-games**.

**A. Criar o banco de dados**
1. Menu à esquerda: **Criação** (Build) → **Realtime Database** → **Criar banco de dados**.
2. Local: **Estados Unidos (us-central1)** → Avançar.
3. Regras de segurança: escolha **Começar no modo bloqueado** → Ativar.
4. Confira o endereço que aparece no topo da aba Dados. Deve ser
   `https://vah-games-default-rtdb.firebaseio.com`. Se for outro, avise (ele é usado no ranking e
   nas salas).

**B. Colar as regras**
1. Ainda no Realtime Database, aba **Regras**.
2. Apague o que estiver lá e cole todo o conteúdo do arquivo `database.rules.json` (raiz do
   repositório vahgames).
3. **Publicar**. A partir daqui o ranking geral já passa a ser online.

**C. Ativar o login anônimo** (para as salas)
1. Menu: **Criação** → **Authentication** → **Vamos começar** (se aparecer).
2. Aba **Método de login** → **Anônimo** → ative a chave → **Salvar**.
3. Aba **Configurações** → **Domínios autorizados**: confira que `vah-games.web.app` está na
   lista (normalmente já está).

**D. Registrar o app web e pegar a configuração**
1. Engrenagem ao lado de "Visão geral do projeto" → **Configurações do projeto**.
2. Em **Seus apps**, clique no ícone **</>** (Web). Apelido: `VAH Games`. Não marque o Hosting
   (ele já existe) → **Registrar app**.
3. Aparece um bloco `const firebaseConfig = { ... }`. Copie os valores de `apiKey` e `appId`
   (e confira `databaseURL`). Esses valores não são senhas: o Firebase foi feito para eles ficarem
   no site, e quem protege os dados são as regras do passo B.
4. Coloque esses valores em `.env.portal` no repositório Nem-que-a-Vaca-Tussa
   (`VITE_FIREBASE_API_KEY` e `VITE_FIREBASE_APP_ID`), rode `npm run build:portal` e copie o
   `dist-portal` para `public/games/fazenda` (ver README). Ou mande os valores que a gente faz isso.
