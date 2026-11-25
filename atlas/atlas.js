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
    ekem: { txt: 'Ekem · Wikimedia Commons · CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Hydrosalpinx_(left).jpg' }
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
