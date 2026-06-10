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
      <header class="lm-header has-hero-bg">
        ${heroBackgroundHTML()}
        <h1>Manual técnico interactivo — FileMaker 18 Advanced</h1>
        <p>
          Manual del layout del módulo de Publicaciones. Incluye flujo controlado con
          <strong>Script 0 · Inicializar módulo Publicaciones</strong>, campos bloqueados hasta
          <strong>Nueva</strong> o <strong>Editar</strong>, y validaciones fuertes ejecutadas desde scripts.
        </p>
      </header>

      <div class="lm-layout">
        <main class="lm-mock-wrap">
          <div class="lm-mock-title">
            <strong>Vista recreada del módulo</strong>
            <span>Haz clic en cualquier elemento</span>
          </div>

          <div class="lm-mock">
            <aside class="lm-sidebar lm-clickable" data-el="sidebar">
              <div class="lm-logo">
                <div class="lm-brand">DT Informática</div>
                <div class="lm-sub">Módulo de Publicaciones</div>
              </div>

              <div class="lm-nav-sec">Publicaciones</div>
              <div class="lm-nav active">Panel principal</div>
              <div class="lm-nav">Nueva publicación</div>
              <div class="lm-nav">Programadas</div>
              <div class="lm-nav">Publicadas</div>
              <div class="lm-nav">Con errores</div>

              <div class="lm-nav-sec">Sistema</div>
              <div class="lm-nav">Config. plataformas</div>
              <div class="lm-nav">Historial completo</div>
              <div class="lm-nav">Multimedia</div>
            </aside>

            <section class="lm-main lm-clickable" data-el="layout-publicaciones">
              <div class="lm-topbar lm-clickable" data-el="topbar">
                <strong>Gestión de publicaciones</strong>

                <div class="lm-topbar-actions">
                  <button class="lm-btn secondary lm-clickable" data-el="btn-buscar" type="button">Buscar</button>
                  <button class="lm-btn secondary lm-clickable" data-el="btn-filtrar" type="button">Filtrar</button>
                  <button class="lm-btn primary lm-clickable" data-el="btn-nueva" type="button">Nueva</button>
                </div>
              </div>

              <div class="lm-content">
                <div class="lm-stats">
                  <div class="lm-stat lm-clickable" data-el="stat-total"><small>Total registros</small><b style="color:#1d4ed8">8</b></div>
                  <div class="lm-stat lm-clickable" data-el="stat-programadas"><small>Programadas</small><b style="color:#b45309">3</b></div>
                  <div class="lm-stat lm-clickable" data-el="stat-publicadas"><small>Publicadas</small><b style="color:#15803d">4</b></div>
                  <div class="lm-stat lm-clickable" data-el="stat-error"><small>Con error</small><b style="color:#dc2626">1</b></div>
                  <div class="lm-stat lm-clickable" data-el="stat-borradores"><small>Borradores</small><b style="color:#2563eb">0</b></div>
                </div>

                <div class="lm-twocol">
                  <div class="lm-stack">
                    <div class="lm-card">
                      <div class="lm-card-h">
                        <span>Datos de la publicación</span>
                        <span>
                          <button class="lm-btn warn lm-clickable" data-el="btn-editar" type="button">Editar</button>
                          <button class="lm-btn danger lm-clickable" data-el="btn-eliminar" type="button">Eliminar</button>
                        </span>
                      </div>

                      <div class="lm-card-b">
                        <div class="lm-grid">
                          <div class="lm-full lm-clickable" data-el="titulo">
                            <div class="lm-label">Título interno *</div>
                            <div class="lm-input">Promo mayo — descuento FileMaker 20%</div>
                          </div>

                          <div class="lm-full lm-clickable" data-el="contenido">
                            <div class="lm-label">Contenido del post *</div>
                            <div class="lm-textarea">
                              ¡Aprovecha nuestra promoción de mayo! 🎉<br>
                              Capacitación en FileMaker con 20% de descuento este mes.<br>
                              Llámanos al 844-191-6210 o escríbenos por WhatsApp.
                            </div>
                            <div class="lm-char">234 / 2200 caracteres (Instagram)</div>
                          </div>

                          <div class="lm-full lm-clickable" data-el="hashtags">
                            <div class="lm-label">Hashtags</div>
                            <div class="lm-input">#FileMaker #DTInformatica #Saltillo #Software #CapacitacionTI</div>
                            <div class="lm-tags">
                              <span class="lm-tag-fm">#FileMaker</span>
                              <span class="lm-tag-fm">#DTInformatica</span>
                              <span class="lm-tag-fm">#Saltillo</span>
                            </div>
                          </div>

                          <div class="lm-full">
                            <div class="lm-label">Plataforma de destino *</div>
                            <div class="lm-plat">
                              <button class="lm-pbtn fb lm-clickable" data-el="plat-facebook" type="button">Facebook</button>
                              <button class="lm-pbtn lm-clickable" data-el="plat-instagram" type="button">Instagram</button>
                              <button class="lm-pbtn lm-clickable" data-el="plat-ambas" type="button">Ambas</button>
                            </div>
                          </div>
                        </div>

                        <div class="lm-sep">Imagen</div>

                        <div class="lm-grid">
                          <div class="lm-clickable" data-el="imagen">
                            <div class="lm-label">Imagen (previsualización)</div>
                            <div class="lm-imgbox">
                              <div>
                                <strong>promo-mayo-2026.jpg</strong><br>
                                <small>Container · 842 KB</small>
                              </div>
                            </div>
                          </div>

                          <div class="lm-clickable" data-el="url">
                            <div class="lm-label">URL pública *</div>
                            <div class="lm-input">https://dtinformatica.com/img/promo-mayo-2026.jpg</div>
                            <div class="lm-ok">✓ URL válida — accesible por Meta API</div>
                          </div>
                        </div>

                        <div class="lm-sep">Programación</div>

                        <div class="lm-grid">
                          <div class="lm-full lm-clickable" data-el="estado">
                            <div class="lm-label">Estado *</div>
                            <div class="lm-status">
                              <span class="lm-sbtn s-borrador">Borrador</span>
                              <span class="lm-sbtn s-programado">Programado ✓</span>
                              <span class="lm-sbtn s-publicado">Publicado</span>
                              <span class="lm-sbtn s-error">Error</span>
                              <span class="lm-sbtn s-cancelado">Cancelado</span>
                            </div>
                          </div>

                          <div class="lm-clickable" data-el="fecha">
                            <div class="lm-label">Fecha programada</div>
                            <div class="lm-input">03/06/2026</div>
                          </div>

                          <div class="lm-clickable" data-el="hora">
                            <div class="lm-label">Hora programada</div>
                            <div class="lm-input">10:00 a. m.</div>
                          </div>
                        </div>

                        <div class="lm-sep">Resultado de publicación</div>

                        <div class="lm-grid lm-clickable" data-el="resultado">
                          <div>
                            <div class="lm-label">Post ID (API)</div>
                            <div class="lm-input">—</div>
                          </div>

                          <div>
                            <div class="lm-label">Fecha publicación real</div>
                            <div class="lm-input">—</div>
                          </div>

                          <div class="lm-full">
                            <div class="lm-label">Respuesta API (JSON)</div>
                            <div class="lm-api-pend">Pendiente — aún no se ha ejecutado la publicación</div>
                          </div>
                        </div>

                        <hr style="border:none;border-top:1px solid #f0f0f8;margin:12px 0">

                        <div class="lm-clickable lm-actions" data-el="actions" style="text-align:right">
                          <button class="lm-btn secondary lm-clickable" data-el="btn-cancelar" type="button">Cancelar</button>
                          <button class="lm-btn secondary lm-clickable" data-el="btn-guardar-borrador" type="button">Guardar borrador</button>
                          <button class="lm-btn green lm-clickable" data-el="btn-publicar-ahora" type="button">Publicar ahora</button>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div class="lm-stack">
                    <div class="lm-card lm-clickable" data-el="metadatos">
                      <div class="lm-card-h">Metadatos del registro</div>
                      <div class="lm-side-card">
                        <div class="lm-mini-label">ID publicación</div>
                        <div class="lm-mini-val lm-code-fm">PUB-003</div>

                        <div class="lm-mini-label">Creado por</div>
                        <div class="lm-mini-val">brandon.arreola · 15/05/2026 09:23</div>

                        <div class="lm-mini-label">Modificado por</div>
                        <div class="lm-mini-val">brandon.arreola · 02/06/2026 16:47</div>

                        <div class="lm-mini-label">Estado actual</div>
                        <div class="lm-mini-val">Programado</div>

                        <div class="lm-mini-label">Plataforma</div>
                        <div class="lm-mini-val">Facebook</div>
                      </div>
                    </div>

                    <div class="lm-card lm-clickable" data-el="config">
                      <div class="lm-card-h">Config. plataformas activas</div>
                      <div class="lm-side-card">
                        <div class="lm-mini-label">Facebook</div>
                        <div class="lm-mini-val">ID cuenta Meta</div>
                        <div class="lm-mini-val lm-code-fm">102938475610293</div>

                        <div class="lm-mini-label">TOKEN</div>
                        <div class="lm-mini-val lm-code-fm">EAABsb...X789</div>

                        <div class="lm-mini-label">VERSIÓN API</div>
                        <div class="lm-mini-val">v25.0</div>

                        <div class="lm-mini-label">EXPIRA</div>
                        <div class="lm-mini-val">14/07/2026 — 42 días</div>
                      </div>
                    </div>

                    <div class="lm-card lm-clickable" data-el="multimedia">
                      <div class="lm-card-h">Multimedia adjunta</div>
                      <div class="lm-side-card">
                        <div class="lm-mini-label">Archivos en carrusel</div>
                        <div class="lm-mini-val">3 / 10 imágenes</div>

                        <div class="lm-mini-label">Gestión</div>
                        <div class="lm-mini-val">Ver portal de archivos abajo ↓</div>
                      </div>
                    </div>
                  </div>
                </div>
                    <div class="lm-card lm-clickable lm-portal-full" data-el="portal-log">
                      <div class="lm-card-h">
                        <span>Historial de intentos (Publicaciones_Log)</span>
                        <small>3 registros relacionados</small>
                      </div>

                      <div class="lm-portal-head">
                        <span>Fecha intento</span>
                        <span>Plataforma</span>
                        <span>Resultado</span>
                        <span>HTTP</span>
                        <span>Detalle</span>
                        <span>Abrir</span>
                      </div>

                      <div class="lm-portal-row">
                        <span>03/06/2026 10:01</span>
                        <span class="lm-badge-fm fb">Facebook</span>
                        <span>Exitoso</span>
                        <span class="lm-http">200</span>
                        <span>id: 1234_5678</span>
                        <span>
                          <button
                            class="lm-link-btn lm-clickable"
                            data-el="btn-abrir-publicacion"
                            type="button"
                            title="Abrir publicación generada por Meta"
                          >
                            Abrir publicación
                          </button>
                        </span>
                      </div>

                      <div class="lm-portal-row">
                        <span>03/06/2026 10:02</span>
                        <span class="lm-badge-fm ig">Instagram</span>
                        <span>Fallido</span>
                        <span class="lm-http" style="background:#fff0f0;color:#c0392b">401</span>
                        <span>Token expirado (190)</span>
                        <span class="lm-no-link">Sin URL</span>
                      </div>
                    </div>

                    <div class="lm-card lm-clickable lm-portal-full" data-el="portal-multimedia">
                      <div class="lm-card-h">
                        <span>Archivos multimedia (carrusel)</span>
                        <small>3 / 10 archivos</small>
                      </div>

                      <div class="lm-portal-head lm-mm-head">
                        <span>Orden</span>
                        <span>Archivo</span>
                        <span>Tipo</span>
                        <span>Estado</span>
                        <span>Quitar</span>
                      </div>

                      <div class="lm-portal-row lm-mm-row">
                        <span>1</span>
                        <span>promo-mayo-1.jpg</span>
                        <span class="lm-badge-fm fb">Imagen</span>
                        <span>Listo</span>
                        <span><button class="lm-link-btn lm-clickable" data-el="btn-media-quitar" type="button">Quitar</button></span>
                      </div>

                      <div class="lm-portal-row lm-mm-row">
                        <span>2</span>
                        <span>promo-mayo-2.jpg</span>
                        <span class="lm-badge-fm fb">Imagen</span>
                        <span>Listo</span>
                        <span><button class="lm-link-btn lm-clickable" data-el="btn-media-quitar" type="button">Quitar</button></span>
                      </div>

                      <div class="lm-portal-row lm-mm-row">
                        <span>3</span>
                        <span>promo-mayo-3.jpg</span>
                        <span class="lm-badge-fm fb">Imagen</span>
                        <span class="lm-no-link">Pendiente</span>
                        <span><button class="lm-link-btn lm-clickable" data-el="btn-media-quitar" type="button">Quitar</button></span>
                      </div>

                      <div class="lm-mm-foot">
                        <button class="lm-btn green lm-clickable" data-el="btn-media-agregar" type="button">+ Agregar archivo</button>
                        <small>Máximo 10 archivos por publicación (carrusel de Facebook)</small>
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

function wireLayoutInteractions(root, data) {
  root.addEventListener(
    "click",
    (event) => {
      let target = event.target;

      while (target && target !== root) {
        if (target.dataset && target.dataset.el) {
          event.stopPropagation();

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