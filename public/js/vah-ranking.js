/*
 * Ranking geral do VAH Games (window.VAHRanking).
 *
 * Usado pelos jogos em HTML estático (public/games) e pelos jogos em React. Guarda o MELHOR
 * resultado de cada nome em cada jogo, no Firebase Realtime Database, pela API REST:
 *
 *   /rankings/{jogo}/{chaveDoNome} = { name, score, ts }
 *
 * Se o banco não responder (ainda não criado, sem internet...), o ranking fica salvo só neste
 * aparelho (localStorage) e a janela avisa isso.
 *
 * API:
 *   VAHRanking.submit(jogo, pontos)  -> abre a janela para digitar o nome e salvar
 *   VAHRanking.show(jogo)            -> abre a janela só com o ranking
 *   VAHRanking.top(jogo, n)          -> Promise<{ online, entries: [{ name, score }] }>
 *   VAHRanking.GAMES                 -> jogos com ranking
 */
(function () {
  'use strict';

  // URL do Realtime Database do projeto Firebase "vah-games" (Console > Realtime Database).
  var DATABASE_URL = 'https://vah-games-default-rtdb.firebaseio.com';
  var TIMEOUT_MS = 6000;
  var NAME_KEY = 'vah:nome';

  var GAMES = {
    'tetris': { title: 'Tetris', unit: 'pontos' },
    'pacman': { title: 'Pac-Man', unit: 'pontos' },
    '2048': { title: '2048', unit: 'pontos' },
    'quebra-tijolos': { title: 'Quebra-Tijolos', unit: 'pontos' },
    'nitro-mania': { title: 'Nitro Mania', unit: 'pontos' },
    'fuga-do-sonic': { title: 'A Fuga do Sonic', unit: 'pontos' },
    'arthur': { title: 'Arthur: Última Saída', unit: 'fases' }
  };

  // ---------------------------------------------------------------------------
  // Armazenamento
  // ---------------------------------------------------------------------------
  function lsGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* sem armazenamento */ }
  }

  function cleanName(name) {
    return String(name || '').replace(/\s+/g, ' ').trim().slice(0, 20);
  }
  // Chave estável por nome: "Héber Câmara" e "heber camara" são a mesma pessoa
  function nameKey(name) {
    return cleanName(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'anonimo';
  }

  function request(path, options) {
    if (!DATABASE_URL) return Promise.reject(new Error('sem banco'));
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    var opts = options || {};
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(DATABASE_URL + path, opts).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  function sortEntries(obj) {
    return Object.keys(obj || {}).map(function (k) { return obj[k]; })
      .filter(function (e) { return e && typeof e.score === 'number' && e.name; })
      .sort(function (a, b) { return b.score - a.score || (a.ts || 0) - (b.ts || 0); });
  }

  function localAll(game) {
    return lsGet('vah:ranking:' + game, {});
  }
  function localSave(game, name, score) {
    var all = localAll(game);
    var key = nameKey(name);
    if (!all[key] || score > all[key].score) {
      all[key] = { name: cleanName(name), score: score, ts: Date.now() };
      lsSet('vah:ranking:' + game, all);
    }
  }

  function top(game, n) {
    var limit = n || 10;
    return request('/rankings/' + encodeURIComponent(game) + '.json').then(function (data) {
      return { online: true, entries: sortEntries(data).slice(0, limit) };
    }).catch(function () {
      return { online: false, entries: sortEntries(localAll(game)).slice(0, limit) };
    });
  }

  // Salva só se for o melhor resultado desse nome (as regras do banco também garantem isso)
  function save(game, name, score) {
    localSave(game, name, score);
    var path = '/rankings/' + encodeURIComponent(game) + '/' + nameKey(name) + '.json';
    return request(path).then(function (current) {
      if (current && typeof current.score === 'number' && current.score >= score) return { online: true, improved: false, best: current.score };
      return request(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName(name), score: score, ts: Date.now() })
      }).then(function () { return { online: true, improved: true, best: score }; });
    }).catch(function () {
      var mine = localAll(game)[nameKey(name)];
      return { online: false, improved: !mine || mine.score <= score, best: mine ? mine.score : score };
    });
  }

  // ---------------------------------------------------------------------------
  // Janela (visual do DESIGN.md, sem depender do CSS da página)
  // ---------------------------------------------------------------------------
  var STYLE = [
    '.vahr-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;',
    'background:rgba(12,13,20,.78);font-family:Outfit,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}',
    '.vahr-card{width:100%;max-width:400px;max-height:calc(100vh - 32px);overflow:auto;background:#1F2026;color:#E5E6EE;border:2px solid #292A30;',
    'border-radius:22px;padding:20px;box-shadow:rgba(0,0,0,.7) 0 10px 30px;text-align:left;line-height:1.43}',
    '.vahr-kicker{margin:0;font-size:12px;font-weight:700;text-transform:uppercase;color:#A48EFF}',
    '.vahr-title{margin:2px 0 12px;font-size:24px;font-weight:900;text-transform:uppercase;color:#fff;line-height:1.2}',
    '.vahr-score{margin:0 0 14px;padding:12px 16px;border-radius:16px;background:linear-gradient(285deg,rgb(23,29,46) 20%,rgb(61,47,115) 100%);font-size:14px}',
    '.vahr-score b{display:block;font-size:28px;font-weight:900;color:#fff;line-height:1.1}',
    '.vahr-input{box-sizing:border-box;width:100%;height:40px;padding:0 16px;border-radius:9999px;border:2px solid transparent;background:rgba(255,255,255,.1);',
    'color:#fff;font:400 14px Outfit,sans-serif;outline:none}',
    '.vahr-input:focus{border-color:#EFF0F7}.vahr-input::placeholder{color:#BDBFCE}',
    '.vahr-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}',
    '.vahr-btn{flex:1;height:40px;padding:0 14px;border:0;border-radius:9999px;font:700 14px Outfit,sans-serif;cursor:pointer;white-space:nowrap}',
    '.vahr-btn:active{opacity:.7}.vahr-btn:focus-visible{outline:2px solid #EFF0F7;outline-offset:2px}',
    '.vahr-lime{background:#C7FF5B;color:#0F1A00}.vahr-ghost{background:rgba(255,255,255,.1);color:#fff}',
    '.vahr-btn:disabled{opacity:.4;cursor:default}',
    '.vahr-list{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}',
    '.vahr-list li{display:flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;border-radius:9999px;background:rgba(255,255,255,.05);font-size:14px}',
    '.vahr-list li.me{background:rgba(199,255,91,.16)}',
    '.vahr-pos{flex:0 0 28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:rgba(255,255,255,.1);font-weight:900;color:#fff}',
    '.vahr-list li:first-child .vahr-pos{background:#C7FF5B;color:#0F1A00}',
    '.vahr-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;color:#fff}',
    '.vahr-pts{font-weight:800;color:#A48EFF}',
    '.vahr-note{margin:10px 0 0;font-size:12px;font-weight:700;color:#BDBFCE}',
    '.vahr-empty{margin:14px 0 0;color:#BDBFCE;font-size:14px}'
  ].join('');

  function ensureStyle() {
    if (document.getElementById('vahr-style')) return;
    var st = document.createElement('style');
    st.id = 'vahr-style';
    st.textContent = STYLE;
    document.head.appendChild(st);
  }

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var openOverlay = null;
  function close() {
    if (openOverlay) {
      openOverlay.remove();
      openOverlay = null;
    }
  }

  function renderList(container, result, game, highlightKey) {
    var unit = (GAMES[game] && GAMES[game].unit) || 'pontos';
    var html = '';
    if (!result.entries.length) {
      html = '<p class="vahr-empty">Ninguém no ranking ainda. Seja o primeiro!</p>';
    } else {
      html = '<ol class="vahr-list">' + result.entries.map(function (e, i) {
        var me = highlightKey && nameKey(e.name) === highlightKey;
        return '<li class="' + (me ? 'me' : '') + '"><span class="vahr-pos">' + (i + 1) + '</span>' +
          '<span class="vahr-name">' + esc(e.name) + '</span>' +
          '<span class="vahr-pts">' + Number(e.score).toLocaleString('pt-BR') + ' ' + unit + '</span></li>';
      }).join('') + '</ol>';
    }
    if (!result.online) html += '<p class="vahr-note">Ranking online indisponível no momento: mostrando os resultados salvos neste aparelho.</p>';
    container.innerHTML = html;
  }

  function modal(game, score) {
    ensureStyle();
    close();
    var info = GAMES[game] || { title: game, unit: 'pontos' };
    var overlay = document.createElement('div');
    overlay.className = 'vahr-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Ranking de ' + info.title);
    var withScore = typeof score === 'number';
    overlay.innerHTML =
      '<div class="vahr-card">' +
      '<p class="vahr-kicker">Ranking geral</p>' +
      '<h2 class="vahr-title">' + esc(info.title) + '</h2>' +
      (withScore
        ? '<p class="vahr-score">Seu resultado<b>' + Number(score).toLocaleString('pt-BR') + ' ' + info.unit + '</b></p>' +
          '<form class="vahr-form"><input class="vahr-input" name="nome" maxlength="20" autocomplete="nickname" placeholder="Seu nome" aria-label="Seu nome" required>' +
          '<div class="vahr-row"><button type="submit" class="vahr-btn vahr-lime">Salvar no ranking</button>' +
          '<button type="button" class="vahr-btn vahr-ghost" data-close>Agora não</button></div></form>'
        : '') +
      '<div class="vahr-board"><p class="vahr-empty">Carregando…</p></div>' +
      (withScore ? '' : '<div class="vahr-row"><button type="button" class="vahr-btn vahr-ghost" data-close>Fechar</button></div>') +
      '</div>';

    // Os jogos escutam o teclado na janela inteira; aqui as teclas ficam só com o formulário
    ['keydown', 'keyup', 'keypress'].forEach(function (t) {
      overlay.addEventListener(t, function (e) {
        e.stopPropagation();
        if (t === 'keydown' && e.key === 'Escape') close();
      });
    });
    overlay.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    overlay.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || (e.target.closest && e.target.closest('[data-close]'))) close();
    });

    document.body.appendChild(overlay);
    openOverlay = overlay;
    var board = overlay.querySelector('.vahr-board');
    var input = overlay.querySelector('.vahr-input');
    var lastName = lsGet(NAME_KEY, '');

    top(game, 10).then(function (res) { renderList(board, res, game, lastName ? nameKey(lastName) : null); });

    if (input) {
      input.value = lastName || '';
      setTimeout(function () { input.focus(); input.select(); }, 50);
      overlay.querySelector('.vahr-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var name = cleanName(input.value);
        if (!name) return;
        lsSet(NAME_KEY, name);
        var btn = overlay.querySelector('.vahr-lime');
        btn.disabled = true;
        btn.textContent = 'Salvando…';
        save(game, name, score).then(function (r) {
          var form = overlay.querySelector('.vahr-form');
          var msg = r.improved ? 'Salvo! Este é o seu recorde.' : 'Seu recorde continua sendo ' + Number(r.best).toLocaleString('pt-BR') + ' ' + info.unit + '.';
          form.innerHTML = '<p class="vahr-note" style="margin:0 0 4px;color:#C7FF5B">' + esc(msg) + '</p>' +
            '<div class="vahr-row"><button type="button" class="vahr-btn vahr-ghost" data-close>Fechar</button></div>';
          return top(game, 10).then(function (res) { renderList(board, res, game, nameKey(name)); });
        });
      });
    }
  }

  window.VAHRanking = {
    GAMES: GAMES,
    top: top,
    submit: function (game, score) {
      var pts = Math.floor(Number(score) || 0);
      if (pts <= 0) return;
      modal(game, pts);
    },
    show: function (game) { modal(game); },
    close: close,
    // Botão flutuante "Ranking" para as páginas de jogo (canto inferior direito)
    button: function (game) {
      ensureStyle();
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = '🏆 Ranking';
      b.setAttribute('aria-label', 'Ver ranking geral');
      b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147482000;height:40px;padding:0 16px;border:0;' +
        'border-radius:9999px;background:#C7FF5B;color:#0F1A00;font:700 14px Outfit,-apple-system,"Segoe UI",sans-serif;' +
        'cursor:pointer;box-shadow:rgba(0,0,0,.5) 0 4px 14px';
      b.addEventListener('click', function (e) { e.stopPropagation(); modal(game); b.blur(); });
      b.addEventListener('keydown', function (e) { e.stopPropagation(); });
      document.body.appendChild(b);
      return b;
    }
  };
})();
