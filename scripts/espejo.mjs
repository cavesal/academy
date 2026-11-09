#!/usr/bin/env node
/* CaVeSal® Academy — Espejo automático de guías.
 *
 * Lee las guías PUBLICADAS de cada app y genera los archivos de data/.
 * Nadie edita data/ a mano: las guías se corrigen en su app de origen
 * (Historia Clínica o Emergencias) y este script las vuelve a copiar.
 *
 * Uso: npm install && node scripts/espejo.mjs
 * Lo corre GitHub Actions una vez por día y con el botón "Run workflow".
 */
import { parse } from "node-html-parser";
import postcss from "postcss";
import prefixer from "postcss-prefix-selector";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");
if (!existsSync(DATA)) mkdirSync(DATA);

const FUENTES = {
  hc: {
    base: "https://historia.cavesal.app/",
    guias: { es: "guias-clinicas.html", en: "guias-clinicas-en.html", pt: "guias-clinicas-pt.html" },
    biblio: { es: "bibliografia-completa.html", en: "bibliografia-completa-en.html", pt: "bibliografia-completa-pt.html" },
  },
  emergencias: {
    base: "https://cavesal.app/cavesal-emergencias/",
    guias: { es: "guia.html", en: "guia-en.html", pt: "guia-pt.html" }, // en/pt opcionales: si aún no están publicadas se omiten
    biblio: { es: "bibliografia.html", en: "bibliografia-en.html", pt: "bibliografia-pt.html" },
    css: "styles.css",
  },
  calculadora: {
    base: "https://cavesal.app/",
    guias: { es: "guia-calculadora.html", en: "guia-calculadora-en.html", pt: "guia-calculadora-pt.html" },
    biblio: { es: "bibliografia-calculadora.html", en: "bibliografia-calculadora-en.html", pt: "bibliografia-calculadora-pt.html" },
  },
};

/* ---------- utilidades ---------- */
async function bajar(url) {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": "CaVeSal-Academy-Espejo" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } catch (e) {
      if (intento === 3) throw new Error("No se pudo leer " + url + ": " + e.message);
      await new Promise((ok) => setTimeout(ok, 2000 * intento));
    }
  }
}
const limpiarTexto = (s) => s.replace(/\s+/g, " ").trim();
/* texto plano para el buscador, con espacio entre celdas, párrafos e ítems */
const textoDe = (nodo) => (nodo ? limpiarTexto(parse(nodo.innerHTML.replace(/<\/(td|th|p|li|div|tr|h\d|caption|dt|dd)>|<br\s*\/?>/gi, (m) => m + " ")).text) : "");
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);

/* Saneado: solo contenido. Sin scripts, formularios, botones ni eventos. */
const PROHIBIDAS = "script,style,iframe,object,embed,form,input,select,textarea,button,noscript,dialog,link,meta";
function sanear(nodo, base, reescribirAncla) {
  nodo.querySelectorAll(PROHIBIDAS).forEach((n) => n.remove());
  nodo.querySelectorAll("*").forEach((el) => {
    for (const a of Object.keys(el.attributes)) {
      if (/^on/i.test(a)) el.removeAttribute(a);
    }
    const href = el.getAttribute("href");
    if (href != null) {
      if (/^\s*javascript:/i.test(href)) el.removeAttribute("href");
      else if (href.startsWith("#")) {
        const nuevo = reescribirAncla(href.slice(1));
        if (nuevo) el.setAttribute("href", nuevo);
        else el.removeAttribute("href");
      } else {
        el.setAttribute("href", new URL(href, base).href);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
      }
    }
    const src = el.getAttribute("src");
    if (src != null) el.setAttribute("src", new URL(src, base).href);
  });
  return nodo;
}

/* CSS de la app de origen, encerrado en un contenedor para no pisar el diseño de Academy */
async function cssEncerrado(texto, prefijo) {
  const r = await postcss([
    prefixer({
      prefix: prefijo,
      transform(pref, sel, conPref) {
        if (/^(:root|html|body)$/.test(sel)) return pref;
        if (/^(html|body)\s+/.test(sel)) return sel.replace(/^(html|body)\s+/, pref + " ");
        return conPref;
      },
    }),
  ]).process(texto, { from: undefined });
  return r.css;
}

