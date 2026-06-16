import { escapeHTML, heroHTML } from "./utils.js";

/* ============================================================
   MÓDULO ARQUITECTURA — grafo tipo FileMaker (Relationships Graph)
   Cajas arrastrables sobre un lienzo, conectadas por líneas SVG
   que las siguen al moverse. Clic en caja → campos (PK/FK/calc/legacy);
   clic en línea/relación → propiedades (creation, delete, sort).
   Datos: assets/data/architecture.json (extraídos del DDR).
   ============================================================ */

const BADGE = {
  pk: ["PK", "arq-b-pk"],
  fk: ["FK", "arq-b-fk"],
  calc: ["CALC", "arq-b-calc"],
  legacy: ["LEGACY", "arq-b-legacy"]
};

/* Posiciones iniciales de cada caja en el lienzo (x,y en px). */
const LAYOUT = {
  Publicaciones:          { x: 40,  y: 30 },
  Publicaciones_Log:      { x: 360, y: 30 },
  Publicacion_Multimedia: { x: 360, y: 200 },
  Config_Plataformas:     { x: 40,  y: 250 }
};

function legendHTML(legend) {
  return legend
    .map((l) => `<span><i class="arq-dot arq-dot-${l.k}"></i> ${escapeHTML(l.label)}</span>`)
    .join("");
}

function boxHTML(t) {
  const pos = LAYOUT[t.id] || { x: 20, y: 20 };
  const dashed = t.dashed ? " arq-node-dashed" : "";
  const head = t.fields
    .slice(0, 4)
    .map((f) => {
      const tag = f.key ? `<span class="arq-mini ${BADGE[f.key][1]}">${BADGE[f.key][0]}</span>` : "";
      return `<div class="arq-node-row" data-field="${escapeHTML(f.name)}"><span>${escapeHTML(f.name)}</span>${tag}</div>`;
    })
    .join("");
  const more = t.fields.length > 4 ? `<div class="arq-node-more">+${t.fields.length - 4} campos más…</div>` : "";
  return `
    <div class="arq-node${dashed}" data-table="${escapeHTML(t.id)}" style="left:${pos.x}px;top:${pos.y}px" role="button" tabindex="0">
      <div class="arq-node-head"><i class="bi ${escapeHTML(t.icon)}"></i> ${escapeHTML(t.id)}</div>
      <div class="arq-node-body">${head}${more}</div>
    </div>`;
}

/* ---------- Bloques bajo el grafo ---------- */
function valueListsBlock(data) {
  if (!data.valueLists) return "";
  const cards = data.valueLists
    .map((vl) => {
      const chips = vl.values.map((v) => `<span class="arq-vl-chip">${escapeHTML(v)}</span>`).join("");
      return `
        <div class="arq-vl-card">
          <div class="arq-vl-head"><i class="bi bi-list-check"></i> ${escapeHTML(vl.name)}</div>
          <div class="arq-vl-chips">${chips}</div>
          <div class="arq-vl-used"><i class="bi bi-arrow-return-right"></i> ${escapeHTML(vl.usedIn)}</div>
          <p class="arq-vl-note">${escapeHTML(vl.note)}</p>
        </div>`;
    })
    .join("");
  return `
    <section class="arq-block">
      <h2 class="arq-block-h"><i class="bi bi-list-ul"></i> Listas de valores <span class="arq-count">${data.valueLists.length}</span></h2>
      <p class="arq-block-sub">Catálogos controlados que limitan los valores válidos de ciertos campos. Definidos en FileMaker (Manage Database ▸ Value Lists).</p>
      <div class="arq-vl-grid">${cards}</div>
    </section>`;
}

function calcBlock(data) {
  if (!data.calcFields) return "";
  const rows = data.calcFields
    .map(
      (c) => `
      <div class="arq-calc-card">
        <div class="arq-calc-head"><code>${escapeHTML(c.name)}</code><span class="arq-calc-type">${escapeHTML(c.type)}</span></div>
        <p class="arq-calc-desc">${escapeHTML(c.desc)}</p>
        <pre class="arq-calc-code">${escapeHTML(c.formula)}</pre>
      </div>`
    )
    .join("");
  return `
    <section class="arq-block">
      <h2 class="arq-block-h"><i class="bi bi-calculator"></i> Campos calculados <span class="arq-count">${data.calcFields.length}</span></h2>
      <p class="arq-block-sub">${escapeHTML(data.calcNote || "")}</p>
      <div class="arq-calc-grid">${rows}</div>
    </section>`;
}

