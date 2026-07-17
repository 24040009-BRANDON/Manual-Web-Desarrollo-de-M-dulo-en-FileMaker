import { escapeHTML, heroBackgroundHTML } from "./utils.js";

/**
 * Resaltador de sintaxis ligero para código FileMaker (Script Steps y
 * cálculos). Tokeniza en una sola pasada de izquierda a derecha para no
 * re-procesar lo ya coloreado. Escapa cada pieza con escapeHTML.
 * La consola se ve igual en ambos temas (fondo oscuro + colores brillantes).
 */
function highlightFileMaker(rawCode) {
  const code = String(rawCode ?? "");

  const keywords = [
    "Else If", "End If", "If", "Else", "Exit Loop If", "End Loop", "Loop",
    "Set Field", "Set Variable", "Show Custom Dialog", "Perform Script",
    "Exit Script", "Go to Layout", "Go to Field", "Enter Find Mode",
    "Perform Find", "Commit Records/Requests", "New Record/Request",
    "Delete Portal Row", "Delete Record/Request", "Refresh Window",
    "Refresh Object", "Insert File", "Insert from URL", "New Window",
    "Close Window", "Pause/Resume Script", "Allow User Abort",
    "Set Error Capture", "Freeze Window", "Go to Record/Request/Page",
    "Show All Records"
  ].sort((a, b) => b.length - a.length);

  const funcs = ["Get", "IsEmpty", "Length", "Left", "Right", "Middle",
    "Count", "Trim", "Upper", "Lower", "GetValue", "ValueCount",
    "ExecuteSQL", "Substitute", "Position", "Abs", "Round", "Int"];

  const esc = (s) => escapeHTML(s);
  const wrap = (cls, s) => `<span class="${cls}">${esc(s)}</span>`;

  let out = "";
  let i = 0;
  const n = code.length;

  const startsWith = (list, pos) => {
    for (const w of list) {
      if (code.startsWith(w, pos)) {
        // límite de palabra a la derecha
        const after = code[pos + w.length];
        if (after === undefined || /[^A-Za-z0-9_]/.test(after)) return w;
      }
    }
    return null;
  };

  while (i < n) {
    const ch = code[i];

    // Comentario de línea: # ... hasta fin de línea
    if (ch === "#" && (i === 0 || code[i - 1] === "\n")) {
      let j = code.indexOf("\n", i);
      if (j === -1) j = n;
      out += wrap("fmh-comment", code.slice(i, j));
      i = j;
      continue;
    }
    // String entre comillas dobles
    if (ch === '"') {
      let j = i + 1;
      while (j < n && code[j] !== '"') j++;
      out += wrap("fmh-string", code.slice(i, Math.min(j + 1, n)));
      i = j + 1;
      continue;
    }
    // Variable $var / $$global
    if (ch === "$") {
      let j = i + 1;
      if (code[j] === "$") j++;
      while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++;
      out += wrap("fmh-var", code.slice(i, j));
      i = j;
      continue;
    }
    // Palabra que empieza con letra: keyword, función, Tabla::Campo, o texto
    if (/[A-Za-z]/.test(ch)) {
      // Tabla::Campo
      const fld = code.slice(i).match(/^[A-Z][A-Za-z0-9_]*::[A-Za-z0-9_]+/);
      if (fld) { out += wrap("fmh-field", fld[0]); i += fld[0].length; continue; }
      // keyword
      const kw = startsWith(keywords, i);
      if (kw) { out += wrap("fmh-keyword", kw); i += kw.length; continue; }
      // función (palabra seguida de '(')
      const word = code.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)[0];
      const rest = code.slice(i + word.length).match(/^\s*\(/);
      if (funcs.includes(word) && rest) {
        out += wrap("fmh-func", word); i += word.length; continue;
      }
      out += esc(word); i += word.length; continue;
    }
    // Número
    if (/[0-9]/.test(ch)) {
      const num = code.slice(i).match(/^\d+/)[0];
      out += wrap("fmh-num", num); i += num.length; continue;
    }
    // Cualquier otro carácter
    out += esc(ch); i++;
  }
  return out;
}


