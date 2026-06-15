import { escapeHTML } from "./utils.js";

/* ============================================================
   MÓDULO ARQUITECTURA — manual interactivo
   Grafo de relaciones: clic en tabla → campos (PK/FK/calc/legacy);
   clic en relación → propiedades (creation, delete, sort).
   Datos: assets/data/architecture.json (extraídos del DDR).
   ============================================================ */

const BADGE = {
  pk: ["PK", "arq-b-pk"],
  fk: ["FK", "arq-b-fk"],
  calc: ["CALC", "arq-b-calc"],
  legacy: ["LEGACY", "arq-b-legacy"]
};

function tableNode(t) {
  const cnt = `<span class="arq-cnt">· ${t.count} campos</span>`;
  const dashed = t.dashed ? " arq-dashed" : "";
  const parent = t.isParent ? " arq-parent" : "";
  return `
    <div class="arq-tbl${dashed}${parent}" data-table="${escapeHTML(t.id)}" role="button" tabindex="0">
      <div class="arq-name"><i class="bi ${escapeHTML(t.icon)}"></i> ${escapeHTML(t.id)} ${cnt}</div>
      <div class="arq-role">${escapeHTML(t.role)}</div>
    </div>`;
}

function relButton(r) {
  return `<button class="arq-rel" type="button" data-rel="${escapeHTML(r.id)}">${escapeHTML(r.cardinality)} → ${escapeHTML(r.from)}</button>`;
}

function legendHTML(legend) {
  return legend
    .map((l) => `<span><i class="arq-dot arq-dot-${l.k}"></i> ${escapeHTML(l.label)}</span>`)
    .join("");
}

function createArqShell(data) {
  const t = Object.fromEntries(data.tables.map((x) => [x.id, x]));
  const relById = Object.fromEntries(data.relations.map((x) => [x.id, x]));
  return `
    <div class="arq-wrap">
      <div class="arq-head">
        <h2>Arquitectura de datos — interactiva</h2>
        <p>Toca una tabla para ver sus campos (PK/FK/calculado/legacy) o una relación para ver sus propiedades.</p>
      </div>
      <div class="arq-stage">
        <div class="arq-diagram">
          <h3>Grafo de relaciones</h3>
          <div class="arq-tables">
            ${tableNode(t["Publicaciones"])}
            <div class="arq-relwrap"><span class="arq-vline"></span>${relButton(relById["log"])}</div>
            ${tableNode(t["Publicaciones_Log"])}
            <div class="arq-relwrap"><span class="arq-vline"></span>${relButton(relById["media"])}</div>
            ${tableNode(t["Publicacion_Multimedia"])}
            <div class="arq-gap"></div>
            ${tableNode(t["Config_Plataformas"])}
          </div>
          <div class="arq-legend">${legendHTML(data.legend)}</div>
        </div>
        <div class="arq-panel" id="arq-panel">
          <div class="arq-empty"><i class="bi bi-hand-index"></i><p>Selecciona una tabla o relación para ver el detalle</p></div>
        </div>
      </div>
    </div>`;
}

function fieldRow(f) {
  const b = f.key ? `<span class="arq-badge ${BADGE[f.key][1]}">${BADGE[f.key][0]}</span>` : "";
  return `<div class="arq-field"><span class="arq-fname">${escapeHTML(f.name)}</span><span class="arq-ftype">${escapeHTML(f.type)}</span>${b}</div>`;
}

function tablePanel(t) {
  return `
    <h3>${escapeHTML(t.id)}</h3>
    <p class="arq-ptype">${t.count} campos</p>
    ${t.fields.map(fieldRow).join("")}`;
}

function relPanel(r) {
  const cls = (v) => (v === "On" ? "on" : v === "Off" ? "off" : "");
  return `
    <h3>${escapeHTML(r.title)}</h3>
    <p class="arq-ptype">Relación ${escapeHTML(r.cardinality)}</p>
    <div class="arq-relrow"><span class="k">Coincidencia</span><span class="v arq-match">${escapeHTML(r.match)}</span></div>
    <div class="arq-relrow"><span class="k">Allow creation</span><span class="v ${cls(r.create)}">${escapeHTML(r.create)}</span></div>
    <div class="arq-relrow"><span class="k">Delete related (cascada)</span><span class="v ${cls(r.delete)}">${escapeHTML(r.delete)}</span></div>
    <div class="arq-relrow"><span class="k">Sort records</span><span class="v">${escapeHTML(r.sort)}</span></div>
    <div class="arq-note">${escapeHTML(r.note)}</div>`;
}

function wireArq(section, data) {
  const t = Object.fromEntries(data.tables.map((x) => [x.id, x]));
  const relById = Object.fromEntries(data.relations.map((x) => [x.id, x]));
  const panel = section.querySelector("#arq-panel");
  const clearActive = () =>
    section.querySelectorAll(".arq-tbl, .arq-rel").forEach((e) => e.classList.remove("active"));

  section.querySelectorAll(".arq-tbl").forEach((el) => {
    const act = () => {
      clearActive();
      el.classList.add("active");
      panel.innerHTML = tablePanel(t[el.dataset.table]);
    };
    el.addEventListener("click", act);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        act();
      }
    });
  });

  section.querySelectorAll(".arq-rel").forEach((el) => {
    el.addEventListener("click", () => {
      clearActive();
      el.classList.add("active");
      panel.innerHTML = relPanel(relById[el.dataset.rel]);
    });
  });
}

function renderArqError(container) {
  container.innerHTML = `
    <div class="section-placeholder">
      <h2>No se pudo cargar el módulo Arquitectura</h2>
      <p>Revisa que existan <code>assets/data/architecture.json</code>, <code>assets/js/renderArquitectura.js</code> y <code>assets/css/arquitectura.css</code>. Abre el proyecto con Live Server.</p>
    </div>`;
}

export async function renderArquitectura() {
  const section = document.getElementById("arquitectura");
  if (!section) {
    console.warn("No existe la sección #arquitectura.");
    return;
  }
  try {
    const response = await fetch("assets/data/architecture.json");
    if (!response.ok) throw new Error("No se pudo cargar assets/data/architecture.json");
    const data = await response.json();
    section.innerHTML = createArqShell(data);
    wireArq(section, data);
  } catch (error) {
    console.error("Error en renderArquitectura:", error);
    renderArqError(section);
  }
}