function triggersBlock(data) {
  if (!data.triggers) return "";
  const rows = data.triggers
    .map(
      (t) => `
      <div class="arq-trig-card">
        <div class="arq-trig-event"><i class="bi bi-lightning-charge"></i> ${escapeHTML(t.event)}</div>
        <div class="arq-trig-scope">${escapeHTML(t.scope)}</div>
        <div class="arq-trig-arrow"><i class="bi bi-arrow-right"></i> <code>${escapeHTML(t.script)}</code></div>
        <p class="arq-trig-desc">${escapeHTML(t.desc)}</p>
      </div>`
    )
    .join("");
  return `
    <section class="arq-block">
      <h2 class="arq-block-h"><i class="bi bi-lightning-charge-fill"></i> Disparadores (script triggers) <span class="arq-count">${data.triggers.length}</span></h2>
      <p class="arq-block-sub">${escapeHTML(data.triggerNote || "")}</p>
      <div class="arq-trig-grid">${rows}</div>
    </section>`;
}


function createArqShell(data) {
  const boxes = data.tables.map(boxHTML).join("");
  return `
    <div class="arq">
      ${heroHTML({
        containerClass: "arq-hero",
        icon: "bi-diagram-3-fill",
        eyebrow: `Estructura · ${escapeHTML(data.source)}`,
        title: "Arquitectura de",
        titleAccent: "datos",
        desc: "Las cuatro tablas del módulo y sus relaciones, tal como se ven en el grafo de FileMaker. Arrastra las cajas para reacomodarlas; toca una caja o una línea para ver el detalle.",
        chips: ["4 tablas", "2 relaciones", "52 campos", "soft delete"]
      })}

      <div class="arq-stage">
        <div class="arq-canvas-wrap">
          <div class="arq-canvas-bar">
            <span><i class="bi bi-diagram-2"></i> Grafo de relaciones</span>
            <button type="button" class="arq-reset" id="arq-reset"><i class="bi bi-arrow-counterclockwise"></i> Reacomodar</button>
          </div>
          <div class="arq-canvas" id="arq-canvas">
            <svg class="arq-links" id="arq-links" aria-hidden="true"></svg>
            ${boxes}
          </div>
          <div class="arq-legend">${legendHTML(data.legend)}</div>
        </div>

        <div class="arq-panel" id="arq-panel">
          <div class="arq-empty"><i class="bi bi-hand-index"></i><p>Selecciona una tabla o una línea de relación para ver el detalle</p></div>
        </div>
      </div>

      ${valueListsBlock(data)}
      ${calcBlock(data)}
      ${triggersBlock(data)}
    </div>`;
}

function fieldRow(f) {
  const b = f.key ? `<span class="arq-badge ${BADGE[f.key][1]}">${BADGE[f.key][0]}</span>` : "";
  return `<div class="arq-field"><span class="arq-fname">${escapeHTML(f.name)}</span><span class="arq-ftype">${escapeHTML(f.type)}</span>${b}</div>`;
}