/* ---------- Historia Clínica ---------- */
async function espejoHC() {
  const f = FUENTES.hc;
  const salida = {};
  let cssHC = "";
  for (const [lang, archivo] of Object.entries(f.guias)) {
    const url = f.base + archivo;
    const html = await bajar(url);
    const doc = parse(html);
    if (!cssHC) cssHC = doc.querySelectorAll("style").map((s) => s.text).join("\n");

    const ids = new Set(doc.querySelectorAll("section.guide").map((s) => s.id));
    const ancla = (id) => (ids.has(id) ? "#/hc/g/" + id : null);

    const capitulos = [];
    let actual = null;
    // Recorre en orden: cada h2.section-chapter-title abre un capítulo
    doc.querySelectorAll("h2.section-chapter-title, section.guide").forEach((n) => {
      if (n.tagName === "H2") {
        actual = { id: n.id, nombre: limpiarTexto(n.text), guias: [] };
        capitulos.push(actual);
        return;
      }
      if (!actual) return;
      const body = n.querySelector(".body");
      if (!body) return;
      sanear(body, url, ancla);
      actual.guias.push({
        id: n.id,
        titulo: limpiarTexto(n.querySelector("h3")?.text || n.id),
        fuente: limpiarTexto(n.querySelector("p.source")?.text || ""),
        html: body.innerHTML.trim(),
        texto: textoDe(body),
      });
    });
    const total = capitulos.reduce((a, c) => a + c.guias.length, 0);
    if (total < 50) throw new Error(`HC ${lang}: solo ${total} guías — se cancela para no publicar un espejo roto`);
    salida[lang] = { app: "hc", idioma: lang, fuente: url, capitulos };
    console.log(`HC ${lang}: ${capitulos.length} capítulos, ${total} guías`);
  }

  const biblio = {};
  for (const [lang, archivo] of Object.entries(f.biblio)) {
    const url = f.base + archivo;
    const doc = parse(await bajar(url));
    const main = doc.querySelector("main");
    main.querySelector("#locked-msg")?.remove();
    const ids = new Set(main.querySelectorAll("[id]").map((e) => e.id));
    sanear(main, url, (id) => (ids.has(id) ? "#/biblioteca/hc/" + id : null));
    biblio[lang] = { app: "hc", idioma: lang, fuente: url, html: main.innerHTML.trim() };
  }
  return { guias: salida, biblio, css: await cssEncerrado(cssHC, ".hc-src") };
}

/* ---------- Emergencias ---------- */
async function guiaEmergencias(url, lang, app = "emergencias", minimo = { pestanas: 10, fichas: 100 }) {
  const doc = parse(await bajar(url));
  doc.querySelector("#locked-msg")?.remove();
  const ruta = "#/" + app + "/";
  const pestanas = doc.querySelectorAll("nav.demo-tabs .demo-tab").map((b) => ({
    id: b.getAttribute("data-tab"),
    nombre: limpiarTexto(b.text),
    color: (b.getAttribute("class") || "").replace("demo-tab", "").trim(),
  }));
  const tabs = new Set(pestanas.map((p) => p.id));

  // Mapa id de elemento → pestaña, para reescribir anclas internas
  const idAPestana = {};
  doc.querySelectorAll("section.demo-panel").forEach((p) => {
    const tab = p.id.replace("panel-", "");
    p.querySelectorAll("[id]").forEach((e) => (idAPestana[e.id] = tab));
  });
  const ancla = (id) => {
    const m = id.match(/^tab-([a-z0-9]+)$/);
    if (m && tabs.has(m[1])) return ruta + m[1];
    if (idAPestana[id]) return ruta + idAPestana[id] + "/" + id;
    return null;
  };

  const grupos = [];
  for (const p of pestanas) {
    const panel = doc.querySelector("#panel-" + p.id);
    if (!panel) continue;
    const cover = panel.querySelector(".panel-cover");
    const titulo = limpiarTexto(cover?.querySelector("h2")?.text || p.nombre);
    const bajada = limpiarTexto(cover?.querySelector("p")?.text || "");
    cover?.remove();
    const fichas = [];
    panel.querySelectorAll(".subcard").forEach((c, i) => {
      if (!c.id) c.setAttribute("id", "emg-" + p.id + "-" + (i + 1));
      const h = c.querySelector("h3");
      fichas.push({
        id: c.id,
        titulo: limpiarTexto((h?.text || "").replace(/^\s*\d+/, "")),
        texto: textoDe(c.querySelector(".subcard-body") || c),
        fuentes: c.querySelectorAll(".source-note").map((n) => textoDe(n)).filter(Boolean).join(" · "),
      });
    });
    // Fichas sin nota de fuente propia: usan la nota general de la pestaña
    const notaPestana = panel.querySelectorAll(".source-note").filter((n) => !n.closest(".subcard")).map((n) => textoDe(n)).filter(Boolean).join(" · ");
    if (notaPestana) fichas.forEach((f) => { if (!f.fuentes) f.fuentes = notaPestana; });
    sanear(panel, url, ancla);
    grupos.push({ ...p, titulo, bajada, html: panel.innerHTML.trim(), fichas });
  }
  const total = grupos.reduce((a, g) => a + g.fichas.length, 0);
  if (grupos.length < minimo.pestanas || total < minimo.fichas) throw new Error(`${app} ${lang}: ${grupos.length} pestañas, ${total} fichas — se cancela`);
  console.log(`${app} ${lang}: ${grupos.length} pestañas, ${total} fichas`);
  return { app, idioma: lang, fuente: url, grupos };
}