function ensureLayoutManualStyles() {
  const id = "layout-manual-css";

  if (document.getElementById(id)) {
    return;
  }

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "assets/css/layout-manual.css";
  document.head.appendChild(link);
}

function isEmptyFieldToken(value) {
  const clean = String(value || "").trim();

  return (
    !clean ||
    clean === "N/A" ||
    clean === "—" ||
    clean.toUpperCase() === "NA"
  );
}

function splitFieldTokens(value) {
  if (isEmptyFieldToken(value)) {
    return [];
  }

  return String(value)
    .split(/[\/,]/)
    .map((item) => item.trim())
    .filter((item) => !isEmptyFieldToken(item));
}

function normalizeScriptName(scriptName) {
  let main = String(scriptName || "").split("/")[0].trim();

  main = main.replace(/^\d+\s*[·.-]\s*/, "").trim();
  main = main.replace(/^(UI|API|NAV|LOG)\s*\|\s*/i, "").trim();
  main = main.replace(/\s*\[maestro\]$/i, "").trim();

  return main;
}

function badgeHTML(type) {
  const map = {
    "Field": "field",
    "Button": "button",
    "Portal": "portal",
    "Calculation": "calc",
    "Layout Part": "layout",
    "Button Bar": "button",
    "Button Group": "button",
    "Buttons": "button",
    "Rectangle + Buttons": "button",
    "Summary Field": "calc",
    "Layout + Script Trigger": "layout",
    "Rectangle + Calculation": "calc",
    "Rectangle + Calculation/Merge Field": "calc"
  };

  const cls = map[type] || "field";

  return `<span class="lm-ins-badge ${cls}">${escapeHTML(type)}</span>`;
}

function findField(fields, table, fieldName) {
  if (!fields[table] || isEmptyFieldToken(fieldName)) {
    return null;
  }

  const first = splitFieldTokens(fieldName)[0];

  if (!first) {
    return null;
  }

  return (
    fields[table].find((field) => field.name === first) ||
    fields[table].find((field) => String(fieldName).includes(field.name)) ||
    null
  );
}

function fieldExists(data, table, fieldText) {
  if (!table || table === "N/A") {
    return null;
  }

  const candidates = splitFieldTokens(fieldText);

  if (!candidates.length) {
    return null;
  }

  return candidates.map((candidate) => {
    const key = `${table}::${candidate}`;
    const alias = data.fieldAliases?.[key];

    if (alias) {
      const [aliasTable, aliasField] = alias.split("::");

      return {
        field: candidate,
        exists: true,
        alias: aliasField,
        aliasTable
      };
    }

    const exists =
      (data.existingFields?.[table] || []).includes(candidate) ||
      Boolean(data.calcManual?.[key]);

    return {
      field: candidate,
      exists,
      isCalc: Boolean(data.calcManual?.[key])
    };
  });
}

function renderFieldStatus(data, table, fieldText) {
  const status = fieldExists(data, table, fieldText);

  if (status === null) {
    return "";
  }

  return status
    .map((item) => {
      const calc = data.calcManual?.[`${table}::${item.field}`];

      if (item.exists) {
        let html = `
          <div class="lm-exists-field-box">
            <span class="lm-field-status-pill ok">EXISTE</span>
            El campo <strong>${escapeHTML(item.field)}</strong>${
              item.alias
                ? ` aparece en tu FM como <strong>${escapeHTML(item.alias)}</strong>`
                : ""
            }${item.isCalc || calc ? " y está documentado como campo auxiliar de cálculo." : "."}
          </div>
        `;

        if (calc) {
          html += `
            <div class="lm-create-steps">
              <strong>Fórmula documentada para ${escapeHTML(calc.name)}:</strong>
              <span class="lm-formula">${highlightFileMaker(calc.formula)}</span>
              <div style="margin-top:6px">
                Tipo: <strong>${escapeHTML(calc.type)}</strong> ·
                Resultado: <strong>${escapeHTML(calc.result)}</strong> ·
                Storage: <strong>${escapeHTML(calc.storage)}</strong>
              </div>
            </div>
          `;
        }

        return html;
      }

      return `
        <div class="lm-missing-field-box">
          <span class="lm-field-status-pill missing">NO EXISTE</span>
          El campo <strong>${escapeHTML(item.field)}</strong> no aparece en tus capturas.
          Si lo quieres usar, créalo en <strong>Manage Database → Fields</strong>
          o cambia el objeto para usar un campo existente.
        </div>
      `;
    })
    .join("");
}