function tablePanel(t) {
  return `<h3>${escapeHTML(t.id)}</h3><p class="arq-ptype">${t.count} campos · ${escapeHTML(t.role)}</p>${t.fields.map(fieldRow).join("")}`;
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

/* Centro derecho/izquierdo de una caja relativo al lienzo */
/* Punto de anclaje en el borde de una caja, a la altura de un campo concreto.
   Si el campo no está visible en la caja, cae al centro vertical. */
function anchorOf(canvas, node, side, fieldName) {
  const c = canvas.getBoundingClientRect();
  const r = node.getBoundingClientRect();
  let y = r.top - c.top + r.height / 2;
  if (fieldName) {
    const row = node.querySelector(`.arq-node-row[data-field="${fieldName}"]`);
    if (row) {
      const rr = row.getBoundingClientRect();
      y = rr.top - c.top + rr.height / 2;
    }
  }
  const x = side === "right" ? r.left - c.left + r.width : r.left - c.left;
  return { x, y };
}

function drawLinks(section, data) {
  const canvas = section.querySelector("#arq-canvas");
  const svg = section.querySelector("#arq-links");
  const pub = canvas.querySelector('[data-table="Publicaciones"]');
  if (!pub) return;
  let paths = "";
  data.relations.forEach((rel) => {
    const child = canvas.querySelector(`[data-table="${rel.from}"]`);
    if (!child) return;
    // Extraer los campos del match: "Tabla::CampoPadre = Hijo::CampoHijo"
    let fPadre = null, fHijo = null;
    const m = /::\s*([A-Za-z_]+)\s*=\s*[A-Za-z_]+::\s*([A-Za-z_]+)/.exec(rel.match || "");
    if (m) { fPadre = m[1]; fHijo = m[2]; }
    const a = anchorOf(canvas, pub, "right", fPadre);
    const b = anchorOf(canvas, child, "left", fHijo);
    const midx = (a.x + b.x) / 2;
    const d = `M ${a.x} ${a.y} C ${midx} ${a.y}, ${midx} ${b.y}, ${b.x} ${b.y}`;
    paths += `<path d="${d}" class="arq-link" data-rel="${rel.id}" fill="none"/>`;
    // marca en el extremo hijo (lado "muchos")
    paths += `<circle cx="${b.x}" cy="${b.y}" r="3" class="arq-link-end" data-rel="${rel.id}"/>`;
  });
  svg.innerHTML = paths;
  // re-enganchar clic en líneas
  svg.querySelectorAll('[data-rel]').forEach((el) => {
    el.addEventListener("click", () => selectRel(section, data, el.dataset.rel));
  });
}

function clearActive(section) {
  section.querySelectorAll(".arq-node").forEach((e) => e.classList.remove("active"));
  section.querySelectorAll(".arq-link, .arq-link-end").forEach((e) => e.classList.remove("active"));
}

function selectTable(section, data, id) {
  clearActive(section);
  const node = section.querySelector(`.arq-node[data-table="${id}"]`);
  if (node) node.classList.add("active");
  const t = data.tables.find((x) => x.id === id);
  section.querySelector("#arq-panel").innerHTML = tablePanel(t);
}

function selectRel(section, data, id) {
  clearActive(section);
  section.querySelectorAll(`.arq-link[data-rel="${id}"], .arq-link-end[data-rel="${id}"]`).forEach((e) => e.classList.add("active"));
  const r = data.relations.find((x) => x.id === id);
  section.querySelector("#arq-panel").innerHTML = relPanel(r);
}

function makeDraggable(section, data) {
  const canvas = section.querySelector("#arq-canvas");
  let drag = null;
  section.querySelectorAll(".arq-node").forEach((node) => {
    node.addEventListener("pointerdown", (e) => {
      drag = {
        node,
        startX: e.clientX,
        startY: e.clientY,
        origX: parseFloat(node.style.left),
        origY: parseFloat(node.style.top),
        moved: false
      };
      node.setPointerCapture(e.pointerId);
      node.classList.add("dragging");
    });
    node.addEventListener("pointermove", (e) => {
      if (!drag || drag.node !== node) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      let nx = Math.max(0, Math.min(drag.origX + dx, cw - node.offsetWidth));
      let ny = Math.max(0, Math.min(drag.origY + dy, ch - node.offsetHeight));
      node.style.left = nx + "px";
      node.style.top = ny + "px";
      drawLinks(section, data);
    });
    const end = (e) => {
      if (!drag || drag.node !== node) return;
      node.classList.remove("dragging");
      if (!drag.moved) selectTable(section, data, node.dataset.table);
      drag = null;
    };
    node.addEventListener("pointerup", end);
    node.addEventListener("pointercancel", end);
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectTable(section, data, node.dataset.table);
      }
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
    makeDraggable(section, data);
    // primer trazo (esperar layout)
    requestAnimationFrame(() => drawLinks(section, data));
    // redibujar al cambiar tamaño y al activar la pestaña
    window.addEventListener("resize", () => drawLinks(section, data));
    const reset = section.querySelector("#arq-reset");
    if (reset) {
      reset.addEventListener("click", () => {
        data.tables.forEach((t) => {
          const n = section.querySelector(`.arq-node[data-table="${t.id}"]`);
          const p = LAYOUT[t.id];
          if (n && p) { n.style.left = p.x + "px"; n.style.top = p.y + "px"; }
        });
        drawLinks(section, data);
      });
    }
    // si la sección estaba oculta al renderizar, redibujar cuando se muestre
    const nav = document.querySelector('[data-section="arquitectura"]');
    if (nav) nav.addEventListener("click", () => requestAnimationFrame(() => drawLinks(section, data)));
  } catch (error) {
    console.error("Error en renderArquitectura:", error);
    renderArqError(section);
  }
}