async function espejoEmergencias() {
  const f = FUENTES.emergencias;
  const guias = {};
  for (const [lang, archivo] of Object.entries(f.guias)) {
    try {
      guias[lang] = await guiaEmergencias(f.base + archivo, lang);
    } catch (e) {
      if (lang === "es") throw e;
      console.log(`Emergencias ${lang}: no disponible (${e.message}) — se omite`);
    }
  }

  const biblio = await bibliografias(f, "emergencias");
  const css = await cssEncerrado(await bajar(f.base + f.css), ".emg-src");
  return { guias, biblio, css };
}

/* Bibliografías por idioma (es obligatoria; en/pt se omiten si aún no están publicadas) */
async function bibliografias(f, app) {
  const biblio = {};
  for (const [lang, archivo] of Object.entries(f.biblio)) {
    const burl = f.base + archivo;
    try {
      const bdoc = parse(await bajar(burl));
      const bmain = bdoc.querySelector("main");
      const bids = new Set(bmain.querySelectorAll("[id]").map((e) => e.id));
      sanear(bmain, burl, (id) => (bids.has(id) ? "#/biblioteca/" + app + "/" + id : null));
      biblio[lang] = { app, idioma: lang, fuente: burl, html: bmain.innerHTML.trim() };
    } catch (e) {
      if (lang === "es") throw e;
      console.log(`Bibliografía ${app} ${lang}: no disponible (${e.message}) — se omite`);
    }
  }
  return biblio;
}

/* ---------- Calculadora prenatal (NUEVO 2026-11-08) ---------- */
async function espejoCalculadora() {
  const f = FUENTES.calculadora;
  const guias = {};
  let estilos = "";
  for (const [lang, archivo] of Object.entries(f.guias)) {
    try {
      guias[lang] = await guiaEmergencias(f.base + archivo, lang, "calculadora", { pestanas: 8, fichas: 40 });
      if (lang === "es") estilos = parse(await bajar(f.base + archivo)).querySelectorAll("style").map((n) => n.text).join("\n");
    } catch (e) {
      if (lang === "es") throw e;
      console.log(`Calculadora ${lang}: no disponible (${e.message}) — se omite`);
    }
  }
  const biblio = await bibliografias(f, "calculadora");
  const bEst = parse(await bajar(f.base + f.biblio.es)).querySelectorAll("style").map((n) => n.text).join("\n");
  const css = await cssEncerrado(estilos + "\n" + bEst, ".calc-src");
  return { guias, biblio, css };
}

/* ---------- escritura ---------- */
function escribir(nombre, contenido) {
  const texto = typeof contenido === "string" ? contenido : JSON.stringify(contenido);
  const ruta = join(DATA, nombre);
  if (!existsSync(dirname(ruta))) mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, texto);
  return hash(texto);
}

/* ---------- Índice para IA (NUEVO 2026-10-30) ----------
 * data/ia/indice-{es,en,pt}.json — una entrada por ficha, en texto plano,
 * con fuentes y enlaces. Lo leen CaVeSal IA y la IA de Mujer y Mamá para
 * responder con la misma base. Sin HTML: más liviano y sin ruido. */
