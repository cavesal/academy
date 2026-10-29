/* CaVeSal® Academy — Medical Education
   Sitio puente: lee las guías espejadas (data/) de Historia Clínica y Emergencias.
   Nadie edita data/ a mano: lo genera scripts/espejo.mjs cada día. */
(function () {
  'use strict';

  /* ================= configuración ================= */
  var LICENSE_API = 'https://script.google.com/macros/s/AKfycbzMHJG48y5W0sIadQxrrFx78Toge2FRBIMRDqKe5GQmvmnpDory1ftALVfJCvZX2WK6/exec';
  var GUMROAD = 'https://cavesal.gumroad.com/l/cavesal';
  var K_LIC = 'cavesal_academy_licencia';
  var K_CLAVE = 'cavesal_academy_clave';
  var K_LANG = 'cavesal_academy_lang';
  // claves Full ya activadas en las otras apps del mismo dominio (cavesal.app)
  var CLAVES_APPS = ['cavesal_full_unlocked', 'cavesal_emerg_full_unlocked', 'cavesal_hc_full_unlocked'];
  var REVERIFICAR_MS = 3 * 864e5;
  var GRACIA_MS = 7 * 864e5;
  var APPS = {
    calc: 'https://cavesal.app/full/',
    hc: 'https://historia.cavesal.app/',
    em: 'https://cavesal.app/cavesal-emergencias/full/'
  };

  /* ================= textos de la interfaz ================= */
  var T = {
    es: {
      lema: 'Medical Education', navHC: 'Guías HC', navEM: 'Emergencias', navBib: 'Biblioteca', navArt: 'Artículos', buscar: 'Buscar',
      offline: 'Sin conexión — estás viendo la última copia guardada de las guías.',
      pieTexto: 'Material de formación para profesionales de la salud. Las guías se mantienen en su app de origen y se copian aquí automáticamente.',
      sync: 'Guías sincronizadas el', inicio: 'Inicio',
      heroTit: 'Todas las guías CaVeSal® en un solo lugar',
      heroTxt: 'Historia Clínica y Emergencias Obstétricas, con un buscador común, la bibliografía completa y acceso directo a la literatura científica.',
      heroPh: 'Buscar en todas las guías (ej.: sulfato de magnesio, HELLP, Bishop)',
      secGuias: 'Guías', secHerr: 'Herramientas', secProx: 'Próximamente', secApps: 'Volver a mis apps',
      hcTit: 'Guías de Historia Clínica', hcTxt: 'Referencia completa de la Historia Clínica: obstetricia, ginecología, preconcepcional y estudios.',
      emTit: 'Guías de Emergencias Obstétricas', emTxt: 'Protocolos por código y pestaña, con tablas, algoritmos y fuentes.',
      guias: 'guías', capitulos: 'capítulos', fichas: 'fichas', pestanas: 'pestañas',
      busTit: 'Buscador común', busTxt: 'Busca a la vez en Historia Clínica y Emergencias.',
      bibTit: 'Biblioteca', bibTxt: 'Bibliografía completa de cada app, con enlaces a las fuentes.',
      artTit: 'Artículos científicos', artTxt: 'Busca en PubMed, Consensus y Google Académico.',
      atlasTit: 'Atlas médico', atlasTxt: 'Ecografía ginecológica: IETA, IOTA, O-RADS y MUSA, con imágenes y clasificaciones.',
      clasTit: 'Tablas y clasificaciones', clasTxt: 'Escalas y clasificaciones de consulta rápida, con su fuente.',
      calc: 'Calculadora Prenatal', hc: 'Historia Clínica', em: 'Emergencias Obstétricas',
      hcBajada: 'Elegí un capítulo. El contenido es el mismo que el de la Historia Clínica, en el idioma seleccionado.',
      emBajada: 'Las 16 pestañas de la guía de Emergencias Obstétricas, con el color de cada código.',
      indice: 'Índice', otrosCap: 'Otros capítulos', otrasPest: 'Otras pestañas', irA: 'Ir a…',
      soloEs: 'Las guías de Emergencias están disponibles solo en español.',
      origenHC: 'Copia fiel de las guías de la Historia Clínica CaVeSal®.',
      origenEM: 'Copia fiel de la guía de Emergencias Obstétricas CaVeSal®.',
      verOriginal: 'Ver en la app original',
      busPh: 'Escribí un término clínico', todo: 'Todo', resultados: 'resultados', resultado: 'resultado',
      sinRes: 'No encontramos coincidencias. Probá con otro término o buscá en artículos científicos.',
      escribe: 'Escribí al menos 2 letras para buscar.', buscarArt: 'Buscar en artículos',
      bibBajada: 'Fuentes académicas, guías internacionales y normativas que respaldan cada app.',
      bibHC: 'Bibliografía — Historia Clínica', bibEM: 'Bibliografía — Emergencias Obstétricas',
      artBajada: 'Escribí el tema y elegí dónde buscar. Se abre en una pestaña nueva. Para más resultados, escribí en inglés.',
      artPh: 'Ej.: magnesium sulfate neuroprotection preterm',
      pubmed: 'Literatura biomédica indexada (NLM / NIH).', consensus: 'Respuestas basadas en estudios, con resumen de la evidencia.', scholar: 'Artículos, tesis, libros y citas.',
      accTit: 'Acceso para profesionales con versión Full',
      accTxt: 'Academy está incluida en cualquier versión Full de CaVeSal®: Calculadora Prenatal, Historia Clínica o Emergencias Obstétricas. Si ya activaste una de ellas en este dispositivo, entrás directamente.',
      accPh: 'Tu clave de licencia', accBtn: 'Entrar', accComprobando: 'Comprobando…',
      accNoTiene: '¿Todavía no tenés una versión Full?', accVer: 'Ver opciones',
      accHC: 'Desde la Historia Clínica, el botón Academy abre este sitio con tu clave.',
      mNoExiste: 'No encontramos esa clave. Revisá que esté completa.',
      mNoActivada: 'Esta clave todavía no se activó. Activala primero en su app (Calculadora, Historia Clínica o Emergencias) y después volvé.',
      mIA: 'Las claves de CaVeSal® IA no incluyen Academy. Usá la clave de tu Calculadora, Historia Clínica o Emergencias.',
      mVencida: 'Tu plan anual venció el {f}. Renovalo para seguir usando Academy.',
      mError: 'No pudimos comprobar la clave. Revisá tu conexión e intentá de nuevo.',
      mVacia: 'Escribí tu clave.', renovar: 'Renovar plan',
      avisoVence: 'Tu plan anual vence el {f}.', noEncontrado: 'No encontramos esa página.', cargando: 'Cargando…', errorDatos: 'No pudimos cargar las guías. Revisá tu conexión.',
      salir: 'Cerrar sesión en este dispositivo'
    },
    en: {
      lema: 'Medical Education', navHC: 'HC Guides', navEM: 'Emergencies', navBib: 'Library', navArt: 'Articles', buscar: 'Search',
      offline: 'Offline — you are viewing the last saved copy of the guides.',
      pieTexto: 'Training material for health professionals. Guides are maintained in their source app and copied here automatically.',
      sync: 'Guides synced on', inicio: 'Home',
      heroTit: 'All CaVeSal® guides in one place',
      heroTxt: 'Clinical Record and Obstetric Emergencies, with a shared search, the complete bibliography and direct access to the scientific literature.',
      heroPh: 'Search all guides (e.g. magnesium sulfate, HELLP, Bishop)',
      secGuias: 'Guides', secHerr: 'Tools', secProx: 'Coming soon', secApps: 'Back to my apps',
      hcTit: 'Clinical Record guides', hcTxt: 'Full Clinical Record reference: obstetrics, gynecology, preconception and tests.',
      emTit: 'Obstetric Emergencies guides', emTxt: 'Protocols by code and tab, with tables, algorithms and sources.',
      guias: 'guides', capitulos: 'chapters', fichas: 'cards', pestanas: 'tabs',
      busTit: 'Shared search', busTxt: 'Search Clinical Record and Emergencies at once.',
      bibTit: 'Library', bibTxt: 'Complete bibliography for each app, with links to sources.',
      artTit: 'Scientific articles', artTxt: 'Search PubMed, Consensus and Google Scholar.',
      atlasTit: 'Medical atlas', atlasTxt: 'Gynecologic ultrasound: IETA, IOTA, O-RADS and MUSA, with images and classifications.',
      clasTit: 'Tables and classifications', clasTxt: 'Quick-reference scores and classifications, with their source.',
      calc: 'Prenatal Calculator', hc: 'Clinical Record', em: 'Obstetric Emergencies',
      hcBajada: 'Choose a chapter. Content is the same as in the Clinical Record, in the selected language.',
      emBajada: 'The 16 tabs of the Obstetric Emergencies guide, with each code\'s color.',
      indice: 'Contents', otrosCap: 'Other chapters', otrasPest: 'Other tabs', irA: 'Go to…',
      soloEs: 'Emergency guides are available in Spanish only.',
      origenHC: 'Faithful copy of the CaVeSal® Clinical Record guides.',
      origenEM: 'Faithful copy of the CaVeSal® Obstetric Emergencies guide.',
      verOriginal: 'View in the original app',
      busPh: 'Type a clinical term', todo: 'All', resultados: 'results', resultado: 'result',
      sinRes: 'No matches found. Try another term or search scientific articles.',
      escribe: 'Type at least 2 letters to search.', buscarArt: 'Search articles',
      bibBajada: 'Academic sources, international guidelines and regulations behind each app.',
      bibHC: 'Bibliography — Clinical Record', bibEM: 'Bibliography — Obstetric Emergencies',
      artBajada: 'Type a topic and choose where to search. It opens in a new tab.',
      artPh: 'E.g. magnesium sulfate neuroprotection preterm',
      pubmed: 'Indexed biomedical literature (NLM / NIH).', consensus: 'Study-based answers with an evidence summary.', scholar: 'Articles, theses, books and citations.',
      accTit: 'Access for professionals with a Full version',
      accTxt: 'Academy is included in any CaVeSal® Full version: Prenatal Calculator, Clinical Record or Obstetric Emergencies. If you already activated one on this device, you get in directly.',
      accPh: 'Your license key', accBtn: 'Enter', accComprobando: 'Checking…',
      accNoTiene: 'No Full version yet?', accVer: 'See options',
      accHC: 'From the Clinical Record, the Academy button opens this site with your key.',
      mNoExiste: 'We could not find that key. Check that it is complete.',
      mNoActivada: 'This key has not been activated yet. Activate it in its app first (Calculator, Clinical Record or Emergencies) and come back.',
      mIA: 'CaVeSal® AI keys do not include Academy. Use your Calculator, Clinical Record or Emergencies key.',
      mVencida: 'Your annual plan expired on {f}. Renew it to keep using Academy.',
      mError: 'We could not check the key. Check your connection and try again.',
      mVacia: 'Type your key.', renovar: 'Renew plan',
      avisoVence: 'Your annual plan expires on {f}.', noEncontrado: 'Page not found.', cargando: 'Loading…', errorDatos: 'We could not load the guides. Check your connection.',
      salir: 'Sign out on this device'
    },
    pt: {
      lema: 'Medical Education', navHC: 'Guias HC', navEM: 'Emergências', navBib: 'Biblioteca', navArt: 'Artigos', buscar: 'Buscar',
      offline: 'Sem conexão — você está vendo a última cópia salva das guias.',
      pieTexto: 'Material de formação para profissionais de saúde. As guias são mantidas no app de origem e copiadas aqui automaticamente.',
      sync: 'Guias sincronizadas em', inicio: 'Início',
      heroTit: 'Todas as guias CaVeSal® em um só lugar',
      heroTxt: 'Prontuário Clínico e Emergências Obstétricas, com busca comum, a bibliografia completa e acesso direto à literatura científica.',
      heroPh: 'Buscar em todas as guias (ex.: sulfato de magnésio, HELLP, Bishop)',
      secGuias: 'Guias', secHerr: 'Ferramentas', secProx: 'Em breve', secApps: 'Voltar aos meus apps',
      hcTit: 'Guias do Prontuário Clínico', hcTxt: 'Referência completa do Prontuário: obstetrícia, ginecologia, pré-concepção e exames.',
      emTit: 'Guias de Emergências Obstétricas', emTxt: 'Protocolos por código e aba, com tabelas, algoritmos e fontes.',
      guias: 'guias', capitulos: 'capítulos', fichas: 'fichas', pestanas: 'abas',
      busTit: 'Busca comum', busTxt: 'Busque ao mesmo tempo no Prontuário e em Emergências.',
      bibTit: 'Biblioteca', bibTxt: 'Bibliografia completa de cada app, com links para as fontes.',
      artTit: 'Artigos científicos', artTxt: 'Busque no PubMed, Consensus e Google Acadêmico.',
      atlasTit: 'Atlas médico', atlasTxt: 'Ultrassom ginecológico: IETA, IOTA, O-RADS e MUSA, com imagens e classificações.',
      clasTit: 'Tabelas e classificações', clasTxt: 'Escalas e classificações de consulta rápida, com sua fonte.',
      calc: 'Calculadora Pré-natal', hc: 'Prontuário Clínico', em: 'Emergências Obstétricas',
      hcBajada: 'Escolha um capítulo. O conteúdo é o mesmo do Prontuário Clínico, no idioma selecionado.',
      emBajada: 'As 16 abas da guia de Emergências Obstétricas, com a cor de cada código.',
      indice: 'Índice', otrosCap: 'Outros capítulos', otrasPest: 'Outras abas', irA: 'Ir para…',
      soloEs: 'As guias de Emergências estão disponíveis apenas em espanhol.',
      origenHC: 'Cópia fiel das guias do Prontuário Clínico CaVeSal®.',
      origenEM: 'Cópia fiel da guia de Emergências Obstétricas CaVeSal®.',
      verOriginal: 'Ver no app original',
      busPh: 'Digite um termo clínico', todo: 'Tudo', resultados: 'resultados', resultado: 'resultado',
      sinRes: 'Nenhum resultado. Tente outro termo ou busque em artigos científicos.',
      escribe: 'Digite pelo menos 2 letras para buscar.', buscarArt: 'Buscar em artigos',
      bibBajada: 'Fontes acadêmicas, diretrizes internacionais e normas que respaldam cada app.',
      bibHC: 'Bibliografia — Prontuário Clínico', bibEM: 'Bibliografia — Emergências Obstétricas',
      artBajada: 'Digite o tema e escolha onde buscar. Abre em uma nova aba. Para mais resultados, escreva em inglês.',
      artPh: 'Ex.: magnesium sulfate neuroprotection preterm',
      pubmed: 'Literatura biomédica indexada (NLM / NIH).', consensus: 'Respostas baseadas em estudos, com resumo da evidência.', scholar: 'Artigos, teses, livros e citações.',
      accTit: 'Acesso para profissionais com versão Full',
      accTxt: 'O Academy está incluído em qualquer versão Full da CaVeSal®: Calculadora Pré-natal, Prontuário Clínico ou Emergências Obstétricas. Se você já ativou uma delas neste dispositivo, entra diretamente.',
      accPh: 'Sua chave de licença', accBtn: 'Entrar', accComprobando: 'Verificando…',
      accNoTiene: 'Ainda não tem uma versão Full?', accVer: 'Ver opções',
      accHC: 'No Prontuário Clínico, o botão Academy abre este site com sua chave.',
      mNoExiste: 'Não encontramos essa chave. Verifique se está completa.',
      mNoActivada: 'Esta chave ainda não foi ativada. Ative-a primeiro no seu app (Calculadora, Prontuário ou Emergências) e depois volte.',
      mIA: 'As chaves da CaVeSal® IA não incluem o Academy. Use a chave da Calculadora, Prontuário ou Emergências.',
      mVencida: 'Seu plano anual venceu em {f}. Renove-o para continuar usando o Academy.',
      mError: 'Não foi possível verificar a chave. Verifique sua conexão e tente novamente.',
      mVacia: 'Digite sua chave.', renovar: 'Renovar plano',
      avisoVence: 'Seu plano anual vence em {f}.', noEncontrado: 'Página não encontrada.', cargando: 'Carregando…', errorDatos: 'Não foi possível carregar as guias. Verifique sua conexão.',
      salir: 'Sair neste dispositivo'
    }
  };

  /* ================= utilidades ================= */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var vista = $('#vista');
  var lang = (function () {
    var l = '';
    try { l = localStorage.getItem(K_LANG) || ''; } catch (e) {}
    if (!T[l]) l = (navigator.language || 'es').slice(0, 2);
    return T[l] ? l : 'es';
  })();
  function t(k) { return (T[lang] && T[lang][k]) || T.es[k] || k; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function ls(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function fecha(iso) {
    var d = new Date(iso); if (isNaN(d)) return iso || '';
    return d.toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'pt' ? 'pt-BR' : 'es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function enlaceVolver(href, txt) { return '<a href="' + href + '">' + esc(txt) + '</a>'; }
  function migas(items) {
    return '<nav class="migas" aria-label="Ruta">' + [enlaceVolver('#/', t('inicio'))].concat(items).join('<span aria-hidden="true">›</span>') + '</nav>';
  }

  /* ================= datos ================= */
  var memo = {};
  function cargar(nombre) {
    if (!memo[nombre]) {
      memo[nombre] = fetch('data/' + nombre).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return /\.css$/.test(nombre) ? r.text() : r.json();
      }).catch(function (e) { delete memo[nombre]; throw e; });
    }
    return memo[nombre];
  }
  function hoja(nombre) {
    var id = 'hoja-' + nombre.replace(/\W/g, '');
    if (document.getElementById(id)) return Promise.resolve();
    return cargar(nombre).then(function (css) {
      if (document.getElementById(id)) return;
      var s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s);
    });
  }
  var version = null;
  function cargarVersion() {
    return cargar('version.json').then(function (v) {
      version = v;
      var p = $('#pie-sync'); if (p && v.actualizado) p.textContent = t('sync') + ' ' + fecha(v.actualizado);
      return v;
    }).catch(function () { return null; });
  }

  /* ================= licencia ================= */
  function leerEstado() { try { return JSON.parse(ls(K_LIC)) || null; } catch (e) { return null; } }
  function guardarEstado(e) { ls(K_LIC, JSON.stringify(e)); }
  function anualVencida(e) { return !!(e && e.plan === 'anual' && e.vence && Date.parse(e.vence) + GRACIA_MS < Date.now()); }
  function clavesApps() {
    var out = [];
    CLAVES_APPS.forEach(function (k) { var v = (ls(k) || '').trim(); if (v.length > 3 && v !== 'true' && v !== '1' && out.indexOf(v) < 0) out.push(v); });
    return out;
  }
  function candidatas() {
    var out = []; var e = leerEstado();
    var manual = (ls(K_CLAVE) || '').trim();
    if (manual) out.push(manual);
    if (e && e.clave && out.indexOf(e.clave) < 0) out.push(e.clave);
    clavesApps().forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  function consultar(clave) {
    var u = LICENSE_API + '?clave=' + encodeURIComponent(clave) + '&accion=verificar&producto=academy';
    var ctrl = window.AbortController ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);
    return fetch(u, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json(); })
      .finally(function () { clearTimeout(to); });
  }
  function interpretar(d) {
    if (!d || typeof d !== 'object') return { ok: false, motivo: 'error' };
    var prod = String(d.producto || '').toLowerCase();
    if (prod === 'ia' || prod === 'ia_recarga' || d.mensaje === 'no_aplica') return { ok: false, motivo: 'ia' };
    if (d.valido === true || d.valido === 'true') {
      var e = { ok: true, plan: d.plan || 'vida', vence: d.vence || null };
      if (anualVencida(e)) return { ok: false, motivo: 'vencida', vence: d.vence };
      return e;
    }
    if (d.mensaje === 'ya_usada') return { ok: true, plan: d.plan || 'vida', vence: d.vence || null }; // compatibilidad con el script anterior
    if (d.mensaje === 'no_activada') return { ok: false, motivo: 'no_activada' };
    if (d.mensaje === 'vencida') return { ok: false, motivo: 'vencida', vence: d.vence };
    return { ok: false, motivo: 'no_existe' };
  }
  // Devuelve {ok, motivo?, vence?}
  function comprobarAcceso() {
    var e = leerEstado();
    if (e && e.ok && anualVencida(e)) return Promise.resolve({ ok: false, motivo: 'vencida', vence: e.vence });
    if (e && e.ok && Date.now() - (e.t || 0) < REVERIFICAR_MS) return Promise.resolve({ ok: true });
    if (!navigator.onLine) {
      if (e && e.ok) return Promise.resolve({ ok: true });
      if (clavesApps().length) return Promise.resolve({ ok: true, provisorio: true });
      return Promise.resolve({ ok: false });
    }
    var lista = candidatas();
    var ultimo = { ok: false };
    var fallaRed = false;
    function probar(i) {
      if (i >= lista.length) {
        if (fallaRed && ((e && e.ok) || clavesApps().length)) return { ok: true, provisorio: true };
        return ultimo;
      }
      var c = lista[i];
      return consultar(c).then(function (d) {
        var r = interpretar(d);
        if (r.ok) {
          guardarEstado({ clave: c, ok: true, plan: r.plan, vence: r.vence, t: Date.now() });
          return { ok: true };
        }
        if (e && e.clave === c) guardarEstado({ clave: c, ok: false, motivo: r.motivo, vence: r.vence || e.vence || null, t: Date.now() });
        if (i === 0 || ultimo.motivo !== 'vencida') ultimo = r;
        return probar(i + 1);
      }, function () { fallaRed = true; return probar(i + 1); });
    }
    return Promise.resolve(probar(0));
  }
  function mensajeMotivo(r) {
    switch (r && r.motivo) {
      case 'no_activada': return t('mNoActivada');
      case 'ia': return t('mIA');
      case 'vencida': return t('mVencida').replace('{f}', fecha(r.vence));
      case 'error': return t('mError');
      case 'no_existe': return t('mNoExiste');
      default: return '';
    }
  }

  /* clave y/o idioma que llegan en el enlace (desde la Historia Clínica): #k=CLAVE&lang=xx */
  (function leerEnlace() {
    var h = location.hash.replace(/^#\/?\??/, '');
    if (!/(^|&)(k|lang)=/.test(h)) return;
    var p = new URLSearchParams(h);
    var k = (p.get('k') || '').trim();
    var l = (p.get('lang') || '').trim().toLowerCase();
    if (k) {
      ls(K_CLAVE, k);
      var e = leerEstado();
      if (!e || e.clave !== k) guardarEstado({ clave: k, ok: false, t: 0 });
    }
    if (T[l]) { lang = l; ls(K_LANG, l); }
    history.replaceState(null, '', location.pathname + location.search + '#/');
  })();

  /* ================= interfaz general ================= */
  function aplicarIdioma() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    document.querySelectorAll('[data-ta]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-ta'))); });
    var s = $('#sel-lang'); if (s) s.value = lang;
    if (version) { var p = $('#pie-sync'); if (p) p.textContent = t('sync') + ' ' + fecha(version.actualizado); }
  }
  function marcarNav(seccion) {
    document.querySelectorAll('.top-nav a').forEach(function (a) {
      if (a.getAttribute('href') === '#/' + seccion) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function estadoRed() { var a = $('#aviso-offline'); if (a) a.hidden = navigator.onLine; }
  window.addEventListener('online', estadoRed);
  window.addEventListener('offline', estadoRed);

  $('#sel-lang').addEventListener('change', function () {
    lang = this.value; ls(K_LANG, lang); aplicarIdioma(); render();
  });
  $('#btn-buscar').addEventListener('click', function () {
    if (/^#\/buscar/.test(location.hash)) { var i = $('#q'); if (i) i.focus(); }
    else location.hash = '#/buscar';
  });

  function cargando() { vista.innerHTML = '<div class="cargando" role="status">' + esc(t('cargando')) + '</div>'; }
  function error() { vista.innerHTML = '<div class="vacio">' + esc(t('errorDatos')) + '</div>'; }
  function noEncontrado() { vista.innerHTML = migas([]) + '<div class="vacio">' + esc(t('noEncontrado')) + '</div>'; }

  function irAncla(id) {
    if (!id) { window.scrollTo(0, 0); return; }
    requestAnimationFrame(function () {
      var el = document.getElementById(id);
      if (!el) { window.scrollTo(0, 0); return; }
      el.scrollIntoView({ block: 'start' });
      el.classList.remove('destello'); void el.offsetWidth; el.classList.add('destello');
    });
  }

  /* ================= router ================= */
  function ruta() {
    var h = location.hash.replace(/^#\/?/, '');
    var i = h.indexOf('?');
    var path = i >= 0 ? h.slice(0, i) : h;
    var qs = i >= 0 ? h.slice(i + 1) : '';
    return { partes: path.split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } }), q: new URLSearchParams(qs) };
  }

  var acceso = null; // resultado de comprobarAcceso
  var ultimaVista = '';
  function render() {
    if (!acceso || !acceso.ok) { marcarNav(''); vistaAcceso(acceso); return; }
    var r = ruta(); var p = r.partes;
    marcarNav(p[0] || '');
    switch (p[0]) {
      case undefined: case '': return vistaInicio();
      case 'hc': return vistaHC(p);
      case 'emergencias': return vistaEM(p);
      case 'buscar': return vistaBuscar(r.q);
      case 'biblioteca': return vistaBiblioteca(p);
      case 'articulos': return vistaArticulos(r.q);
      default: return noEncontrado();
    }
  }
  window.addEventListener('hashchange', render);

  /* ================= acceso ================= */
  function vistaAcceso(r) {
    ultimaVista = '';
    var msg = r ? mensajeMotivo(r) : '';
    var renovar = r && r.motivo === 'vencida';
    vista.innerHTML =
      '<section class="acceso">' +
      '<img src="img/academy-logo.jpg" alt="CaVeSal® Academy — Medical Education" width="284" height="210">' +
      '<h1>' + esc(t('accTit')) + '</h1>' +
      '<p>' + esc(t('accTxt')) + '</p>' +
      '<form id="f-acceso" autocomplete="off">' +
      '<label class="sr" for="clave">' + esc(t('accPh')) + '</label>' +
      '<input class="campo" id="clave" name="clave" placeholder="' + esc(t('accPh')) + '" autocapitalize="characters" spellcheck="false" required>' +
      '<button class="btn btn-teal" type="submit">' + esc(t('accBtn')) + '</button>' +
      '</form>' +
      '<p class="msg' + (msg ? ' err' : '') + '" id="acc-msg" role="status">' + esc(msg) + '</p>' +
      (renovar ? '<a class="btn btn-navy" href="' + GUMROAD + '" target="_blank" rel="noopener">' + esc(t('renovar')) + '</a>' : '') +
      '<small>' + esc(t('accNoTiene')) + ' <a href="' + GUMROAD + '" target="_blank" rel="noopener">' + esc(t('accVer')) + '</a></small>' +
      '<small>' + esc(t('accHC')) + '</small>' +
      '</section>';
    $('#f-acceso').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var c = $('#clave').value.trim();
      var m = $('#acc-msg');
      if (!c) { m.className = 'msg err'; m.textContent = t('mVacia'); return; }
      m.className = 'msg'; m.textContent = t('accComprobando');
      consultar(c).then(function (d) {
        var res = interpretar(d);
        if (res.ok) {
          ls(K_CLAVE, c);
          guardarEstado({ clave: c, ok: true, plan: res.plan, vence: res.vence, t: Date.now() });
          acceso = { ok: true }; render();
        } else { m.className = 'msg err'; m.textContent = mensajeMotivo(res); }
      }, function () { m.className = 'msg err'; m.textContent = t('mError'); });
    });
  }

  /* ================= inicio ================= */
  function tarjeta(href, titulo, texto, meta, extra) {
    var tag = href ? 'a' : 'div';
    return '<' + tag + (href ? ' href="' + href + '"' : '') + ' class="tarjeta' + (extra || '') + '">' +
      '<h3>' + esc(titulo) + '</h3><p>' + esc(texto) + '</p>' + (meta ? '<span class="meta">' + meta + '</span>' : '') + '</' + tag + '>';
  }
  function vistaInicio() {
    ultimaVista = '';
    var c = (version && version.conteos) || { hc: { capitulos: 4, guias: 179 }, emergencias: { pestanas: 16, fichas: 192 } };
    var e = leerEstado(); var aviso = '';
    if (e && e.ok && e.plan === 'anual' && e.vence && Date.parse(e.vence) - Date.now() < 15 * 864e5) {
      aviso = '<div class="aviso-es">' + esc(t('avisoVence').replace('{f}', fecha(e.vence))) + ' <a href="' + GUMROAD + '" target="_blank" rel="noopener">' + esc(t('renovar')) + '</a></div>';
    }
    vista.innerHTML = aviso +
      '<section class="hero">' +
      '<div><span class="eyebrow">CaVeSal® Academy · Medical Education</span>' +
      '<h1>' + esc(t('heroTit')) + '</h1><p>' + esc(t('heroTxt')) + '</p>' +
      '<form class="hero-busca" id="f-hero" role="search"><label class="sr" for="q-hero">' + esc(t('buscar')) + '</label>' +
      '<input class="campo" id="q-hero" type="search" placeholder="' + esc(t('heroPh')) + '">' +
      '<button class="btn btn-teal" type="submit">' + esc(t('buscar')) + '</button></form></div>' +
      '<img src="img/academy-portada.jpg" alt="CaVeSal® Academy — Medical Education" width="1536" height="1024">' +
      '</section>' +
      '<h2 class="seccion">' + esc(t('secGuias')) + '</h2><div class="grid">' +
      tarjeta('#/hc', t('hcTit'), t('hcTxt'), c.hc.guias + ' ' + t('guias') + ' · ' + c.hc.capitulos + ' ' + t('capitulos') + ' · ES · EN · PT') +
      tarjeta('#/emergencias', t('emTit'), t('emTxt'), c.emergencias.fichas + ' ' + t('fichas') + ' · ' + c.emergencias.pestanas + ' ' + t('pestanas') + ' · ES', ' tab-em c-rojo') +
      '</div>' +
      '<h2 class="seccion">' + esc(t('secHerr')) + '</h2><div class="grid">' +
      tarjeta('#/buscar', t('busTit'), t('busTxt')) +
      tarjeta('#/biblioteca', t('bibTit'), t('bibTxt')) +
      tarjeta('#/articulos', t('artTit'), t('artTxt'), 'PubMed · Consensus · Google Scholar') +
      '</div>' +
      '<h2 class="seccion">' + esc(t('secProx')) + '</h2><div class="grid">' +
      tarjeta('', t('atlasTit'), t('atlasTxt'), 'IETA · IOTA · O-RADS · MUSA', ' prox') +
      tarjeta('', t('clasTit'), t('clasTxt'), '', ' prox') +
      '</div>' +
      '<h2 class="seccion">' + esc(t('secApps')) + '</h2><div class="grid">' +
      '<a class="tarjeta" href="' + APPS.calc + '"><h3>' + esc(t('calc')) + '</h3><span class="meta">cavesal.app/full</span></a>' +
      '<a class="tarjeta" href="' + APPS.hc + '"><h3>' + esc(t('hc')) + '</h3><span class="meta">historia.cavesal.app</span></a>' +
      '<a class="tarjeta" href="' + APPS.em + '"><h3>' + esc(t('em')) + '</h3><span class="meta">cavesal.app/cavesal-emergencias</span></a>' +
      '</div>';
    $('#f-hero').addEventListener('submit', function (ev) {
      ev.preventDefault();
      location.hash = '#/buscar?q=' + encodeURIComponent($('#q-hero').value.trim());
    });
    window.scrollTo(0, 0);
  }

  /* ================= Historia Clínica ================= */
  function datosHC() { return Promise.all([cargar('hc-' + lang + '.json'), hoja('hc.css')]).then(function (r) { return r[0]; }); }
  function contar(cap) { return cap.guias.length + ' ' + t('guias'); }
  function vistaHC(p) {
    if (p[1] === 'g' && p[2] && ultimaVista.indexOf('hc/') === 0 && ultimaVista.slice(-3) === '|' + lang && document.getElementById(p[2])) { irAncla(p[2]); return; }
    cargando();
    datosHC().then(function (d) {
      if (!p[1]) {
        ultimaVista = '';
        vista.innerHTML = migas([enlaceVolver('#/hc', t('hcTit'))]) +
          '<h1>' + esc(t('hcTit')) + '</h1><p class="bajada">' + esc(t('hcBajada')) + '</p><div class="grid">' +
          d.capitulos.map(function (c) {
            return tarjeta('#/hc/c/' + c.id, c.nombre, c.guias.slice(0, 4).map(function (g) { return g.titulo; }).join(' · ') + '…', contar(c));
          }).join('') + '</div>';
        window.scrollTo(0, 0); return;
      }
      var cap = null, ancla = null;
      if (p[1] === 'c') cap = d.capitulos.find(function (c) { return c.id === p[2]; });
      if (p[1] === 'g') {
        cap = d.capitulos.find(function (c) { return c.guias.some(function (g) { return g.id === p[2]; }); });
        ancla = p[2];
      }
      if (!cap) return noEncontrado();
      vista.innerHTML = migas([enlaceVolver('#/hc', t('hcTit')), esc(cap.nombre)]) +
        '<div class="lectura">' +
        '<aside class="indice" aria-label="' + esc(t('indice')) + '"><h2>' + esc(t('indice')) + '</h2><ol>' +
        cap.guias.map(function (g) { return '<li><a href="#/hc/g/' + g.id + '">' + esc(g.titulo) + '</a></li>'; }).join('') + '</ol>' +
        '<details><summary>' + esc(t('otrosCap')) + '</summary><ol>' +
        d.capitulos.filter(function (c) { return c.id !== cap.id; }).map(function (c) { return '<li><a href="#/hc/c/' + c.id + '">' + esc(c.nombre) + '</a></li>'; }).join('') +
        '</ol></details></aside>' +
        '<div><div class="indice-movil"><label class="sr" for="sel-guia">' + esc(t('irA')) + '</label><select class="campo" id="sel-guia"><option value="">' + esc(t('irA')) + '</option>' +
        cap.guias.map(function (g) { return '<option value="' + g.id + '">' + esc(g.titulo) + '</option>'; }).join('') + '</select></div>' +
        '<h1>' + esc(cap.nombre) + '</h1><p class="bajada">' + esc(contar(cap)) + '</p>' +
        '<div class="hc-src">' +
        cap.guias.map(function (g) {
          return '<section class="guide" id="' + g.id + '"><h3>' + esc(g.titulo) + '</h3>' + (g.fuente ? '<p class="source">' + esc(g.fuente) + '</p>' : '') + '<div class="body">' + g.html + '</div></section>';
        }).join('') + '</div>' +
        '<p class="origen">' + esc(t('origenHC')) + ' <a href="' + esc(d.fuente || APPS.hc) + '" target="_blank" rel="noopener">' + esc(t('verOriginal')) + '</a></p>' +
        '</div></div>';
      var sel = $('#sel-guia');
      sel.addEventListener('change', function () { if (this.value) location.hash = '#/hc/g/' + this.value; });
      // la ruta de capítulo y la de guía del mismo capítulo comparten la página ya pintada
      ultimaVista = 'hc/' + cap.id + '|' + lang;
      irAncla(ancla);
    }, error);
  }

  /* ================= Emergencias ================= */
  function datosEM() { return Promise.all([cargar('emergencias-es.json'), hoja('emergencias.css')]).then(function (r) { return r[0]; }); }
  function vistaEM(p) {
    if (p[1] && p[2] && ultimaVista === 'emergencias/' + p[1] && document.getElementById(p[2])) { irAncla(p[2]); return; }
    cargando();
    datosEM().then(function (d) {
      var aviso = lang !== 'es' ? '<div class="aviso-es">' + esc(t('soloEs')) + '</div>' : '';
      if (!p[1]) {
        ultimaVista = '';
        vista.innerHTML = migas([enlaceVolver('#/emergencias', t('emTit'))]) + aviso +
          '<h1>' + esc(t('emTit')) + '</h1><p class="bajada">' + esc(t('emBajada')) + '</p><div class="grid">' +
          d.grupos.map(function (g) { return tarjeta('#/emergencias/' + g.id, g.nombre, g.bajada || '', g.fichas.length + ' ' + t('fichas'), ' tab-em c-' + g.color); }).join('') + '</div>';
        window.scrollTo(0, 0); return;
      }
      var g = d.grupos.find(function (x) { return x.id === p[1]; });
      if (!g) return noEncontrado();
      vista.innerHTML = migas([enlaceVolver('#/emergencias', t('emTit')), esc(g.nombre)]) +
        '<div class="lectura">' +
        '<aside class="indice" aria-label="' + esc(t('indice')) + '"><h2>' + esc(t('indice')) + '</h2><ol>' +
        g.fichas.map(function (f) { return '<li><a href="#/emergencias/' + g.id + '/' + f.id + '">' + esc(f.titulo) + '</a></li>'; }).join('') + '</ol>' +
        '<details><summary>' + esc(t('otrasPest')) + '</summary><ol>' +
        d.grupos.filter(function (x) { return x.id !== g.id; }).map(function (x) { return '<li><a href="#/emergencias/' + x.id + '">' + esc(x.nombre) + '</a></li>'; }).join('') +
        '</ol></details></aside>' +
        '<div><div class="indice-movil"><label class="sr" for="sel-ficha">' + esc(t('irA')) + '</label><select class="campo" id="sel-ficha"><option value="">' + esc(t('irA')) + '</option>' +
        g.fichas.map(function (f) { return '<option value="' + f.id + '">' + esc(f.titulo) + '</option>'; }).join('') + '</select></div>' +
        aviso +
        '<header class="cabecera-em c-' + g.color + '"><h1>' + esc(g.titulo || g.nombre) + '</h1>' + (g.bajada ? '<p>' + esc(g.bajada) + '</p>' : '') + '</header>' +
        '<div class="emg-src"><section class="demo-panel active">' + g.html + '</section></div>' +
        '<p class="origen">' + esc(t('origenEM')) + ' <a href="' + esc(d.fuente || APPS.em) + '" target="_blank" rel="noopener">' + esc(t('verOriginal')) + '</a></p>' +
        '</div></div>';
      $('#sel-ficha').addEventListener('change', function () { if (this.value) location.hash = '#/emergencias/' + g.id + '/' + this.value; });
      ultimaVista = 'emergencias/' + g.id;
      irAncla(p[2]);
    }, error);
  }

  /* ================= buscador ================= */
  var indices = {};
  function indice() {
    if (indices[lang]) return Promise.resolve(indices[lang]);
    var l = lang;
    return Promise.all([cargar('hc-' + l + '.json'), cargar('emergencias-es.json')]).then(function (r) {
      var items = [];
      r[0].capitulos.forEach(function (c) {
        c.guias.forEach(function (g) {
          items.push({ app: 'hc', titulo: g.titulo, grupo: c.nombre, texto: g.texto || '', href: '#/hc/g/' + g.id, nt: norm(g.titulo), nx: norm(g.texto), ng: norm(c.nombre) });
        });
      });
      r[1].grupos.forEach(function (gr) {
        gr.fichas.forEach(function (f) {
          items.push({ app: 'em', color: gr.color, titulo: f.titulo, grupo: gr.nombre, texto: f.texto || '', href: '#/emergencias/' + gr.id + '/' + f.id, nt: norm(f.titulo), nx: norm(f.texto), ng: norm(gr.nombre) });
        });
      });
      indices[l] = items; return items;
    });
  }
  function contarEn(h, n) { var c = 0, i = h.indexOf(n); while (i >= 0 && c < 20) { c++; i = h.indexOf(n, i + n.length); } return c; }
  function buscar(items, q, filtro) {
    var terms = norm(q).split(/[\s,;]+/).filter(function (x) { return x.length > 1; });
    if (!terms.length) return [];
    var frase = norm(q).trim();
    var out = [];
    items.forEach(function (it) {
      if (filtro !== 'todo' && it.app !== filtro) return;
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var tt = terms[i];
        var enT = it.nt.indexOf(tt) >= 0, enG = it.ng.indexOf(tt) >= 0, n = contarEn(it.nx, tt);
        if (!enT && !enG && !n) return;
        score += (enT ? 12 : 0) + (enG ? 3 : 0) + Math.min(n, 10);
      }
      if (terms.length > 1 && (it.nt.indexOf(frase) >= 0 || it.nx.indexOf(frase) >= 0)) score += 15;
      out.push({ it: it, score: score, terms: terms });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }
  function resaltar(txt, terms) {
    var n = norm(txt);
    if (n.length !== txt.length) return esc(txt);
    var marcas = new Array(txt.length);
    terms.forEach(function (tt) { var i = n.indexOf(tt); while (i >= 0) { for (var k = i; k < i + tt.length; k++) marcas[k] = 1; i = n.indexOf(tt, i + tt.length); } });
    var html = '', abierto = false;
    for (var i = 0; i < txt.length; i++) {
      if (marcas[i] && !abierto) { html += '<mark>'; abierto = true; }
      if (!marcas[i] && abierto) { html += '</mark>'; abierto = false; }
      html += esc(txt[i]);
    }
    return html + (abierto ? '</mark>' : '');
  }
  function fragmento(it, terms) {
    var pos = -1;
    for (var i = 0; i < terms.length && pos < 0; i++) pos = it.nx.indexOf(terms[i]);
    var txt = it.texto;
    if (it.nx.length !== txt.length) pos = -1;
    var ini = Math.max(0, pos < 0 ? 0 : pos - 80);
    var fin = Math.min(txt.length, ini + 240);
    var s = txt.slice(ini, fin);
    return (ini > 0 ? '…' : '') + resaltar(s, terms) + (fin < txt.length ? '…' : '');
  }
  function vistaBuscar(qs) {
    ultimaVista = '';
    var q = qs.get('q') || '';
    var filtro = qs.get('f') || 'todo';
    if (['todo', 'hc', 'em'].indexOf(filtro) < 0) filtro = 'todo';
    vista.innerHTML = migas([esc(t('buscar'))]) +
      '<div class="busca-fija"><form id="f-bus" role="search"><label class="sr" for="q">' + esc(t('buscar')) + '</label>' +
      '<input class="campo" id="q" type="search" value="' + esc(q) + '" placeholder="' + esc(t('busPh')) + '" autocomplete="off">' +
      '<button class="btn btn-teal" type="submit">' + esc(t('buscar')) + '</button></form>' +
      '<div class="filtros" role="group">' +
      [['todo', t('todo')], ['hc', t('hc')], ['em', t('em')]].map(function (f) {
        return '<button type="button" class="filtro" data-f="' + f[0] + '" aria-pressed="' + (f[0] === filtro) + '">' + esc(f[1]) + '</button>';
      }).join('') + '</div></div><div id="res"></div>';
    var inp = $('#q');
    function ir(nq, nf) { var h = '#/buscar?q=' + encodeURIComponent(nq) + (nf && nf !== 'todo' ? '&f=' + nf : ''); if (location.hash !== h) history.replaceState(null, '', h); }
    var timer;
    function pintar() {
      var cq = inp.value.trim(); var res = $('#res');
      if (cq.replace(/\s/g, '').length < 2) { res.innerHTML = '<p class="conteo">' + esc(t('escribe')) + '</p>'; return; }
      indice().then(function (items) {
        var r = buscar(items, cq, filtro);
        if (!r.length) {
          res.innerHTML = '<div class="vacio">' + esc(t('sinRes')) + '<br><br><a class="btn btn-line" href="#/articulos?q=' + encodeURIComponent(cq) + '">' + esc(t('buscarArt')) + '</a></div>';
          return;
        }
        var lim = r.slice(0, 80);
        res.innerHTML = '<p class="conteo" role="status">' + r.length + ' ' + esc(r.length === 1 ? t('resultado') : t('resultados')) + '</p><ol class="resultados">' +
          lim.map(function (x) {
            var it = x.it;
            return '<li class="resultado"><a href="' + it.href + '">' +
              '<span class="chip' + (it.app === 'em' ? ' em' : '') + '">' + esc(it.app === 'em' ? t('em') : t('hc')) + '</span> ' +
              '<span class="chip es">' + esc(it.grupo) + '</span>' +
              '<h3>' + resaltar(it.titulo, x.terms) + '</h3><p>' + fragmento(it, x.terms) + '</p></a></li>';
          }).join('') + '</ol>';
      }, function () { res.innerHTML = '<div class="vacio">' + esc(t('errorDatos')) + '</div>'; });
    }
    inp.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { ir(inp.value.trim(), filtro); pintar(); }, 220); });
    $('#f-bus').addEventListener('submit', function (ev) { ev.preventDefault(); ir(inp.value.trim(), filtro); pintar(); inp.blur(); });
    document.querySelectorAll('.filtro').forEach(function (b) {
      b.addEventListener('click', function () {
        filtro = b.getAttribute('data-f');
        document.querySelectorAll('.filtro').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        ir(inp.value.trim(), filtro); pintar();
      });
    });
    pintar();
    if (!q) inp.focus();
    window.scrollTo(0, 0);
  }

  /* ================= biblioteca ================= */
  function vistaBiblioteca(p) {
    if (!p[1]) {
      ultimaVista = '';
      vista.innerHTML = migas([esc(t('bibTit'))]) + '<h1>' + esc(t('bibTit')) + '</h1><p class="bajada">' + esc(t('bibBajada')) + '</p><div class="grid">' +
        tarjeta('#/biblioteca/hc', t('bibHC'), t('hcTxt'), 'ES · EN · PT') +
        tarjeta('#/biblioteca/emergencias', t('bibEM'), t('emTxt'), 'ES', ' tab-em c-rojo') + '</div>';
      window.scrollTo(0, 0); return;
    }
    var esHC = p[1] === 'hc';
    if (!esHC && p[1] !== 'emergencias') return noEncontrado();
    var key = 'biblio/' + p[1] + '|' + lang;
    if (p[2] && ultimaVista === key && document.getElementById(p[2])) { irAncla(p[2]); return; }
    cargando();
    var archivo = esHC ? 'biblio-hc-' + lang + '.json' : 'biblio-emergencias-es.json';
    Promise.all([cargar(archivo), hoja(esHC ? 'hc.css' : 'emergencias.css')]).then(function (r) {
      var aviso = (!esHC && lang !== 'es') ? '<div class="aviso-es">' + esc(t('soloEs')) + '</div>' : '';
      vista.innerHTML = migas([enlaceVolver('#/biblioteca', t('bibTit')), esc(esHC ? t('bibHC') : t('bibEM'))]) + aviso +
        '<div class="biblio ' + (esHC ? 'hc-src' : 'emg-src') + '">' + r[0].html + '</div>';
      ultimaVista = key;
      irAncla(p[2]);
    }, error);
  }

  /* ================= artículos ================= */
  function vistaArticulos(qs) {
    ultimaVista = '';
    var q = qs.get('q') || '';
    var motores = [
      ['PubMed', t('pubmed'), 'https://pubmed.ncbi.nlm.nih.gov/?term='],
      ['Consensus', t('consensus'), 'https://consensus.app/results/?q='],
      ['Google Scholar', t('scholar'), 'https://scholar.google.com/scholar?q=']
    ];
    vista.innerHTML = migas([esc(t('artTit'))]) + '<h1>' + esc(t('artTit')) + '</h1><p class="bajada">' + esc(t('artBajada')) + '</p>' +
      '<form id="f-art" class="hero-busca" role="search"><label class="sr" for="q-art">' + esc(t('artTit')) + '</label>' +
      '<input class="campo" id="q-art" type="search" value="' + esc(q) + '" placeholder="' + esc(t('artPh')) + '"></form>' +
      '<div class="motores">' + motores.map(function (m, i) {
        return '<button type="button" class="motor" data-i="' + i + '"><strong>' + esc(m[0]) + '</strong><span>' + esc(m[1]) + '</span></button>';
      }).join('') + '</div>';
    function abrir(i) {
      var v = $('#q-art').value.trim();
      if (!v) { $('#q-art').focus(); return; }
      window.open(motores[i][2] + encodeURIComponent(v), '_blank', 'noopener');
    }
    document.querySelectorAll('.motor').forEach(function (b) { b.addEventListener('click', function () { abrir(+b.getAttribute('data-i')); }); });
    $('#f-art').addEventListener('submit', function (ev) { ev.preventDefault(); abrir(0); });
    if (!q) $('#q-art').focus();
    window.scrollTo(0, 0);
  }

  /* ================= arranque ================= */
  aplicarIdioma();
  estadoRed();
  cargando();
  cargarVersion();
  comprobarAcceso().then(function (r) { acceso = r; render(); }, function () { acceso = { ok: false, motivo: 'error' }; render(); });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
