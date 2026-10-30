#!/usr/bin/env node
/* CaVeSal® Academy — Vigilancia mensual de evidencia.
 *
 * Busca publicaciones nuevas (PubMed/Cochrane, OMS, OPS, RCOG) sobre los
 * temas de las guías CaVeSal® (Historia Clínica y Emergencias), descarta lo
 * que ya está citado, las clasifica con IA (Groq, plan gratuito) y:
 *   1) abre un Issue en este repositorio con el informe para aprobar;
 *   2) avisa por Telegram al grupo "CaVeSal Evidencia".
 *
 * NUNCA modifica una guía. Lo aprobado se aplica a mano, en la app de origen.
 *
 * Variables de entorno:
 *   GITHUB_TOKEN, GITHUB_REPOSITORY  → los pone GitHub Actions
 *   TELEGRAM_BOT_TOKEN               → secreto del repositorio
 *   TELEGRAM_CHAT_ID                 → número del grupo (en el workflow)
 *   AVISAR_A                         → usuario de GitHub a mencionar (correo)
 *   GROQ_API_KEY                     → secreto del repositorio (sin clave, clasifica sin IA)
 *   MODELO                           → modelo de Groq (opcional)
 *   DIAS                             → días hacia atrás (opcional; si no, desde la última corrida)
 *   PRUEBA = "si"                    → no guarda estado, marca todo como prueba
 *   SIN_IA = "si"                    → no usa IA (para probar en local)
 *   SIN_PUBLICAR = "si"              → no abre Issue ni manda Telegram (escribe el informe en vigilancia/)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "vigilancia");
const DATA = join(ROOT, "data");
const ENV = process.env;
const PRUEBA = (ENV.PRUEBA || "").toLowerCase() === "si";
const SIN_IA = (ENV.SIN_IA || "").toLowerCase() === "si";
const SIN_PUBLICAR = (ENV.SIN_PUBLICAR || "").toLowerCase() === "si";
const MODELO = ENV.MODELO || "llama-3.3-70b-versatile";
const MODELO_RESPALDO = "llama-3.1-8b-instant";
const ACADEMY = "https://cavesal.app/academy/";
const UA = "CaVeSal-Academy-Vigilancia (drverasalerno@gmail.com)";
const MAX_IA = 220; // tope de artículos que pasan por la IA en una corrida

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const leerJSON = (p, def) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : def);
const limpiar = (s) => String(s || "").replace(/\s+/g, " ").trim();
const decodificar = (s) =>
  limpiar(
    String(s || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
      .replace(/&amp;/g, "&")
  );
const fmt = (d) => d.toISOString().slice(0, 10);
const fmtPy = (d) => d.toLocaleDateString("es-PY", { timeZone: "America/Asuncion", day: "2-digit", month: "2-digit", year: "numeric" });

async function bajar(url, opciones = {}, intentos = 3) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await fetch(url, { ...opciones, headers: { "User-Agent": UA, ...(opciones.headers || {}) } });
      if (r.status === 429 && i < intentos) { await espera(3000 * i); continue; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r;
    } catch (e) {
      if (i === intentos) throw new Error(url.slice(0, 120) + " → " + e.message);
      await espera(2000 * i);
    }
  }
}

/* ---------- configuración y estado ---------- */
const temas = leerJSON(join(DIR, "temas.json"), null);
if (!temas) throw new Error("Falta vigilancia/temas.json");
const estadoPath = join(DIR, "estado.json");
const estado = leerJSON(estadoPath, { ultima_corrida: null, vistos: [], rcog: [] });

const hoy = new Date();
let desde;
if (ENV.DIAS) desde = new Date(hoy.getTime() - (+ENV.DIAS) * 864e5);
else if (estado.ultima_corrida) desde = new Date(new Date(estado.ultima_corrida).getTime() - 2 * 864e5); // 2 días de solape
else desde = new Date(hoy.getTime() - 31 * 864e5);
const vistos = new Set(estado.vistos || []);
console.log(`Período: ${fmt(desde)} → ${fmt(hoy)}${PRUEBA ? " (PRUEBA)" : ""}`);