const ACADEMY = "https://cavesal.app/academy/";
function indiceIA(lang, hcGuia, emGuia, calcGuia) {
  const fichas = [];
  if (hcGuia) {
    for (const c of hcGuia.capitulos) {
      const seccion = limpiarTexto(c.nombre.replace(/^[^\p{L}\p{N}]+/u, ""));
      for (const g of c.guias) {
        fichas.push({
          id: "hc/" + g.id,
          app: "hc",
          seccion,
          titulo: g.titulo,
          texto: g.texto,
          fuentes: g.fuente || "",
          academy: ACADEMY + "#/hc/g/" + g.id,
          guia: hcGuia.fuente + "#" + g.id,
        });
      }
    }
  }
  if (emGuia) {
    for (const gr of emGuia.grupos) {
      for (const f of gr.fichas) {
        fichas.push({
          id: "emergencias/" + gr.id + "/" + f.id,
          app: "emergencias",
          seccion: gr.nombre,
          titulo: f.titulo,
          texto: f.texto,
          fuentes: f.fuentes || "",
          academy: ACADEMY + "#/emergencias/" + gr.id + "/" + f.id,
          guia: emGuia.fuente + "#" + f.id,
        });
      }
    }
  }
  if (calcGuia) {
    for (const gr of calcGuia.grupos) {
      for (const f of gr.fichas) {
        fichas.push({
          id: "calculadora/" + gr.id + "/" + f.id,
          app: "calculadora",
          seccion: gr.nombre,
          titulo: f.titulo,
          texto: f.texto,
          fuentes: f.fuentes || "",
          academy: ACADEMY + "#/calculadora/" + gr.id + "/" + f.id,
          guia: calcGuia.fuente + "#" + f.id,
        });
      }
    }
  }
  return {
    idioma: lang,
    descripcion: "Índice de las guías CaVeSal® (Historia Clínica, Emergencias y Calculadora prenatal) para uso de IA. Texto plano por ficha, con fuentes y enlaces. Se regenera solo desde las guías publicadas; no editar a mano.",
    autor: "Dr. Carlos Vera Salerno · CaVeSal®",
    total: fichas.length,
    fichas,
  };
}

/* ---------- Novedades para la revisión mensual (NUEVO 2026-10-31) ----------
 * data/ia/novedades-{es,en,pt}.json — fichas nuevas, modificadas o eliminadas,
 * con la fecha en que el espejo detectó el cambio. Compara el índice nuevo con
 * el que ya estaba publicado. Guarda 13 meses y una sola entrada por ficha (la
 * más reciente). Lo lee Lovable en la revisión mensual de CaVeSal Mujer y Mamá. */
const TEXTOS_NOV = {
  es: "Fichas de las guías CaVeSal® (Historia Clínica, Emergencias y Calculadora prenatal) nuevas, modificadas o eliminadas, con la fecha en que se publicó el cambio. Para la revisión mensual de CaVeSal Mujer y Mamá: tomar solo las entradas con fecha posterior a la última revisión. Se regenera solo; no editar a mano.",
  en: "New, modified or removed cards of the CaVeSal® guides (Clinical History, Emergencies and Prenatal Calculator), with the date the change was published. For the monthly review of CaVeSal Mujer and Mamá: take only entries dated after the last review. Regenerated automatically; do not edit by hand.",
  pt: "Fichas dos guias CaVeSal® (História Clínica, Emergências e Calculadora pré-natal) novas, modificadas ou removidas, com a data em que a mudança foi publicada. Para a revisão mensal do CaVeSal Mujer e Mamá: considerar só as entradas com data posterior à última revisão. Regenera-se sozinho; não editar à mão.",
};
function novedades(lang, indice) {
  const rIdx = join(DATA, `ia/indice-${lang}.json`);
  if (!existsSync(rIdx)) return null; // sin índice previo no hay contra qué comparar
  const antes = new Map(JSON.parse(readFileSync(rIdx, "utf8")).fichas.map((f) => [f.id, f]));
  const huella = (f) => hash(f.titulo + "\n" + f.texto + "\n" + f.fuentes);
  const rNov = join(DATA, `ia/novedades-${lang}.json`);
  const previo = existsSync(rNov) ? JSON.parse(readFileSync(rNov, "utf8")).novedades : [];
  const hoyISO = new Date().toISOString().slice(0, 10);
  const nuevas = [];
  for (const f of indice.fichas) {
    const a = antes.get(f.id);
    if (a && huella(a) === huella(f)) continue;
    nuevas.push({ fecha: hoyISO, tipo: a ? "modificada" : "nueva", id: f.id, app: f.app, seccion: f.seccion, titulo: f.titulo, academy: f.academy, guia: f.guia, fuentes: f.fuentes, texto: f.texto });
  }
  const ahora = new Set(indice.fichas.map((f) => f.id));
  for (const [id, a] of antes) if (!ahora.has(id)) nuevas.push({ fecha: hoyISO, tipo: "eliminada", id, app: a.app, seccion: a.seccion, titulo: a.titulo });
  if (!nuevas.length && existsSync(rNov)) return null; // sin cambios: no se reescribe
  const tocadas = new Set(nuevas.map((n) => n.id));
  const limite = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
  const lista = [...nuevas, ...previo.filter((n) => !tocadas.has(n.id) && n.fecha >= limite)];
  lista.sort((x, y) => (x.fecha < y.fecha ? 1 : x.fecha > y.fecha ? -1 : x.id.localeCompare(y.id)));
  if (nuevas.length) console.log(`Novedades ${lang}: ${nuevas.length}`);
  return { idioma: lang, descripcion: TEXTOS_NOV[lang], autor: "Dr. Carlos Vera Salerno · CaVeSal®", actualizado: hoyISO, total: lista.length, novedades: lista };
}

