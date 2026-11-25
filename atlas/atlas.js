/* CaVeSal® Academy — Atlas médico: utilidades comunes de las láminas */
(function () {
  'use strict';
  var K = 'cavesal_academy_lang';
  var A = window.Atlas = {};
  A.lang = 'es';
  try { var g = localStorage.getItem(K); if (g === 'en' || g === 'pt') A.lang = g; } catch (e) {}
  A.setLang = function (l) { A.lang = l; try { localStorage.setItem(K, l); } catch (e) {} };
  A.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* láminas publicadas (orden del índice y de la barra) */
  A.LAMINAS = [
    { href: 'iota-terminos.html', t: { es: 'IOTA: términos', en: 'IOTA: terms', pt: 'IOTA: termos' } },
    { href: 'iota-reglas-simples.html', t: { es: 'IOTA: reglas simples B y M', en: 'IOTA: Simple Rules B and M', pt: 'IOTA: regras simples B e M' } },
    { href: 'o-rads.html', t: { es: 'O-RADS US', en: 'O-RADS US', pt: 'O-RADS US' } }
  ];
  A.nav = function (el, actual) {
    if (!el) return;
    el.innerHTML = A.LAMINAS.map(function (x) {
      return '<a href="' + x.href + '"' + (x.href === actual ? ' aria-current="page"' : '') + '>' + A.esc(x.t[A.lang]) + '</a>';
    }).join('');
  };

  /* créditos de imágenes reales (licencias libres con uso comercial) */
  A.CRED = {
    antil: { txt: 'Antil N, et al. Abdom Radiol 2022;47(9):3318. CC BY 4.0', url: 'https://doi.org/10.1007/s00261-022-03580-8' },
    wu: { txt: 'Wu L, Wu Y, et al. J Clin Med 2026;15(17):6717. CC BY 4.0', url: 'https://doi.org/10.3390/jcm15176717' },
    hagg: { txt: 'Mikael Häggström · Wikimedia Commons · CC0', url: '' },
    heil: { txt: 'James Heilman, MD · Wikimedia Commons · CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Auscities.PNG' },
    mim: { txt: 'Mme Mim · Wikimedia Commons · CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Fibroma_in_US.jpg' },
    iota: { txt: 'Timmerman D, et al. UOG 2026;67(5):702. CC BY 4.0', url: 'https://doi.org/10.1002/uog.70191' },
    hou: { txt: 'Hou L, et al. Front Oncol 2026;16:1721601. CC BY 4.0', url: 'https://doi.org/10.3389/fonc.2026.1721601' },
    roman: { txt: 'Román Cataña EA, et al. J Surg Case Rep 2026;(4):rjag297. CC BY 4.0', url: 'https://doi.org/10.1093/jscr/rjag297' },
    haggcl: { txt: 'Mikael Häggström · Wikimedia Commons · CC0', url: 'https://commons.wikimedia.org/wiki/File:Ultrasonography_of_corpus_luteum.jpg' },
    ekem: { txt: 'Ekem · Wikimedia Commons · CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Hydrosalpinx_(left).jpg' }
  };

  /* dibujos didácticos propios (vectores CaVeSal®), estilo ecográfico */
  function S(k, cuerpo, rot) {
    return '<svg class="dib" viewBox="0 0 200 140" role="img" aria-hidden="true"><defs>' +
      '<radialGradient id="st' + k + '" cx="50%" cy="45%" r="62%"><stop offset="0" stop-color="#8d939a"/><stop offset="1" stop-color="#34383d"/></radialGradient>' +
      '<linearGradient id="sh' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".92"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>' +
      '</defs><rect width="200" height="140" rx="10" fill="#101317"/>' + cuerpo.replace(/#ST/g, 'url(#st' + k + ')').replace(/#SH/g, 'url(#sh' + k + ')') +
      (rot ? '<text x="192" y="132" text-anchor="end" font-family="system-ui,sans-serif" font-size="12" font-weight="800" fill="#ffd166">' + rot + '</text>' : '') + '</svg>';
  }
  var EST = '<ellipse cx="100" cy="68" rx="88" ry="60" fill="#ST"/>';
  var PARED = 'fill="#050607" stroke="#dfe3e8" stroke-width="2.2"';
  var SOL = 'fill="#9aa1a8" stroke="#c9ced4" stroke-width="1"';
  function color(pts, r) { return pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r || 3.2) + '" fill="' + (i % 2 ? '#2f7dff' : '#ff3b30') + '"/>'; }).join(''); }
  var SECTOR = '<path d="M40 128 L70 18 Q100 8 130 18 L160 128" fill="none" stroke="#3ddc84" stroke-width="1.2" stroke-dasharray="4 3"/>';
  A.DIB = {
    b1: function () { return S('b1', EST + '<ellipse cx="100" cy="68" rx="54" ry="38" ' + PARED + '/>', 'B1'); },
    b2: function () { return S('b2', EST + '<ellipse cx="100" cy="68" rx="56" ry="40" ' + PARED + '/>' +
      '<path d="M154 58 Q142 66 154 78 Z" ' + SOL + '/><path d="M134 92 L150 82" stroke="#ffd166" stroke-width="1.5"/>' +
      '<text x="104" y="104" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="#ffd166">&lt;7 mm</text>', 'B2'); },
    b3: function () { return S('b3', '<rect x="10" y="10" width="180" height="120" rx="8" fill="#ST"/>' +
      '<path d="M66 54 L134 54 L172 132 L28 132 Z" fill="#SH"/>' +
      '<path d="M84 60 L70 132 M100 60 L100 132 M116 60 L130 132" stroke="#000" stroke-width="5" opacity=".5"/>' +
      '<ellipse cx="100" cy="44" rx="38" ry="22" fill="#d9dde2"/><ellipse cx="96" cy="40" rx="20" ry="10" fill="#f4f6f8"/>', 'B3'); },
    b4: function () { return S('b4', EST + '<rect x="30" y="26" width="140" height="86" rx="40" ' + PARED + '/>' +
      '<path d="M76 28 Q72 70 80 110 M124 28 Q130 70 118 110 M78 70 Q100 64 126 72" stroke="#dfe3e8" stroke-width="1.6" fill="none"/>' +
      '<path d="M30 122 L170 122" stroke="#ffd166" stroke-width="1.3" marker-end="none"/><text x="70" y="136" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="#ffd166">&lt;100 mm</text>', 'B4'); },
    b5: function () { return S('b5', EST + SECTOR + '<ellipse cx="100" cy="72" rx="50" ry="36" ' + PARED + '/>', 'CS 1'); },
    m1: function () { return S('m1', '<rect x="10" y="10" width="180" height="120" rx="8" fill="#2b2f34"/>' +
      '<path d="M48 70 Q40 40 66 34 Q76 18 98 30 Q122 16 136 36 Q162 40 154 64 Q170 84 148 98 Q140 122 112 112 Q94 128 76 110 Q46 112 52 92 Q34 82 48 70 Z" fill="#7f868e" stroke="#b5bbc2" stroke-width="1.4"/>' +
      '<circle cx="80" cy="60" r="7" fill="#5d636a"/><circle cx="118" cy="80" r="9" fill="#5d636a"/><circle cx="104" cy="52" r="4" fill="#a3a9b0"/><circle cx="90" cy="92" r="5" fill="#a3a9b0"/>', 'M1'); },
    m2: function () { return S('m2', '<rect x="10" y="10" width="180" height="120" rx="8" fill="#3a3e44"/>' +
      '<path d="M20 30 Q100 6 180 30 L180 120 Q100 136 20 120 Z" fill="#030405"/>' +
      '<path d="M60 120 Q52 70 80 52 Q100 40 120 52 Q148 70 140 120 Z" fill="#8d939a" stroke="#c9ced4" stroke-width="1.4"/>' +
      '<path d="M86 118 Q84 82 100 70 Q116 82 114 118" fill="none" stroke="#c9ced4" stroke-width="1.6"/>' +
      '<path d="M150 50 Q166 56 160 70 Q150 64 150 50 Z" fill="#6b7178"/>', 'M2'); },
    m3: function () { return S('m3', EST + '<ellipse cx="100" cy="68" rx="60" ry="42" ' + PARED + '/>' +
      '<path d="M62 46 Q72 52 68 62 Q58 58 62 46 Z M96 27 Q106 36 98 46 Q88 38 96 27 Z M138 44 Q130 54 138 62 Q148 56 138 44 Z M76 106 Q82 94 94 100 Q88 110 76 106 Z M124 104 Q126 90 138 94 Q136 106 124 104 Z" ' + SOL + '/>', '≥4'); },
    m4: function () { return S('m4', '<rect x="6" y="8" width="188" height="110" rx="46" ' + PARED + '/>' +
      '<path d="M50 10 Q60 60 44 116 M96 8 Q86 64 104 118 M146 10 Q136 60 150 116 M8 62 Q50 54 98 66 Q140 74 192 60" stroke="#dfe3e8" stroke-width="2.4" fill="none"/>' +
      '<path d="M92 50 Q86 60 96 74 Q112 80 112 64 Q118 54 104 50 Q98 42 92 50 Z M140 72 Q132 82 142 92 Q156 96 154 82 Q160 72 140 72 Z" ' + SOL + '/>' +
      '<text x="12" y="134" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="#ffd166">≥100 mm</text>', 'M4'); },
    m5: function () { return S('m5', '<rect x="10" y="10" width="180" height="120" rx="8" fill="#2b2f34"/>' + SECTOR +
      '<ellipse cx="100" cy="72" rx="56" ry="42" fill="#868d95"/>' +
      color([[70,60],[82,52],[96,64],[110,50],[124,62],[132,78],[118,86],[104,80],[90,92],[76,82],[66,74],[100,100],[114,104],[86,66],[120,72],[94,48],[138,64],[60,88]], 4), 'CS 4'); },
    o0: function () { return S('o0', '<rect x="10" y="10" width="180" height="120" rx="8" fill="#ST"/>' +
      '<ellipse cx="100" cy="76" rx="44" ry="30" fill="#050607" opacity=".55"/>' +
      '<path d="M60 10 L140 10 L170 130 L30 130 Z" fill="#000" opacity=".75"/>' +
      '<text x="100" y="88" text-anchor="middle" font-family="system-ui,sans-serif" font-size="40" font-weight="900" fill="#ffd166">?</text>', '0'); },
    o1: function () { return S('o1', EST + '<circle cx="72" cy="60" r="12" fill="#050607"/><circle cx="104" cy="50" r="9" fill="#050607"/><circle cx="128" cy="74" r="13" fill="#050607"/><circle cx="92" cy="86" r="8" fill="#050607"/><circle cx="116" cy="96" r="6" fill="#050607"/>', '≤3 cm'); },
    o2: function () { return S('o2', EST + '<ellipse cx="100" cy="68" rx="56" ry="40" ' + PARED + '/>', '<10 cm'); },
    o3: function () { return S('o3', EST + '<rect x="34" y="28" width="132" height="82" rx="38" ' + PARED + '/>' +
      '<path d="M84 30 Q78 70 88 108 M86 68 Q120 60 164 70" stroke="#dfe3e8" stroke-width="1.6" fill="none"/>' + color([[60,40]], 2.6), 'CS 2'); },
    o4: function () { return S('o4', EST + SECTOR + '<ellipse cx="100" cy="70" rx="58" ry="40" ' + PARED + '/>' +
      '<path d="M100 110 Q86 96 92 84 Q100 76 108 84 Q116 96 100 110 Z" ' + SOL + '/>' + color([[98,90],[104,96]], 2.6), 'CS 2'); },
    o5: function () { return S('o5', '<rect x="10" y="10" width="180" height="120" rx="8" fill="#3a3e44"/><path d="M14 112 Q100 140 186 112 L186 126 L14 126 Z" fill="#030405"/>' +
      '<rect x="26" y="20" width="148" height="88" rx="36" ' + PARED + '/>' +
      '<path d="M74 22 Q82 64 70 106 M128 22 Q120 64 134 106" stroke="#dfe3e8" stroke-width="2" fill="none"/>' +
      '<path d="M84 46 Q76 64 90 86 Q114 92 118 70 Q124 50 104 44 Q92 36 84 46 Z" fill="#868d95"/>' + color([[92,58],[104,52],[110,66],[98,74],[106,82],[90,70]], 3.4), 'CS 3–4'); }
  };
  A.RECORTE = { es: 'Recortada.', en: 'Cropped.', pt: 'Recortada.' };

  /* galería: items = [{img, c: clave de crédito, url?: enlace propio, t: {es:[título, texto], ...}}] */
  A.galeria = function (el, items) {
    el.innerHTML = items.map(function (x) {
      var c = A.CRED[x.c], u = x.url || c.url, t = x.t[A.lang];
      return '<figure><img src="img/' + x.img + '.jpg" alt="' + A.esc(t[0]) + '" loading="lazy">' +
        '<figcaption><b>' + A.esc(t[0]) + '</b>' + A.esc(t[1]) +
        '<span class="cred">' + (u ? '<a href="' + u + '" target="_blank" rel="noopener">' + A.esc(c.txt) + '</a>' : A.esc(c.txt)) + '. ' + A.RECORTE[A.lang] + '</span></figcaption></figure>';
    }).join('');
  };

  A.textos = function (UI) {
    var u = UI[A.lang];
    document.documentElement.lang = A.lang;
    document.querySelectorAll('[data-t]').forEach(function (n) { var k = n.getAttribute('data-t'); if (u[k]) n.textContent = u[k]; });
    document.querySelectorAll('.idi button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-l') === A.lang); });
    return u;
  };
  A.panel = function (el, titulo, parrafos, vacio) {
    if (!titulo) { el.innerHTML = '<p class="vacio">' + A.esc(vacio) + '</p>'; return; }
    el.innerHTML = '<h3>' + A.esc(titulo) + '</h3>' + parrafos.map(function (p) { return '<p>' + A.esc(p) + '</p>'; }).join('');
  };
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(function () {});
})();