function renderScriptDetail(data, scriptName) {
  if (!scriptName) {
    return "";
  }

  const main = normalizeScriptName(scriptName);
  const detail = data.scriptDetails?.[main];

  if (!detail) {
    return "";
  }

  return `
    <div class="lm-ins-section-title">Script explicado</div>
    <div class="lm-create-steps">
      <strong>${escapeHTML(main)}</strong><br>
      ${escapeHTML(detail.purpose)}
      <span class="lm-formula">${highlightFileMaker(detail.steps)}</span>
    </div>
  `;
}

function renderInspector(data, key) {
  const elements = data.elements || {};
  const fields = data.fields || {};
  const element = elements[key];

  if (!element) {
    return;
  }

  const firstField = splitFieldTokens(element.field)[0] || "";
  const field = findField(fields, element.table, firstField);

  const title = document.getElementById("lm-ins-title");
  const subtitle = document.getElementById("lm-ins-sub");
  const body = document.getElementById("lm-ins-body");

  if (!title || !subtitle || !body) {
    return;
  }

  title.innerHTML = `${badgeHTML(element.fm_object)} ${escapeHTML(element.title)}`;
  subtitle.textContent = element.explain;

  let html = `
    <div class="lm-kv"><span>Objeto FM</span><b>${escapeHTML(element.fm_object)}</b></div>
    <div class="lm-kv"><span>Nombre objeto</span><b>${escapeHTML(element.object_name)}</b></div>
    <div class="lm-kv"><span>Tabla</span><b>${escapeHTML(element.table)}</b></div>
    <div class="lm-kv"><span>Campo</span><b>${escapeHTML(element.field)}</b></div>
    <div class="lm-kv"><span>Script</span><b>${escapeHTML(element.script)}</b></div>

    <div class="lm-ins-section-title">Verificación contra tus capturas</div>
    ${
      renderFieldStatus(data, element.table, element.field) ||
      `<div class="lm-missing-field-box">
        Este elemento es visual o de navegación; no depende de un campo único de base de datos.
      </div>`
    }

    <div class="lm-ins-section-title">Uso técnico</div>
    <p style="color:#94a3b8;line-height:1.55">${escapeHTML(element.explain)}</p>
  `;

  if (field) {
    html += `
      <div class="lm-ins-section-title">Opciones del campo núcleo</div>
      <div class="lm-kv"><span>Tipo</span><b>${escapeHTML(field.type)}</b></div>
      <div class="lm-kv"><span>Rol</span><b>${escapeHTML(field.role || "Campo operativo")}</b></div>

      <div class="lm-ins-section-title">Auto-Enter</div>
      <ul>
        ${field.auto.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
      </ul>

      <div class="lm-ins-section-title">Validation</div>
      <ul>
        ${field.validation.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
      </ul>

      <div class="lm-ins-section-title">Storage</div>
      <ul>
        ${field.storage.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
      </ul>

      <div class="lm-ins-section-title">Modo de uso</div>
      <p style="color:#94a3b8;line-height:1.55">${escapeHTML(field.usage)}</p>
    `;
  } else if (!isEmptyFieldToken(element.field)) {
    html += `
      <div class="lm-missing-field-box">
        <strong>Este elemento no corresponde a un solo campo existente.</strong><br>
        Puede ser estructura visual, navegación, portal o grupo de campos.
        En el manual se indica si debes crear campos auxiliares o scripts.
      </div>
    `;
  }

  html += renderScriptDetail(data, element.script);

  body.innerHTML = html;
}

