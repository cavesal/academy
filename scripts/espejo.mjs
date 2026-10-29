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
    biblio: { es: "bibliografia.html" },
    css: "styles.css",
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
async function guiaEmergencias(url, lang) {
  const doc = parse(await bajar(url));
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
    if (m && tabs.has(m[1])) return "#/emergencias/" + m[1];
    if (idAPestana[id]) return "#/emergencias/" + idAPestana[id] + "/" + id;
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
      });
    });
    sanear(panel, url, ancla);
    grupos.push({ ...p, titulo, bajada, html: panel.innerHTML.trim(), fichas });
  }
  const total = grupos.reduce((a, g) => a + g.fichas.length, 0);
  if (grupos.length < 10 || total < 100) throw new Error(`Emergencias ${lang}: ${grupos.length} pestañas, ${total} fichas — se cancela`);
  console.log(`Emergencias ${lang}: ${grupos.length} pestañas, ${total} fichas`);
  return { app: "emergencias", idioma: lang, fuente: url, grupos };
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


  const burl = f.base + f.biblio.es;
  const bdoc = parse(await bajar(burl));
  const bmain = bdoc.querySelector("main");
  const bids = new Set(bmain.querySelectorAll("[id]").map((e) => e.id));
  sanear(bmain, burl, (id) => (bids.has(id) ? "#/biblioteca/emergencias/" + id : null));

  const css = await cssEncerrado(await bajar(f.base + f.css), ".emg-src");
  return {
    guias,
    biblio: { es: { app: "emergencias", idioma: "es", fuente: burl, html: bmain.innerHTML.trim() } },
    css,
  };
}

/* ---------- escritura ---------- */
function escribir(nombre, contenido) {
  const texto = typeof contenido === "string" ? contenido : JSON.stringify(contenido);
  writeFileSync(join(DATA, nombre), texto);
  return hash(texto);
}

const hc = await espejoHC();
const em = await espejoEmergencias();
const archivos = {};
for (const [l, d] of Object.entries(hc.guias)) archivos[`hc-${l}.json`] = escribir(`hc-${l}.json`, d);
for (const [l, d] of Object.entries(hc.biblio)) archivos[`biblio-hc-${l}.json`] = escribir(`biblio-hc-${l}.json`, d);
archivos["hc.css"] = escribir("hc.css", hc.css);
for (const [l, d] of Object.entries(em.guias)) archivos[`emergencias-${l}.json`] = escribir(`emergencias-${l}.json`, d);
archivos["biblio-emergencias-es.json"] = escribir("biblio-emergencias-es.json", em.biblio.es);
archivos["emergencias.css"] = escribir("emergencias.css", em.css);

// version.json solo cambia si cambió algún archivo (así el commit diario no es ruido)
const vPath = join(DATA, "version.json");
const previo = existsSync(vPath) ? JSON.parse(readFileSync(vPath, "utf8")) : {};
const conteos = {
  hc: { capitulos: hc.guias.es.capitulos.length, guias: hc.guias.es.capitulos.reduce((a, c) => a + c.guias.length, 0) },
  emergencias: { pestanas: em.guias.es.grupos.length, fichas: em.guias.es.grupos.reduce((a, g) => a + g.fichas.length, 0) },
};
if (JSON.stringify(previo.archivos) !== JSON.stringify(archivos)) {
  const v = { version: hash(JSON.stringify(archivos)), actualizado: new Date().toISOString(), conteos, archivos };
  writeFileSync(vPath, JSON.stringify(v, null, 2));
  console.log("Espejo actualizado:", v.version);
} else {
  console.log("Sin cambios en las guías.");
}
