import { escapeHTML } from "./utils.js";

/* ==========================================================================
   Recreación funcional de la ventana "Manage Database" de FileMaker.
   - Permanece OCULTA tras una vista previa pequeña ("Mostrar administrador
     de base de datos"); al hacer clic se despliega.
   - Pestaña inicial: Tables.
   - Tables / Fields interactivas; al elegir una tabla en Tables y pasar a
     Fields se muestran SUS campos (navegación entre las 4 tablas).
   - Relationships navega a la sección "Arquitectura de datos".
   Estética neutra (Windows), definida en fm-window.css.
   ========================================================================== */

/* Datos reales (capturas + database.json) */
const TABLES = [
  { name: "Publicaciones", source: "FileMaker", details: "27 fields, 6 records", graph: "Publicaciones" },
  { name: "Publicaciones_Log", source: "FileMaker", details: "11 fields, 11 records", graph: "Publicaciones_Log" },
  { name: "Config_Plataformas", source: "FileMaker", details: "7 fields, 1 record", graph: "Config_Plataformas" },
  { name: "Publicacion_Multimedia", source: "FileMaker", details: "7 fields, 0 records", graph: "Publicacion_Multimedia" }
];

/* Campos por tabla. Las "options" de Publicaciones provienen de la captura real. */
const FIELDS_BY_TABLE = {
  Publicaciones: [
    ["ID_Publicacion", "Number", "Indexed, Auto-enter Serial, Can't Modify Auto, Unique, Allow Override"],
    ["Titulo", "Text", "Indexed"],
    ["Contenido_Texto", "Text", "Indexed, By Calculation, Allow Override"],
    ["URL_Imagen", "Text", "By Calculation, Allow Override"],
    ["Imagen_Container", "Container", ""],
    ["Plataforma_Destino", "Text", "Auto-enter Data, By Value List, Allow Override"],
    ["Estado", "Text", "Indexed, Auto-enter Data, By Value List, Allow Override"],
    ["Fecha_Programada", "Date", "By Calculation, 4-Digit Year Date, Allow Override"],
    ["Hora_Programada", "Time", ""],
    ["Fecha_Publicacion_Real", "Timestamp", ""],
    ["Post_ID_API", "Text", ""],
    ["Respuesta_API_JSON", "Text", ""],
    ["Permalink_URL", "Text", ""],
    ["Codigo_Error", "Text", ""],
    ["Detalle_Error", "Text", ""],
    ["Hashtags", "Text", "Indexed"],
    ["Creado_Por", "Text", "Creation Account Name, Can't Modify Auto"],
    ["Fecha_Creacion", "Timestamp", "Creation Timestamp (Date and Time), Can't Modify Auto"],
    ["Modificado_Por", "Text", "Modification Account Name"],
    ["Modificado_En", "Timestamp", "Modification Timestamp (Date and Time)"],
    ["c_Total_Publicaciones", "Calculation", '= ExecuteSQL ( "SELECT COUNT(*) FROM Publicaciones" ; "" ; "" )'],
    ["c_Total_Programadas", "Calculation", '= ExecuteSQL ( "SELECT COUNT(*) FROM Publicaciones WHERE Estado = ?…'],
    ["c_Total_Publicadas", "Calculation", '= ExecuteSQL ( "SELECT COUNT(*) FROM Publicaciones WHERE Estado = ?…'],
    ["c_Total_Error", "Calculation", '= ExecuteSQL ( "SELECT COUNT(*) FROM Publicaciones WHERE Estado = ?…'],
    ["c_Total_Borradores", "Calculation", '= ExecuteSQL ( "SELECT COUNT(*) FROM Publicaciones WHERE Estado = ?…'],
    ["Fecha_Eliminacion", "Timestamp", ""],
    ["Eliminado_Por", "Text", ""]
  ],
  Publicaciones_Log: [
    ["ID_Log", "Number", "Indexed, Auto-enter Serial, Can't Modify Auto, Unique"],
    ["ID_Publicacion", "Number", "Indexed"],
    ["Plataforma", "Text", "Auto-enter Data, By Value List"],
    ["Fecha_Intento", "Timestamp", "Creation Timestamp (Date and Time)"],
    ["Resultado", "Text", "Auto-enter Data, By Value List"],
    ["Post_ID_Retornado", "Text", ""],
    ["Permalink_URL", "Text", ""],
    ["HTTP_Status_Code", "Number", ""],
    ["JSON_Completo", "Text", ""],
    ["Token_Usado", "Text", ""],
    ["Notas_Internas", "Text", ""]
  ],
  Config_Plataformas: [
    ["ID_Config", "Number", "Indexed, Auto-enter Serial, Can't Modify Auto, Unique"],
    ["Nombre_Plataforma", "Text", "Auto-enter Data, By Value List"],
    ["ID_Cuenta_Meta", "Text", ""],
    ["Access_Token", "Text", ""],
    ["Token_Expiracion", "Date", "4-Digit Year Date"],
    ["API_Version", "Text", "Auto-enter Data"],
    ["Activo", "Number", "Auto-enter Data"]
  ],
  Publicacion_Multimedia: [
    ["ID_Media", "Number", "Indexed, Auto-enter Serial, Can't Modify Auto, Unique"],
    ["ID_Publicacion", "Number", "Indexed"],
    ["Tipo_Media", "Text", "Auto-enter Data, By Value List"],
    ["Archivo_Container", "Container", ""],
    ["URL_Publica", "Text", ""],
    ["Orden", "Number", "Auto-enter Data"],
    ["Estado_Subida", "Text", "Auto-enter Data, By Value List"]
  ]
};