/* ---------- fichas de las guías (para ubicar cada hallazgo) ---------- */
const hcES = leerJSON(join(DATA, "hc-es.json"), { capitulos: [] });
const emES = leerJSON(join(DATA, "emergencias-es.json"), { grupos: [] });
const fichasPorSeccion = {};
const fichaPorId = {};
for (const c of hcES.capitulos) {
  const sec = "hc:" + c.id;
  const nombre = limpiar(c.nombre.replace(/^[^\p{L}\p{N}]+/u, ""));
  fichasPorSeccion[sec] = c.guias.map((g) => {
    const f = { id: "hc/" + g.id, titulo: g.titulo, seccion: "HC · " + nombre, academy: ACADEMY + "#/hc/g/" + g.id };
    fichaPorId[f.id] = f;
    return f;
  });
}
for (const g of emES.grupos) {
  const sec = "emergencias:" + g.id;
  fichasPorSeccion[sec] = g.fichas.map((x) => {
    const f = { id: "emergencias/" + g.id + "/" + x.id, titulo: x.titulo, seccion: "Emergencias · " + g.nombre, academy: ACADEMY + "#/emergencias/" + g.id + "/" + x.id };
    fichaPorId[f.id] = f;
    return f;
  });
}

/* ---------- lo que ya está citado en las guías y bibliografías ---------- */
const citados = { pmid: new Set(), pmc: new Set(), doi: new Set() };
for (const nombre of ["biblio-emergencias-es.json", "biblio-hc-es.json", "emergencias-es.json", "hc-es.json"]) {
  const p = join(DATA, nombre);
  if (!existsSync(p)) continue;
  const t = readFileSync(p, "utf8");
  for (const m of t.matchAll(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{5,9})/g)) citados.pmid.add(m[1]);
  for (const m of t.matchAll(/PMID:?\s*(\d{5,9})/gi)) citados.pmid.add(m[1]);
  for (const m of t.matchAll(/PMC(\d{4,9})/g)) citados.pmc.add("PMC" + m[1]);
  for (const m of t.matchAll(/\b(10\.\d{4,9}\/[^\s"'<>\\]+)/g)) citados.doi.add(m[1].replace(/[).,;\]]+$/, "").toLowerCase());
}
console.log(`Ya citados: ${citados.pmid.size} PMID, ${citados.pmc.size} PMC, ${citados.doi.size} DOI`);

/* ---------- PubMed ---------- */
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
const REVISTAS = ["N Engl J Med", "Lancet", "JAMA", "BMJ", "Obstet Gynecol", "Am J Obstet Gynecol", "BJOG", "Ultrasound Obstet Gynecol", "Int J Gynaecol Obstet", "Am J Obstet Gynecol MFM", "PLoS Med", "Lancet Glob Health", "Fertil Steril", "Hum Reprod", "Hum Reprod Update", "Hypertension", "JAMA Netw Open", "Obstet Gynecol Surv"];
const FILTRO_CALIDAD =
  '("Practice Guideline"[pt] OR "Guideline"[pt] OR guideline*[ti] OR consensus[ti] OR "practice bulletin"[ti] OR "committee opinion"[ti] OR "green-top"[ti] OR "clinical practice"[ti] OR recommendation*[ti] OR "Cochrane Database Syst Rev"[ta] OR ((systematic[sb] OR "meta-analysis"[ti] OR randomized[ti] OR randomised[ti] OR "Randomized Controlled Trial"[pt]) AND (' +
  REVISTAS.map((r) => `"${r}"[ta]`).join(" OR ") + ")))";
const ymd = (d) => fmt(d).replace(/-/g, "/");

async function pubmed() {
  const temasDe = new Map(); // pmid → [temaId]
  for (const t of temas) {
    const term = `${t.q} AND ${FILTRO_CALIDAD}`;
    const url = `${EUTILS}esearch.fcgi?db=pubmed&retmode=json&retmax=200&datetype=edat&mindate=${ymd(desde)}&maxdate=${ymd(hoy)}&tool=cavesal&email=drverasalerno@gmail.com&term=${encodeURIComponent(term)}`;
    try {
      const r = await (await bajar(url)).json();
      const ids = r.esearchresult?.idlist || [];
      ids.forEach((id) => temasDe.set(id, [...(temasDe.get(id) || []), t.id]));
      console.log(`PubMed ${t.id}: ${ids.length}`);
    } catch (e) {
      console.log(`PubMed ${t.id}: error ${e.message}`);
    }
    await espera(400);
  }
  const ids = [...temasDe.keys()];
  const articulos = [];
  for (let i = 0; i < ids.length; i += 100) {
    const lote = ids.slice(i, i + 100);
    const xml = await (await bajar(`${EUTILS}efetch.fcgi?db=pubmed&retmode=xml&tool=cavesal&email=drverasalerno@gmail.com&id=${lote.join(",")}`)).text();
    for (const bloque of xml.split("</PubmedArticle>")) {
      const pmid = (bloque.match(/<PMID[^>]*>(\d+)<\/PMID>/) || [])[1];
      if (!pmid || !temasDe.has(pmid)) continue;
      const titulo = decodificar((bloque.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/) || [])[1]);
      const resumen = decodificar([...bloque.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)].map((m) => {
        const lab = (m[1].match(/Label="([^"]+)"/) || [])[1];
        return (lab ? lab + ": " : "") + m[2];
      }).join(" "));
      const revista = decodificar((bloque.match(/<ISOAbbreviation>([\s\S]*?)<\/ISOAbbreviation>/) || bloque.match(/<Title>([\s\S]*?)<\/Title>/) || [])[1]);
      const tipos = [...bloque.matchAll(/<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/g)].map((m) => decodificar(m[1]));
      const doi = ((bloque.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/) || bloque.match(/<ELocationID EIdType="doi"[^>]*>([^<]+)<\/ELocationID>/) || [])[1] || "").toLowerCase();
      const pmc = (bloque.match(/<ArticleId IdType="pmc">([^<]+)<\/ArticleId>/) || [])[1] || "";
      const anio = (bloque.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/) || bloque.match(/<ArticleDate[^>]*>\s*<Year>(\d{4})/) || [])[1] || "";
      const autores = [...bloque.matchAll(/<Author[^>]*>\s*<LastName>([^<]+)<\/LastName>(?:\s*<ForeName>[^<]*<\/ForeName>)?\s*(?:<Initials>([^<]+)<\/Initials>)?/g)].map((m) => decodificar(m[1]) + (m[2] ? " " + m[2] : ""));
      const grupo = decodificar((bloque.match(/<CollectiveName>([\s\S]*?)<\/CollectiveName>/) || [])[1]);
      articulos.push({
        clave: "pmid:" + pmid, origen: "PubMed", pmid, doi, pmc, titulo, resumen, revista, anio,
        autores: autores.length ? autores.slice(0, 3).join(", ") + (autores.length > 3 ? ", et al." : "") : grupo,
        tipo: tipoDe(tipos, titulo, revista), temas: temasDe.get(pmid),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    }
    await espera(400);
  }
  return articulos;
}

function tipoDe(tipos, titulo, revista) {
  const t = titulo.toLowerCase();
  if (/protocol/i.test(t) && /cochrane/i.test(revista)) return "protocolo Cochrane";
  if (tipos.some((x) => /guideline/i.test(x)) || /guideline|consensus|practice bulletin|committee opinion|green-top|recommendation/.test(t)) return "guía / consenso";
  if (/cochrane/i.test(revista)) return "revisión Cochrane";
  if (tipos.some((x) => /meta-analysis|systematic review/i.test(x)) || /meta-analy|systematic review/.test(t)) return "revisión sistemática / metaanálisis";
  if (tipos.some((x) => /randomized controlled trial/i.test(x)) || /randomi[sz]ed/.test(t)) return "ensayo aleatorizado";
  return "otro";
}

/* ---------- organismos: OMS, OPS, RCOG ---------- */
const CLAVES_ORG = /embaraz|matern|perinatal|parto|ces[aá]rea|puerper|lactancia|amamant|obst[eé]tric|gestaci|gestante|prenatal|anticoncep|planificaci[oó]n familiar|aborto|neonat|reci[eé]n nacid|salud sexual|reproductiv|cervicouterin|cuello uterino|papiloma|menopaus|s[ií]filis|chagas|toxoplasm|violencia sexual|pregnan|childbirth|\bbirth|caesarean|cesarean|postpartum|postnatal|antenatal|breastfe|obstetric|contracept|family planning|abortion|newborn|sexual and reproductive|cervical cancer|\bhpv\b|breast cancer|syphilis|gravidez|amamenta|contracep|infertil|fertility|stillbirth|midwi|partera/i;

async function organismos() {
  const items = [];
  const avisos = [];
  // OMS — API pública de publicaciones
  try {
    const valores = [];
    for (const skip of [0, 100]) {
      const url = `https://www.who.int/api/hubs/publications?sf_culture=en&$orderby=PublicationDateAndTime%20desc&$top=100&$skip=${skip}&$select=Title,PublicationDateAndTime,ItemDefaultUrl`;
      valores.push(...((await (await bajar(url)).json()).value || []));
    }
    for (const p of valores) {
      const f = new Date(p.PublicationDateAndTime);
      if (f < desde || !CLAVES_ORG.test(p.Title || "")) continue;
      const u = "https://www.who.int/publications/i/item" + p.ItemDefaultUrl;
      items.push({ clave: "url:" + u, origen: "OMS", titulo: limpiar(p.Title), resumen: "", revista: "OMS", anio: String(f.getFullYear()), autores: "Organización Mundial de la Salud", tipo: "documento OMS", temas: [], url: u, fecha: fmt(f) });
    }
    console.log(`OMS: ${items.length}`);
  } catch (e) { avisos.push("OMS no respondió (" + e.message + ")"); }
  // OPS — repositorio IRIS (DSpace)
  try {
    const n0 = items.length;
    const url = "https://iris.paho.org/server/api/discover/search/objects?sort=dc.date.accessioned,DESC&size=100&dsoType=ITEM";
    const d = await (await bajar(url)).json();
    for (const o of d._embedded?.searchResult?._embedded?.objects || []) {
      const it = o._embedded?.indexableObject; if (!it) continue;
      const m = it.metadata || {};
      const f = new Date(m["dc.date.accessioned"]?.[0]?.value || 0);
      const titulo = limpiar(m["dc.title"]?.[0]?.value || it.name);
      if (f < desde || !CLAVES_ORG.test(titulo)) continue;
      const u = m["dc.identifier.uri"]?.[0]?.value || ("https://iris.paho.org/handle/" + it.handle);
      items.push({ clave: "url:" + u, origen: "OPS", titulo, resumen: limpiar(m["dc.description.abstract"]?.[0]?.value || "").slice(0, 1500), revista: "OPS", anio: String(m["dc.date.issued"]?.[0]?.value || "").slice(0, 4), autores: "Organización Panamericana de la Salud", tipo: "documento OPS", temas: [], url: u, fecha: fmt(f) });
    }
    console.log(`OPS: ${items.length - n0}`);
  } catch (e) { avisos.push("OPS no respondió (" + e.message + ")"); }
  // RCOG — lista de Green-top: avisa si aparece un enlace nuevo
  let rcog = estado.rcog || [];
  try {
    const base = "https://www.rcog.org.uk";
    const h = await (await bajar(base + "/guidance/browse-all-guidance/green-top-guidelines/")).text();
    const actuales = [...new Set([...h.matchAll(/href="(\/guidance\/browse-all-guidance\/green-top-guidelines\/[^"#?]+)"/g)].map((m) => m[1]))];
    if (actuales.length < 10) throw new Error("lista incompleta (" + actuales.length + ")");
    const previos = new Set(rcog);
    if (previos.size) {
      for (const p of actuales) {
        if (previos.has(p)) continue;
        const titulo = p.split("/").filter(Boolean).pop().replace(/-/g, " ").replace(/\bno (\d+)/, "No. $1");
        items.push({ clave: "url:" + base + p, origen: "RCOG", titulo: "RCOG — " + titulo.charAt(0).toUpperCase() + titulo.slice(1), resumen: "", revista: "RCOG", anio: String(hoy.getFullYear()), autores: "Royal College of Obstetricians and Gynaecologists", tipo: "guía / consenso", temas: [], url: base + p, fecha: fmt(hoy) });
      }
    }
    rcog = actuales;
    console.log(`RCOG: ${actuales.length} guías en la lista${previos.size ? "" : " (primera lectura, se guarda como base)"}`);
  } catch (e) { avisos.push("RCOG no respondió (" + e.message + ")"); }
  return { items, avisos, rcog };
}

/* ---------- IA: Groq (compatible con OpenAI) ---------- */
const SISTEMA = `Sos el asistente de vigilancia de evidencia de las guías clínicas CaVeSal® (obstetricia, medicina materno-fetal y ginecología; Paraguay). Para cada publicación decidís si importa para alguna ficha de las guías.

Niveles:
- "importante": (a) guía, consenso o recomendación oficial NUEVA o ACTUALIZADA de una sociedad u organismo (OMS, OPS, FIGO, ACOG, SMFM, RCOG, NICE, SOGC, ISUOG, ISSHP, CDC, ASCCP, ESHRE, ASRM, NAMS/Menopause Society, MSPBS u otra nacional relevante) sobre un tema de las fichas; o (b) revisión Cochrane, metaanálisis o ensayo aleatorizado grande cuyos resultados cambiarían una conducta, dosis, punto de corte o recomendación de una ficha.
- "revisar": suma evidencia útil a una ficha pero no cambia la conducta.
- "descartar": fuera de tema, protocolo de revisión, comentario o carta, estudio pequeño o de baja calidad, población no aplicable, solo veterinario/laboratorio, o documento administrativo sin contenido clínico.

Reglas:
- Usá SOLO lo que dice el título y el resumen. No inventes cifras, dosis ni conclusiones. Si el resumen no alcanza, decilo en "motivo" y elegí "revisar" o "descartar".
- "ficha": copiá exactamente uno de los id de la lista de fichas, o null si ninguna corresponde.
- Escribí en español, frases cortas y técnicas.
- "resumen": hasta 60 palabras, qué encontró o recomienda.
- "sugerencia": solo si es "importante" o "revisar": hasta 70 palabras de texto listo para agregar a la ficha, con la cita abreviada al final (autor/organismo, revista, año). Si es "descartar", cadena vacía.
- "motivo": hasta 20 palabras, por qué ese nivel.

Respondé SOLO con JSON válido, sin texto antes ni después:
{"items":[{"ref":1,"nivel":"importante|revisar|descartar","ficha":"id o null","resumen":"...","sugerencia":"...","motivo":"..."}]}`;

let iaDisponible = !SIN_IA && !!ENV.GROQ_API_KEY;
if (!SIN_IA && !ENV.GROQ_API_KEY) console.log("IA: falta GROQ_API_KEY, clasifico sin IA");
let iaFallos = 0;
let modeloActual = MODELO;
async function preguntarIA(usuario) {
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: "Bearer " + ENV.GROQ_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ model: modeloActual, temperature: 0.1, max_tokens: 2500, response_format: { type: "json_object" }, messages: [{ role: "system", content: SISTEMA }, { role: "user", content: usuario }] }),
      });
      if (r.status === 429) {
        const seg = Math.min(+(r.headers.get("retry-after") || 30), 120);
        console.log(`IA: límite de uso, espero ${seg} s`);
        await espera(seg * 1000);
        continue;
      }
      if ((r.status === 404 || r.status === 400) && modeloActual !== MODELO_RESPALDO) {
        console.log(`IA: ${modeloActual} no disponible (${r.status}), paso a ${MODELO_RESPALDO}`);
        modeloActual = MODELO_RESPALDO;
        continue;
      }
      if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 200));
      const crudo = await r.text();
      if (!crudo.trim().startsWith("{")) throw new Error("respuesta no JSON: " + crudo.slice(0, 80));
      const d = JSON.parse(crudo);
      const txt = d.choices?.[0]?.message?.content || "";
      const json = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
      return Array.isArray(json.items) ? json.items : [];
    } catch (e) {
      console.log(`IA: intento ${intento} falló — ${e.message}`);
      await espera(5000 * intento);
    }
  }
  iaFallos++;
  if (iaFallos >= 3) { iaDisponible = false; console.log("IA: demasiados fallos, sigo sin IA"); }
  return null;
}