const hc = await espejoHC();
const em = await espejoEmergencias();
const calc = await espejoCalculadora();
const archivos = {};
for (const [l, d] of Object.entries(hc.guias)) archivos[`hc-${l}.json`] = escribir(`hc-${l}.json`, d);
for (const [l, d] of Object.entries(hc.biblio)) archivos[`biblio-hc-${l}.json`] = escribir(`biblio-hc-${l}.json`, d);
archivos["hc.css"] = escribir("hc.css", hc.css);
for (const [l, d] of Object.entries(em.guias)) archivos[`emergencias-${l}.json`] = escribir(`emergencias-${l}.json`, d);
for (const [l, d] of Object.entries(em.biblio)) archivos[`biblio-emergencias-${l}.json`] = escribir(`biblio-emergencias-${l}.json`, d);
archivos["emergencias.css"] = escribir("emergencias.css", em.css);
for (const [l, d] of Object.entries(calc.guias)) archivos[`calculadora-${l}.json`] = escribir(`calculadora-${l}.json`, d);
for (const [l, d] of Object.entries(calc.biblio)) archivos[`biblio-calculadora-${l}.json`] = escribir(`biblio-calculadora-${l}.json`, d);
archivos["calculadora.css"] = escribir("calculadora.css", calc.css);
for (const l of ["es", "en", "pt"]) {
  if (!hc.guias[l] && !em.guias[l] && !calc.guias[l]) continue;
  const indice = indiceIA(l, hc.guias[l], em.guias[l], calc.guias[l]);
  const nov = novedades(l, indice);
  archivos[`ia/indice-${l}.json`] = escribir(`ia/indice-${l}.json`, indice);
  if (nov) archivos[`ia/novedades-${l}.json`] = escribir(`ia/novedades-${l}.json`, nov);
}

// version.json solo cambia si cambió algún archivo (así el commit diario no es ruido)
const vPath = join(DATA, "version.json");
const previo = existsSync(vPath) ? JSON.parse(readFileSync(vPath, "utf8")) : {};
const conteos = {
  hc: { capitulos: hc.guias.es.capitulos.length, guias: hc.guias.es.capitulos.reduce((a, c) => a + c.guias.length, 0) },
  emergencias: { pestanas: em.guias.es.grupos.length, fichas: em.guias.es.grupos.reduce((a, g) => a + g.fichas.length, 0) },
  calculadora: { pestanas: calc.guias.es.grupos.length, fichas: calc.guias.es.grupos.reduce((a, g) => a + g.fichas.length, 0) },
};
if (JSON.stringify(previo.archivos) !== JSON.stringify(archivos)) {
  const v = { version: hash(JSON.stringify(archivos)), actualizado: new Date().toISOString(), conteos, archivos };
  writeFileSync(vPath, JSON.stringify(v, null, 2));
  console.log("Espejo actualizado:", v.version);
} else {
  console.log("Sin cambios en las guías.");
}