/* Estado interno: tabla seleccionada actualmente */
let selectedTable = "Publicaciones";

function tablesRows() {
  return TABLES.map(
    (t) => `
    <tr class="${t.name === selectedTable ? "selected" : ""}" data-fmw-table="${escapeHTML(t.name)}">
      <td><span class="fmw-diamond"></span><span class="fmw-fieldname">${escapeHTML(t.name)}</span></td>
      <td class="fmw-source">${escapeHTML(t.source)}</td>
      <td class="fmw-details">${escapeHTML(t.details)}</td>
      <td class="fmw-fieldname">${escapeHTML(t.graph)}</td>
    </tr>`
  ).join("");
}

function fieldsRows() {
  const rows = FIELDS_BY_TABLE[selectedTable] || [];
  return rows.map(
    ([name, type, opt]) => `
    <tr>
      <td><span class="fmw-diamond"></span><span class="fmw-fieldname">${escapeHTML(name)}</span></td>
      <td class="fmw-type">${escapeHTML(type)}</td>
      <td class="fmw-options">${escapeHTML(opt)}</td>
    </tr>`
  ).join("");
}

function tableOptions() {
  return TABLES.map(
    (t) => `<option ${t.name === selectedTable ? "selected" : ""}>${escapeHTML(t.name)}</option>`
  ).join("");
}

function viewTables() {
  return `
    <div class="fmw-toolbar">
      <span class="fmw-count">4 tables defined in this file</span>
      <span class="fmw-viewby">View by:
        <select disabled><option>creation order</option></select>
      </span>
    </div>
    <div class="fmw-scroll">
      <table class="fmw-grid">
        <thead>
          <tr><th>Table Name</th><th>Source</th><th>Details</th><th>Occurrences in Graph</th></tr>
        </thead>
        <tbody data-fmw-tables-body>${tablesRows()}</tbody>
      </table>
    </div>`;
}

function viewFields() {
  const count = (FIELDS_BY_TABLE[selectedTable] || []).length;
  return `
    <div class="fmw-toolbar">
      <span class="fmw-viewby">Table:
        <select class="fmw-table-select" data-fmw-table-select>${tableOptions()}</select>
        <span class="fmw-count" style="margin-left:8px">${count} fields</span>
      </span>
      <span class="fmw-viewby">View by:
        <select disabled><option>custom order</option></select>
      </span>
    </div>
    <div class="fmw-scroll">
      <table class="fmw-grid">
        <thead>
          <tr><th>Field Name</th><th>Type</th><th>Options / Comments</th></tr>
        </thead>
        <tbody>${fieldsRows()}</tbody>
      </table>
    </div>`;
}