function listaFichas(temaIds) {
  const secciones = new Set();
  temaIds.forEach((id) => (temas.find((t) => t.id === id)?.secciones || []).forEach((s) => secciones.add(s)));
  return [...secciones].flatMap((s) => fichasPorSeccion[s] || []);
}

function textoArticulo(a, n) {
  return `[ref ${n}] Origen: ${a.origen} · Tipo: ${a.tipo} · ${a.revista} ${a.anio}\nTítulo: ${a.titulo}\nResumen: ${(a.resumen || "(sin resumen)").slice(0, 1400)}`;
}

function sinIA(a) {
  const fuerte = /guía|Cochrane|OMS|OPS/.test(a.tipo) && !/protocolo/.test(a.tipo);
  return { nivel: fuerte ? "revisar" : "descartar", ficha: null, resumen: "", sugerencia: "", motivo: "Clasificado sin IA según el tipo de publicación." };
}

async function clasificar(articulos) {
  // Primero lo más fuerte, por si hay que cortar
  const orden = { "guía / consenso": 0, "documento OMS": 0, "documento OPS": 0, "revisión Cochrane": 1, "revisión sistemática / metaanálisis": 2, "ensayo aleatorizado": 3, otro: 4, "protocolo Cochrane": 5 };
  articulos.sort((a, b) => (orden[a.tipo] ?? 4) - (orden[b.tipo] ?? 4));
  const conIA = articulos.slice(0, MAX_IA);
  articulos.slice(MAX_IA).forEach((a) => Object.assign(a, sinIA(a)));

  // Lotes de 5 por tema principal (los organismos van aparte, con la lista de temas)
  const porTema = new Map();
  for (const a of conIA) {
    const k = a.temas[0] || "_org";
    porTema.set(k, [...(porTema.get(k) || []), a]);
  }
  for (const [tema, lista] of porTema) {
    for (let i = 0; i < lista.length; i += 5) {
      const lote = lista.slice(i, i + 5);
      if (!iaDisponible) { lote.forEach((a) => Object.assign(a, sinIA(a))); continue; }
      let usuario;
      if (tema === "_org") {
        usuario = "Documentos nuevos de organismos. No hay lista de fichas: poné ficha null y, en \"motivo\", el tema de las guías al que corresponde (o \"fuera de tema\").\nTemas de las guías: " +
          temas.map((t) => t.nombre).join("; ") + "\n\n" + lote.map((a, j) => textoArticulo(a, j + 1)).join("\n\n");
      } else {
        const t = temas.find((x) => x.id === tema);
        const fichas = listaFichas([...new Set(lote.flatMap((a) => a.temas))]);
        usuario = `Tema: ${t?.nombre || tema}\nFichas posibles (id | título | sección):\n` +
          fichas.map((f) => `${f.id} | ${f.titulo} | ${f.seccion}`).join("\n") + "\n\nPublicaciones:\n" + lote.map((a, j) => textoArticulo(a, j + 1)).join("\n\n");
      }
      const res = await preguntarIA(usuario);
      lote.forEach((a, j) => {
        const r = res && res.find((x) => +x.ref === j + 1);
        if (!r) return Object.assign(a, sinIA(a));
        a.nivel = ["importante", "revisar", "descartar"].includes(r.nivel) ? r.nivel : "revisar";
        a.ficha = r.ficha && fichaPorId[r.ficha] ? r.ficha : null;
        a.resumen_ia = limpiar(r.resumen);
        a.sugerencia = limpiar(r.sugerencia);
        a.motivo = limpiar(r.motivo);
        a.porIA = true;
      });
      await espera(20000); // respeta el límite gratuito de tokens por minuto
    }
  }
}