function createLayoutShell() {
  return `
    <div class="lm">
      <header class="lm-header lm-hero-detached has-hero-bg">
        ${heroBackgroundHTML()}
        <div class="hero-std">
          <span class="hero-eyebrow"><i class="bi bi-window-stack"></i> Interfaz · FileMaker 18 Advanced</span>
          <h1 class="hero-title">Manual interactivo del <span class="hero-grad">layout</span></h1>
          <p class="hero-desc">
            Manual del layout del módulo de Publicaciones. Incluye flujo controlado con
            <strong>Script 0 · Inicializar módulo Publicaciones</strong>, campos bloqueados hasta
            <strong>Nueva</strong> o <strong>Editar</strong>, y validaciones fuertes ejecutadas desde scripts.
          </p>
          <div class="hero-chips">
            <span class="hero-chip">Layout FileMaker</span>
            <span class="hero-chip">Inspector interactivo</span>
            <span class="hero-chip">Flujo controlado</span>
            <span class="hero-chip">Meta Graph API</span>
          </div>
        </div>
      </header>

      <div class="lm-layout">
        <main class="lm-mock-wrap">
          <div class="lm-mock-title">
            <strong>Vista recreada del módulo</strong>
            <span>Haz clic en cualquier elemento</span>
          </div>

          <div class="lm-mock">
            <section class="lm-main lm-clickable" data-el="layout-publicaciones">
              <div class="lm-topbar lm-clickable" data-el="topbar">
                <strong>Publicaciones</strong>

                <div class="lm-topbar-actions">
                  <button class="lm-btn secondary lm-clickable" data-el="btn-buscar" type="button">Buscar</button>
                  <button class="lm-btn secondary lm-clickable" data-el="btn-filtrar" type="button">Filtrar</button>
                  <button class="lm-btn secondary lm-clickable" data-el="btn-nueva" type="button">Nueva</button>
                  <button class="lm-btn warn lm-clickable" data-el="btn-editar" type="button">Editar</button>
                  <button class="lm-btn danger lm-clickable" data-el="btn-eliminar" type="button">Eliminar</button>
                </div>
              </div>

              <div class="lm-content">
                <div class="lm-stats">
                  <div class="lm-stat lm-clickable" data-el="stat-total"><small>Total</small><b style="color:#15803d">3</b></div>
                  <div class="lm-stat lm-clickable" data-el="stat-programadas"><small>Programadas</small><b style="color:#b45309">0</b></div>
                  <div class="lm-stat lm-clickable" data-el="stat-publicadas"><small>Publicadas</small><b style="color:#1d4ed8">2</b></div>
                  <div class="lm-stat lm-clickable" data-el="stat-error"><small>Con error</small><b style="color:#dc2626">0</b></div>
                  <div class="lm-stat lm-clickable" data-el="stat-borradores"><small>Borradores</small><b>0</b></div>
                </div>

                <div style="display:flex;gap:14px;justify-content:center;margin:14px 0 18px">
                  <button class="lm-btn secondary lm-clickable" data-el="btn-nav-primero" type="button" style="min-width:64px;font-size:16px" title="Primer registro">&#10229;</button>
                  <button class="lm-btn secondary lm-clickable" data-el="btn-nav-anterior" type="button" style="min-width:64px;font-size:16px" title="Registro anterior">&#10094;</button>
                  <button class="lm-btn secondary lm-clickable" data-el="btn-nav-siguiente" type="button" style="min-width:64px;font-size:16px" title="Registro siguiente">&#10095;</button>
                  <button class="lm-btn secondary lm-clickable" data-el="btn-nav-ultimo" type="button" style="min-width:64px;font-size:16px" title="Último registro">&#10230;</button>
                </div>

                <div class="lm-card">
                  <div class="lm-card-b">
                    <div class="lm-grid">
                      <div class="lm-clickable" data-el="id-publicacion" style="max-width:70px">
                        <div class="lm-label">ID</div>
                        <div class="lm-input">3</div>
                      </div>

                      <div class="lm-clickable" data-el="titulo">
                        <div class="lm-label">Título de la publicación</div>
                        <div class="lm-input">prueba 87213687</div>
                      </div>

                      <div class="lm-clickable" data-el="plat-facebook">
                        <div class="lm-label">Plataforma de destino</div>
                        <div class="lm-input" style="display:flex;justify-content:space-between;align-items:center">
                          <span>Facebook</span><span style="opacity:.5">&#9662;</span>
                        </div>
                      </div>

                      <div class="lm-clickable" data-el="semaforo-estado" style="max-width:110px">
                        <div class="lm-label">Estado</div>
                        <button id="lm-semaforo" type="button"
                                style="width:100%;border:none;border-radius:3px;padding:7px 10px;font-weight:600;font-size:12px;color:#fff;background:#15803d;cursor:pointer"
                                title="Clic para recorrer los estados">Publicado</button>
                      </div>

                      <div class="lm-full lm-clickable" data-el="leyenda-eliminada" style="border:1px dashed #dc2626;border-radius:6px;padding:6px 10px;text-align:center;color:#dc2626;font-weight:700;letter-spacing:.5px;font-size:13px">
                        PUBLICACIÓN ELIMINADA
                        <span style="display:block;font-weight:400;font-size:10.5px;letter-spacing:0;opacity:.75">solo visible cuando Estado = "Eliminado"</span>
                      </div>

                      <div class="lm-full lm-clickable" data-el="contenido">
                        <div class="lm-label">Contenido de la publicación</div>
                        <div class="lm-textarea" style="min-height:96px">candia</div>
                      </div>
                    </div>

                    <div class="lm-sep">Imagen y programación</div>

                    <div class="lm-grid">
                      <div class="lm-clickable" data-el="imagen">
                        <div class="lm-label">Imagen</div>
                        <div class="lm-thumb" style="width:96px;height:96px;display:flex;align-items:center;justify-content:center;border:1px solid var(--lm-line,#ccc);border-radius:4px">
                          <span style="font-size:11px;opacity:.6">Imagen_Container</span>
                        </div>
                        <button class="lm-link-btn lm-clickable" data-el="btn-limpiar-url" type="button" style="margin-top:6px">&#128465; Quitar</button>
                      </div>

                      <div class="lm-clickable" data-el="fecha">
                        <div class="lm-label">Fecha programada</div>
                        <div class="lm-input" style="display:flex;justify-content:space-between;align-items:center">
                          <span style="opacity:.45">dd/mm/aaaa</span><span style="opacity:.5">&#128197;</span>
                        </div>
                      </div>

                      <div class="lm-clickable" data-el="hora">
                        <div class="lm-label">Hora programada</div>
                        <div class="lm-input"><span style="opacity:.45">--:--</span></div>
                      </div>

                      <div class="lm-full lm-clickable" data-el="url">
                        <div class="lm-label">URL Pública <span style="font-weight:400;opacity:.7">(arrastra la imagen al campo de texto)</span></div>
                        <div class="lm-input lm-code-fm" style="word-break:break-all">https://dt-informatica.com.mx/Imagenes/pie.png</div>
                      </div>
                    </div>

                    <div class="lm-full lm-clickable" data-el="web-viewer" style="margin-top:12px">
                      <div style="border:1px solid var(--lm-line,#ccc);border-radius:4px;overflow:hidden">
                        <div style="background:#111;color:#fff;padding:9px 12px;display:flex;justify-content:space-between;align-items:center">
                          <strong style="font-size:14px">Subida de Archivos</strong>
                          <span style="font-size:10px;opacity:.75">DT Informática</span>
                        </div>
                        <div style="padding:12px;background:#fff">
                          <div style="color:#1d4ed8;font-weight:600;font-size:12px;margin-bottom:8px">SUBIR NUEVA IMAGEN</div>
                          <div style="border:1px dashed #bbb;border-radius:4px;padding:22px;text-align:center;font-size:11px;opacity:.55">
                            Arrastra una imagen aquí<br>o haz clic para seleccionar archivo
                          </div>
                        </div>
                        <div style="padding:6px 12px;font-size:10.5px;opacity:.6;border-top:1px solid #eee">
                          Web Viewer &#8594; https://dt-informatica.com.mx/Imagenes/upload.php
                        </div>
                      </div>
                    </div>

                    <div class="lm-clickable lm-actions" data-el="actions" style="text-align:center;margin-top:14px">
                      <button class="lm-btn danger lm-clickable" data-el="btn-cancelar" type="button">Cancelar</button>
                      <button class="lm-btn secondary lm-clickable" data-el="btn-guardar-borrador" type="button">Guardar borrador</button>
                      <button class="lm-btn green lm-clickable" data-el="btn-publicar-ahora" type="button">Publicar ahora</button>
                      <button class="lm-btn secondary lm-clickable" data-el="btn-abrir-publicacion" type="button">Abrir publicación</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <section class="lm-inspector">
          <div class="lm-ins-h">
            <div style="flex:1">
              <h2 id="lm-ins-title">
                <span id="lm-ins-badge"></span>
                Inspector de elementos
              </h2>

              <p id="lm-ins-sub">
                Haz clic sobre cualquier elemento del mockup para ver su traducción exacta a FileMaker 18 Advanced.
              </p>
            </div>

            <span class="lm-ins-hint">← Haz clic en el mockup</span>
          </div>

          <div class="lm-ins-b" id="lm-ins-body">
            <div class="lm-ins-empty">
              <strong>⬆</strong>
              Selecciona cualquier elemento del layout de arriba para ver:
              tipo de objeto FM · tabla y campo · script asignado · pasos para crearlo en FM18 · errores comunes
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

const ESTADOS_SEMAFORO = [
  { nombre: "Publicado", color: "#15803d" },
  { nombre: "Borrador", color: "#6c757d" },
  { nombre: "Programado", color: "#1b75bb" },
  { nombre: "Error", color: "#dc3545" },
  { nombre: "Eliminado", color: "#212529" },
];

function cicloSemaforo(root) {
  const boton = root.querySelector("#lm-semaforo");

  if (!boton) {
    return;
  }

  const actual = Number(boton.dataset.estadoIdx || 0);
  const siguiente = (actual + 1) % ESTADOS_SEMAFORO.length;
  const estado = ESTADOS_SEMAFORO[siguiente];

  boton.dataset.estadoIdx = String(siguiente);
  boton.textContent = estado.nombre;
  boton.style.background = estado.color;

  const leyenda = root.querySelector('[data-el="leyenda-eliminada"]');

  if (leyenda) {
    leyenda.style.display = estado.nombre === "Eliminado" ? "" : "none";
  }
}

function wireLayoutInteractions(root, data) {
  root.addEventListener(
    "click",
    (event) => {
      let target = event.target;

      while (target && target !== root) {
        if (target.dataset && target.dataset.el) {
          event.stopPropagation();

          if (target.dataset.el === "semaforo-estado") {
            cicloSemaforo(root);
          }

          root.querySelectorAll("[data-el]").forEach((element) => {
            element.classList.remove("selected");
          });

          target.classList.add("selected");
          renderInspector(data, target.dataset.el);

          return;
        }

        target = target.parentElement;
      }
    },
    true
  );

  const leyendaInicial = root.querySelector('[data-el="leyenda-eliminada"]');

  if (leyendaInicial) {
    leyendaInicial.style.display = "none";
  }

  const defaultElement = root.querySelector('[data-el="titulo"]');

  if (defaultElement) {
    defaultElement.classList.add("selected");
    renderInspector(data, "titulo");
  }
}

function renderLayoutError(container) {
  container.innerHTML = `
    <div class="section-placeholder">
      <h2>No se pudo cargar la sección Diseño y arquitectura del Layout</h2>
      <p>
        Revisa que existan
        <code>assets/data/layout-elements.json</code>,
        <code>assets/js/renderLayout.js</code>
        y
        <code>assets/css/layout-manual.css</code>.
        Abre el proyecto con Live Server.
      </p>
    </div>
  `;
}

export async function renderLayout() {
  const layoutSection = document.getElementById("layout");

  if (!layoutSection) {
    console.warn("No existe la sección #layout.");
    return;
  }

  ensureLayoutManualStyles();

  try {
    const response = await fetch("assets/data/layout-elements.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar assets/data/layout-elements.json");
    }

    const data = await response.json();

    layoutSection.innerHTML = createLayoutShell();
    wireLayoutInteractions(layoutSection, data);
  } catch (error) {
    console.error("Error en renderLayout:", error);
    renderLayoutError(layoutSection);
  }
}