export function fileMakerWindowHTML() {
  return `
    <section class="fmw-wrap" id="dbm-manage">
      <p class="fmw-caption">Así se ve la base en FileMaker. Cambia entre <strong>Tables</strong> y <strong>Fields</strong>; <strong>Relationships</strong> abre el grafo en Arquitectura de datos.</p>

      <!-- Vista previa pequeña (la ventana inicia oculta) -->
      <button class="fmw-preview" type="button" data-fmw-show>
        <span class="fmw-preview-mini" aria-hidden="true">
          <span class="fmw-preview-bar"><span class="fmw-preview-dot"></span><span class="fmw-preview-dot"></span><span class="fmw-preview-dot"></span></span>
          <span class="fmw-preview-rows"><span></span><span></span><span></span></span>
        </span>
        <span class="fmw-preview-label">
          <strong>Mostrar administrador de base de datos</strong>
          <small>Ventana "Manage Database" de FileMaker — interactiva</small>
        </span>
      </button>

      <!-- Ventana real, oculta por defecto -->
      <div class="fmw-collapse" data-fmw-collapse hidden>
        <div class="fmw" data-fmw>
          <div class="fmw-titlebar">
            <span class="fmw-tt-left">Manage Database for "Publicaciones"</span>
            <span class="fmw-tt-right"><span>?</span><span class="fmw-x" data-fmw-close title="Ocultar">✕</span></span>
          </div>
          <div class="fmw-tabs">
            <button class="fmw-tab active" data-fmw-tab="tables" type="button">Tables</button>
            <button class="fmw-tab" data-fmw-tab="fields" type="button">Fields</button>
            <button class="fmw-tab" data-fmw-tab="relationships" type="button" data-goto="arquitectura">Relationships</button>
          </div>
          <div class="fmw-body" data-fmw-body>${viewTables()}</div>
          <div class="fmw-footer">
            <button class="fmw-btn" type="button">Print…</button>
            <span style="flex:1"></span>
            <button class="fmw-btn primary" type="button">OK</button>
            <button class="fmw-btn" type="button">Cancel</button>
          </div>
        </div>
        <p class="fmw-hint">Recreación fiel de la ventana real. Elige una tabla en <code>Tables</code> y abre <code>Fields</code> para ver sus campos.</p>
      </div>
    </section>`;
}

/* Activa la interactividad (llamar tras inyectar el HTML).
   onRelationships: callback para navegar a Arquitectura de datos. */
export function initFileMakerWindow(onRelationships) {
  const wrap = document.querySelector("#dbm-manage");
  if (!wrap) return;

  selectedTable = "Publicaciones";

  const preview = wrap.querySelector("[data-fmw-show]");
  const collapse = wrap.querySelector("[data-fmw-collapse]");
  const root = wrap.querySelector("[data-fmw]");
  const body = wrap.querySelector("[data-fmw-body]");
  const tabs = wrap.querySelectorAll("[data-fmw-tab]");
  const closeBtn = wrap.querySelector("[data-fmw-close]");

  // Mostrar / ocultar la ventana
  if (preview && collapse) {
    preview.addEventListener("click", () => {
      collapse.hidden = false;
      preview.style.display = "none";
    });
  }
  if (closeBtn && collapse && preview) {
    closeBtn.addEventListener("click", () => {
      collapse.hidden = true;
      preview.style.display = "";
    });
  }

  function setTab(which) {
    if (which === "relationships") {
      if (typeof onRelationships === "function") onRelationships();
      return;
    }
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.fmwTab === which));
    body.innerHTML = which === "tables" ? viewTables() : viewFields();
    wireBody(which);
  }

  // Delegación dentro del cuerpo (filas de tablas y selector de tabla)
  function wireBody(which) {
    if (which === "tables") {
      body.querySelectorAll("[data-fmw-table]").forEach((tr) => {
        tr.addEventListener("click", () => {
          selectedTable = tr.dataset.fmwTable;
          body.querySelectorAll("[data-fmw-table]").forEach((r) =>
            r.classList.toggle("selected", r === tr)
          );
        });
        // Doble clic en una tabla abre sus Fields (como FileMaker)
        tr.addEventListener("dblclick", () => {
          selectedTable = tr.dataset.fmwTable;
          setTab("fields");
        });
      });
    } else {
      const sel = body.querySelector("[data-fmw-table-select]");
      if (sel) {
        sel.addEventListener("change", () => {
          selectedTable = sel.value;
          body.innerHTML = viewFields();
          wireBody("fields");
        });
      }
    }
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => setTab(tab.dataset.fmwTab)));

  // Estado inicial: Tables
  wireBody("tables");
}