/* ---------- informe ---------- */
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function nombreTema(id) { return temas.find((t) => t.id === id)?.nombre || id; }
function etiquetaTema(a) {
  if (a.ficha) return fichaPorId[a.ficha].seccion.replace(/^(HC|Emergencias) · /, "").split(" — ")[0];
  return a.temas?.[0] ? nombreTema(a.temas[0]).split(",")[0] : a.origen;
}
function cita(a) {
  const ids = [a.pmid && `PMID [${a.pmid}](${a.url})`, a.doi && `DOI [${a.doi}](https://doi.org/${a.doi})`, a.pmc && `[${a.pmc}](https://pmc.ncbi.nlm.nih.gov/articles/${a.pmc}/)`].filter(Boolean);
  const base = [a.autores, a.revista, a.anio].filter(Boolean).join(". ");
  return base + "." + (ids.length ? " " + ids.join(" · ") : ` [Ver documento](${a.url})`);
}
function bloque(a, n) {
  const f = a.ficha ? fichaPorId[a.ficha] : null;
  return [
    `### ${n}. [${etiquetaTema(a)}] ${a.titulo}`,
    `- **Tipo:** ${a.tipo} · ${a.origen}${a.fecha ? " · " + a.fecha : ""}`,
    `- **Cita:** ${cita(a)}`,
    `- **Ficha afectada:** ${f ? `[${f.seccion} › ${f.titulo}](${f.academy})` : "ninguna en particular" + (a.temas?.length ? " (tema: " + nombreTema(a.temas[0]) + ")" : "")}`,
    a.resumen_ia ? `- **Qué aporta:** ${a.resumen_ia}` : "",
    a.sugerencia ? `- **Texto sugerido (borrador para revisar):** ${a.sugerencia}` : "",
    a.motivo ? `- **Por qué este nivel:** ${a.motivo}` : "",
    `- [ ] Aprobar`,
    `- [ ] Descartar`,
  ].filter(Boolean).join("\n");
}

async function main() {
  const avisos = [];
  let articulos = [];
  try { articulos = await pubmed(); } catch (e) { avisos.push("PubMed falló (" + e.message + ")"); }
  const org = await organismos();
  avisos.push(...org.avisos);
  articulos.push(...org.items);

  const totalEncontrados = articulos.length;
  const yaCitados = [];
  articulos = articulos.filter((a) => {
    if (vistos.has(a.clave)) return false;
    if ((a.pmid && citados.pmid.has(a.pmid)) || (a.pmc && citados.pmc.has(a.pmc)) || (a.doi && citados.doi.has(a.doi))) { yaCitados.push(a); return false; }
    return true;
  });
  console.log(`Encontrados ${totalEncontrados} · ya citados ${yaCitados.length} · nuevos ${articulos.length}`);

  if (articulos.length) await clasificar(articulos);
  const imp = articulos.filter((a) => a.nivel === "importante");
  const rev = articulos.filter((a) => a.nivel === "revisar");
  const des = articulos.filter((a) => a.nivel === "descartar");
  if (!ENV.GROQ_API_KEY && !SIN_IA) avisos.push("No hay clave de IA (GROQ_API_KEY): los hallazgos se clasificaron solo por tipo de publicación, sin resumen.");
  else if (!iaDisponible && !SIN_IA) avisos.push("La IA no estuvo disponible en parte de la corrida: esos hallazgos se clasificaron solo por tipo de publicación, sin resumen.");

  const periodo = `${fmtPy(desde)} al ${fmtPy(hoy)}`;
  const mes = MESES[new Date(hoy.getTime() - 15 * 864e5).getMonth()] + " " + new Date(hoy.getTime() - 15 * 864e5).getFullYear();
  const titulo = `${PRUEBA ? "[Prueba] " : ""}Informe de evidencia — ${mes}`;
  const usuario = ENV.AVISAR_A ? "@" + ENV.AVISAR_A : "";

  let n = 0;
  let cuerpo = [
    imp.length && usuario ? `${usuario} hay ${imp.length} hallazgo${imp.length > 1 ? "s" : ""} importante${imp.length > 1 ? "s" : ""} para revisar.\n` : "",
    `**Período:** ${periodo} · **Fuentes:** PubMed (incluye Cochrane), OMS, OPS, RCOG.`,
    `**Resultado:** ${imp.length} importantes · ${rev.length} para revisar · ${des.length} descartados · ${yaCitados.length} ya citados en las guías.`,
    "",
    "Marcá **Aprobar** o **Descartar** en cada hallazgo. Lo aprobado se aplica a mano en la guía de origen (ES/EN/PT y bibliografía); esta herramienta no modifica ninguna guía. El texto sugerido es un borrador hecho por IA a partir del resumen: verificalo en la fuente antes de usarlo.",
    avisos.length ? "\n> **Avisos de la corrida:** " + avisos.join(" · ") : "",
    "",
    `## Importante (${imp.length})`,
    imp.length ? imp.map((a) => bloque(a, ++n)).join("\n\n") : "_Nada que cambie una conducta este mes._",
    "",
    `## Para revisar (${rev.length})`,
    rev.length ? rev.map((a) => bloque(a, ++n)).join("\n\n") : "_Sin hallazgos._",
    "",
    `<details><summary>Descartados (${des.length})</summary>\n\n` + (des.map((a) => `- [${a.titulo}](${a.url}) — ${a.tipo}${a.motivo ? ": " + a.motivo : ""}`).join("\n") || "Ninguno") + "\n\n</details>",
    "",
    `<details><summary>Ya citados en las guías (${yaCitados.length})</summary>\n\n` + (yaCitados.map((a) => `- [${a.titulo}](${a.url})`).join("\n") || "Ninguno") + "\n\n</details>",
    "",
    "---",
    `Vigilancia automática CaVeSal® Academy · ${PRUEBA ? "corrida de prueba · " : ""}modelo: ${SIN_IA ? "sin IA" : modeloActual} · ${new Date().toISOString()}`,
  ].join("\n");
  if (cuerpo.length > 64000) cuerpo = cuerpo.slice(0, 63500) + "\n\n_(Informe recortado por largo: ver la corrida en Actions.)_";

  // Publicar
  let issueUrl = "";
  const hayAlgo = imp.length + rev.length > 0;
  if (SIN_PUBLICAR) {
    writeFileSync(join(DIR, "ultimo-informe.md"), `# ${titulo}\n\n${cuerpo}`);
    console.log("Informe escrito en vigilancia/ultimo-informe.md (sin publicar)");
  } else if (hayAlgo || PRUEBA) {
    const r = await bajar(`https://api.github.com/repos/${ENV.GITHUB_REPOSITORY}/issues`, {
      method: "POST",
      headers: { Authorization: "Bearer " + ENV.GITHUB_TOKEN, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ title: titulo, body: cuerpo }),
    }, 2);
    issueUrl = (await r.json()).html_url;
    console.log("Issue:", issueUrl);
  }

  // Telegram
  const ficha = (a) => (a.ficha ? etiquetaTema(a) + " › " + fichaPorId[a.ficha].titulo : etiquetaTema(a));
  const lineas = [
    `${PRUEBA ? "[PRUEBA] " : ""}CaVeSal Evidencia — ${mes}`,
    hayAlgo ? "" : "Sin novedades que afecten las guías este mes.",
    imp.length ? `IMPORTANTE (${imp.length}): cambia una conducta o un punto de corte` : "",
    ...imp.slice(0, 6).map((a) => " · " + ficha(a) + " — " + a.tipo),
    imp.length > 6 ? ` · y ${imp.length - 6} más` : "",
    rev.length ? `PARA REVISAR (${rev.length}): suma evidencia, no cambia conducta` : "",
    `DESCARTADOS (${des.length}) · YA CITADOS (${yaCitados.length})`,
    avisos.length ? "Aviso: " + avisos.join(" · ") : "",
    issueUrl ? "Ver informe: " + issueUrl : "",
  ].filter((x) => x !== "");
  const texto = lineas.join("\n").slice(0, 4000);
  if (SIN_PUBLICAR) console.log("--- Telegram ---\n" + texto);
  else if (ENV.TELEGRAM_BOT_TOKEN && ENV.TELEGRAM_CHAT_ID) {
    const r = await fetch(`https://api.telegram.org/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: ENV.TELEGRAM_CHAT_ID, text: texto, disable_web_page_preview: true, disable_notification: imp.length === 0 }),
    });
    console.log("Telegram:", r.status, r.ok ? "enviado" : (await r.text()).slice(0, 200));
  } else console.log("Telegram no configurado: falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID");

  // Estado (no se guarda en pruebas)
  if (!PRUEBA && !SIN_PUBLICAR) {
    const nuevosVistos = [...articulos, ...yaCitados].map((a) => a.clave);
    const lista = [...(estado.vistos || []), ...nuevosVistos].slice(-5000);
    writeFileSync(estadoPath, JSON.stringify({ ultima_corrida: hoy.toISOString(), vistos: [...new Set(lista)], rcog: org.rcog }, null, 1));
    console.log("Estado guardado");
  }
}

await main();
