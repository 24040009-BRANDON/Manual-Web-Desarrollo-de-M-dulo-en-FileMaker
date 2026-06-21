import { escapeHTML, heroBackgroundHTML } from "./utils.js";

/* Resaltado de sintaxis para FileMaker Script (estilo Script Workspace).
   Colorea: comentarios (#), strings, variables $ y $$, campos Tabla::Campo,
   script steps (Set Variable, If, etc.), funciones y números.
   Usa marcadores de control para no pisar tokens ya resaltados, y
   escapa el HTML al final. El copiado usa innerText, así que no se afecta. */
function highlightFM(code = "") {
  const OPEN = "\u0001";
  const CLOSE = "\u0002";
  const SEP = "\u0003";
  const wrap = (cls, txt) => `${OPEN}${cls}${SEP}${txt}${CLOSE}`;

  const steps = [
    "Set Variable", "Set Field", "Go to Layout", "Insert from URL", "Perform Script",
    "Exit Script", "Commit Records/Requests", "If", "Else If", "Else", "End If",
    "Loop", "End Loop", "Exit Loop If", "New Record/Request", "Go to Record/Request/Page",
    "Show Custom Dialog", "Refresh Window", "Freeze Window", "Allow User Abort",
    "Set Error Capture", "Go to Field", "Enter Find Mode", "Perform Find",
    "Pause/Resume Script", "Delete Record/Request", "Open URL", "Comment"
  ];
  const funcs = [
    "JSONGetElement", "IsEmpty", "Get", "Quote", "Left", "Right", "Middle", "Length",
    "Substitute", "Trim", "Upper", "Lower", "GetAsText", "GetAsNumber", "Position",
    "Char", "Code", "Abs", "Round", "Int", "Mod", "Case", "Let", "Evaluate",
    "GetValue", "ValueCount", "List", "ExecuteSQL", "Timestamp", "Date", "Time"
  ];

  // 1) Comentarios de línea completa que empiezan con #
  let out = code.split("\n").map((line) => {
    const m = line.match(/^(\s*)(#.*)$/);
    if (m) return m[1] + wrap("fmh-comment", m[2]);
    return line;
  }).join("\n");

  // 2) Strings entre comillas dobles
  out = out.replace(/"[^"\n]*"/g, (s) => wrap("fmh-string", s));

  // 3) Variables $$ y $
  out = out.replace(/\$\$?[A-Za-z_][A-Za-z0-9_]*/g, (s) => wrap("fmh-var", s));

  // 4) Campos Tabla::Campo
  out = out.replace(/\b[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*\b/g, (s) => wrap("fmh-field", s));

  // 5) Script steps (al inicio de línea, tras posible indent)
  steps.sort((a, b) => b.length - a.length).forEach((step) => {
    const re = new RegExp("(^|\\n)(\\s*)(" + step.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + ")\\b", "g");
    out = out.replace(re, (full, pre, ind, s) => pre + ind + wrap("fmh-step", s));
  });

  // 6) Funciones seguidas de (
  funcs.sort((a, b) => b.length - a.length).forEach((fn) => {
    const re = new RegExp("\\b(" + fn + ")(\\s*\\()", "g");
    out = out.replace(re, (full, name, paren) => wrap("fmh-fn", name) + paren);
  });

  // 7) Números sueltos
  out = out.replace(/\b\d+\b/g, (s) => wrap("fmh-num", s));

  // 8) Escapar HTML y convertir marcadores en <span>
  const reMark = new RegExp(OPEN + "(.+?)" + SEP + "([\\s\\S]*?)" + CLOSE, "g");
  let result = "";
  let last = 0;
  let match;
  while ((match = reMark.exec(out)) !== null) {
    result += escapeHTML(out.slice(last, match.index));
    result += `<span class="${match[1]}">${escapeHTML(match[2])}</span>`;
    last = match.index + match[0].length;
  }
  result += escapeHTML(out.slice(last));
  return result;
}

function ensureScriptsManualCSS() {
  const href = "assets/css/scripts-manual.css";
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function tags(items = [], className = "tag") {
  return (items || [])
    .map((item) => `<span class="${className}">${escapeHTML(item)}</span>`)
    .join("");
}

function renderScriptCard(script, index, combined, visual) {
  const baseId = `script-accordion-${script.id}`;
  const codeId = `code-${script.id}`;

  return `
    <article class="script-card sc-collapsible" data-script-card data-category="${escapeHTML(script.category)}" data-sc-collapsed="true">
      <div class="script-head sc-head-compact" data-sc-accordion role="button" tabindex="0" aria-expanded="false">
        <div class="sc-head-main">
          <div class="sc-titlerow">
            <span class="cat cat-${escapeHTML(script.category)}">${escapeHTML(script.category)}</span>
            <h3 class="sc-title">${escapeHTML(script.number ?? index + 1)}. ${escapeHTML(script.name)}</h3>
            <span class="pill">${escapeHTML(script.status)}</span>
            <span class="pill">${escapeHTML(script.level)}</span>
          </div>
          <p class="sc-does muted">${escapeHTML(script.does)}</p>
        </div>

        <div class="sc-head-actions">
          <button class="script-copy-main btn btn-outline-primary rounded-4" data-copy="${codeId}" type="button">
            Copiar script
          </button>
          <span class="sc-accordion-icon" aria-hidden="true">⌄</span>
        </div>
      </div>

      <div class="p-3 p-lg-4 sc-collapse-body">
        <div class="row g-3 mb-3">
          <div class="col-lg-6">
            <b class="small muted">Botón visible</b>
            <div>${tags(script.buttons, "tag btnx")}</div>
          </div>

          <div class="col-lg-6">
            <b class="small muted">Objeto FileMaker</b>
            <div>${tags(script.objects, "tag object")}</div>
          </div>

          <div class="col-lg-6">
            <b class="small muted">Tabla / Layout</b>
            <div>
              <span class="sm-hl-blue" style="font-size:.85rem;font-weight:600">${escapeHTML(script.table)}</span>
              <span class="sm-hl-muted" style="font-size:.8rem;margin-left:6px">/ ${escapeHTML(script.layout)}</span>
            </div>
          </div>

          <div class="col-lg-6">
            <b class="small muted">Parámetro</b>
            <div><span class="sm-hl-red" style="font-size:.84rem">${escapeHTML(script.params)}</span></div>
          </div>

          <div class="col-12">
            <b class="small muted">Campos relacionados</b>
            <div>${tags(script.fields, "tag field")}</div>
          </div>
        </div>

        <div class="accordion" id="${baseId}">
          <div class="accordion-item mb-2">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-target="#${baseId}-logic">
                Lógica y errores que previene
              </button>
            </h2>
            <div id="${baseId}-logic" class="accordion-collapse">
              <div class="accordion-body">
                <div class="row g-3">
                  <div class="col-lg-4">
                    <b>Por qué existe</b>
                    <p class="small muted mb-0 mt-1">${escapeHTML(script.why)}</p>
                  </div>
                  <div class="col-lg-4">
                    <b>Cuándo se ejecuta</b>
                    <p class="small muted mb-0 mt-1">${escapeHTML(script.when)}</p>
                  </div>
                  <div class="col-lg-4">
                    <b>Resultado esperado</b>
                    <p class="small muted mb-0 mt-1">${escapeHTML(script.result)}</p>
                  </div>
                  <div class="col-12">
                    <b>Previene</b>
                    <div class="mt-2">${tags(script.prevents)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item mb-2">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-target="#${baseId}-code">
                SCRIPT — referencia limpia del script
              </button>
            </h2>
            <div id="${baseId}-code" class="accordion-collapse">
              <div class="accordion-body">
                <div class="code">
                  <button class="copy" data-copy="${codeId}" type="button">Copiar script</button>
                  <pre id="${codeId}">${highlightFM(script.code)}</pre>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item mb-2">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-target="#${baseId}-combined">
                SCRIPT + INDICACIONES — paso a paso en FileMaker 18
              </button>
            </h2>
            <div id="${baseId}-combined" class="accordion-collapse">
              <div class="accordion-body" style="padding:12px">
                ${combined[script.id] || ""}
              </div>
            </div>
          </div>

          ${visual[script.id] ? `
            <div class="accordion-item mb-2">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-target="#${baseId}-visual">
                  REFERENCIA VISUAL — Show Custom Dialog Options
                </button>
              </h2>
              <div id="${baseId}-visual" class="accordion-collapse">
                <div class="accordion-body">${visual[script.id]}</div>
              </div>
            </div>
          ` : ""}

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-target="#${baseId}-notes">
                Requisitos y notas
              </button>
            </h2>
            <div id="${baseId}-notes" class="accordion-collapse">
              <div class="accordion-body">
                <b>Requisitos</b>
                <div class="my-2">${tags(script.requires)}</div>

                <b>Notas senior</b>
                <ul class="mt-2 mb-0">
                  ${(script.notes || []).map((note) => `<li class="muted">${escapeHTML(note)}</li>`).join("")}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function setCopyEvents(root) {
  root.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const element = document.getElementById(button.dataset.copy);
      if (!element) return;

      const text = element.tagName === "TEXTAREA" ? element.value : element.innerText;

      try {
        await navigator.clipboard.writeText(text);
        const previous = button.innerText;
        button.innerText = "Copiado";
        setTimeout(() => {
          button.innerText = previous;
        }, 1200);
      } catch (error) {
        alert("No se pudo copiar automáticamente. Selecciona el texto manualmente.");
      }
    });
  });
}

function setAccordionEvents(root) {
  root.querySelectorAll(".accordion-button[data-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = root.querySelector(button.dataset.target);
      if (!target) return;

      const isOpen = target.classList.toggle("show");
      button.classList.toggle("collapsed", !isOpen);
    });
  });
}

function setCardCollapseEvents(root) {
  root.querySelectorAll("[data-sc-accordion]").forEach((head) => {
    head.addEventListener("click", (event) => {
      if (event.target.closest("[data-copy]")) return;
      const card = head.closest(".sc-collapsible");
      if (!card) return;
      const collapsed = card.getAttribute("data-sc-collapsed") === "true";
      card.setAttribute("data-sc-collapsed", collapsed ? "false" : "true");
      head.setAttribute("aria-expanded", collapsed ? "true" : "false");
    });
  });
}

function normalize(value = "") {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function renderMatrix(container, matrix = []) {
  container.innerHTML = matrix.map((row) => `
    <tr>
      <td>${escapeHTML(row.button)}</td>
      <td><code class="sm-hl-blue" style="font-size:.82rem">${escapeHTML(row.object)}</code></td>
      <td><b>${escapeHTML(row.script)}</b></td>
      <td>${escapeHTML(row.field)}</td>
      <td class="sm-hl-blue" style="font-size:.85rem;font-weight:600">${escapeHTML(row.table)}</td>
      <td class="sm-hl-red" style="font-size:.85rem">${escapeHTML(row.param)}</td>
      <td>${escapeHTML(row.result)}</td>
    </tr>
  `).join("");
}

function renderMetrics(container, scripts = []) {
  const metrics = [
    ["Total scripts", scripts.length, "text-info"],
    ["Scripts UI", scripts.filter((script) => script.category === "UI").length, ""],
    ["Scripts API", scripts.filter((script) => script.category === "API").length, "text-success"],
    ["Críticos", scripts.filter((script) => ["Crítico", "Validación", "Principal"].includes(script.level)).length, "text-warning"]
  ];

  container.innerHTML = `
    <div class="scripts-stat-strip">
      ${metrics
        .map(
          (metric) => `
        <div class="ss-cell">
          <span class="ss-num ${escapeHTML(metric[2])}">${escapeHTML(metric[1])}</span>
          <span class="ss-lbl">${escapeHTML(metric[0])}</span>
        </div>`
        )
        .join("")}
    </div>`;
}

function renderFlow(container, flow = []) {
  if (!flow.length) {
    container.innerHTML = "";
    return;
  }
  let current = 0;

  const draw = () => {
    const steps = flow
      .map((item, i) => {
        const active = i === current ? " is-active" : "";
        const done = i < current ? " is-done" : "";
        const connector =
          i < flow.length - 1
            ? `<span class="flow-connector${i < current ? " is-done" : ""}"></span>`
            : "";
        return `
          <div class="flow-step">
            <button class="flow-step-btn${active}" type="button" data-flow-step="${i}" aria-label="Paso ${i + 1}: ${escapeHTML(item[0])}">
              <span class="flow-num${done}">${i + 1}</span>
              <span class="flow-label">${escapeHTML(item[0])}</span>
            </button>
            ${connector}
          </div>`;
      })
      .join("");

    container.innerHTML = `
      <div class="flow-stepper" role="tablist">${steps}</div>
      <div class="flow-detail">
        <div class="flow-detail-num">${current + 1}</div>
        <div class="flow-detail-body">
          <h3 class="flow-detail-title">${escapeHTML(flow[current][0])}</h3>
          <p class="flow-detail-desc">${escapeHTML(flow[current][1])}</p>
        </div>
      </div>
      <p class="flow-hint">Toca cualquier paso para ver su detalle · usa <kbd>1</kbd>–<kbd>${flow.length}</kbd></p>`;

    container.querySelectorAll("[data-flow-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        current = Number(btn.dataset.flowStep);
        draw();
      });
    });
  };

  // navegación por teclado (solo cuando la sección de scripts está visible)
  const onKey = (e) => {
    const scriptsSection = document.getElementById("scripts");
    if (!scriptsSection || scriptsSection.offsetParent === null) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= flow.length) {
      current = n - 1;
      draw();
    }
  };
  document.removeEventListener("keydown", onKey);
  document.addEventListener("keydown", onKey);

  draw();
}

function renderErrors(container, errors = []) {
  container.innerHTML = errors.map((item) => `
    <div class="col-md-6">
      <div class="warn h-100">
        <b>${escapeHTML(item[0])}</b>
        <p class="small muted mt-2 mb-0">${escapeHTML(item[1])}</p>
      </div>
    </div>
  `).join("");
}

export async function renderScripts() {
  const section = document.getElementById("scripts");

  if (!section) {
    console.warn("No existe la sección #scripts.");
    return;
  }

  ensureScriptsManualCSS();

  try {
    const response = await fetch("assets/data/scripts.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar assets/data/scripts.json");
    }

    const data = await response.json();
    const scripts = Array.isArray(data.scripts) ? data.scripts : [];
    const matrix = Array.isArray(data.matrix) ? data.matrix : [];
    const flow = Array.isArray(data.flow) ? data.flow : [];
    const errors = Array.isArray(data.errors) ? data.errors : [];
    const combined = data.combined || {};
    const visual = data.visual || {};

    section.innerHTML = `
      <div class="scripts-manual">
        <section class="hero has-hero-bg" id="scripts-inicio">
        ${heroBackgroundHTML()}
          <div class="position-relative z1 hero-std">
            <span class="hero-eyebrow"><i class="bi bi-code-square"></i> Automatización · FileMaker 18 Advanced</span>

            <h1 class="hero-title">Manual interactivo de <span class="hero-grad">scripts</span></h1>

            <p class="hero-desc">
              Cada card separa claramente <strong>Script</strong> e <strong>Indicaciones</strong>.
              El bloque Script queda como referencia limpia. La sección Indicaciones explica qué se configura
              manualmente en FileMaker, incluyendo ventanas como
              <strong>Show Custom Dialog Options → General / Input Fields</strong>.
            </p>

            <div class="hero-chips">
              <span class="hero-chip">FileMaker 18 Advanced</span>
              <span class="hero-chip">Meta Graph API</span>
              <span class="hero-chip">Sistema DT Informática</span>
              <span class="hero-chip">Manual v6 · flujo controlado</span>
            </div>
          </div>
        </section>

        <section class="card-soft mb-4" id="scripts-flujo">
          <h2 class="section-title h3 mb-3">Mapa visual de flujo</h2>
          <div id="scripts-flow"></div>
        </section>

        <section class="card-soft mb-4" id="scripts-matrizWrap">
          <div class="d-flex flex-wrap justify-content-between gap-3 align-items-center mb-3">
            <h2 class="section-title h3 mb-0">Matriz botón → script → campo</h2>
            <span class="chip">Referencia rápida</span>
          </div>

          <div class="table-responsive">
            <table class="table table-striped table-hover table-soft align-middle mb-0">
              <thead>
                <tr>
                  <th>Botón visible</th>
                  <th>Objeto FM</th>
                  <th>Script</th>
                  <th>Campo afectado</th>
                  <th>Tabla</th>
                  <th>Parámetro</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody id="scripts-matrix"></tbody>
            </table>
          </div>
        </section>

        <section class="mb-4" id="scripts-catalogo">
          <section class="mb-3" id="scripts-metrics"></section>
          <div class="card-soft mb-3">
            <div class="row g-3 align-items-end">
              <div class="col-lg-7">
                <label class="form-label fw-bold">Buscar script, campo, botón, tabla u objeto</label>
                <input class="form-control form-control-lg" id="scripts-search" placeholder="Ejemplo: Show Custom Dialog, Input Fields, Plataforma_Destino, btn_publicar_ahora..." />
              </div>

              <div class="col-lg-3">
                <label class="form-label fw-bold">Categoría</label>
                <select class="form-select form-select-lg" id="scripts-cat">
                  <option value="ALL">Todas</option>
                  <option value="UI">UI</option>
                  <option value="API">API</option>
                  <option value="NAV">NAV</option>
                  <option value="MULTIMEDIA">MULTIMEDIA</option>
                  <option value="LOG">LOG</option>
                </select>
              </div>

              <div class="col-lg-2">
                <button class="btn btn-outline-secondary btn-lg w-100 rounded-4" id="scripts-clear" type="button">Limpiar</button>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="section-title h3 mb-0">Catálogo de scripts</h2>
            <span class="chip" id="scripts-counter"></span>
          </div>

          <div class="d-grid gap-3" id="scripts-cards"></div>
        </section>

        <section class="card-soft mb-4" id="scripts-orden">
          <h2 class="section-title h3 mb-3">Orden recomendado de implementación</h2>
          <div class="row g-3">
            <div class="col-lg-4"><div class="warn h-100"><h3 class="h5">Primero</h3><ol class="small mb-0"><li>0. Inicializar módulo Publicaciones</li><li>1. Nueva publicación</li><li>6. Entrar modo edición</li><li>10. Cancelar cambios</li><li>11. Guardar borrador</li><li>8. Seleccionar plataforma destino</li><li>9. Cambiar estado publicación</li><li>13. Validar publicación antes de enviar</li></ol></div></div>
            <div class="col-lg-4"><div class="warn h-100"><h3 class="h5">Después</h3><ol class="small mb-0"><li>14. Publicar ahora Meta</li><li>20. Registrar intento en Log</li><li>NAV scripts</li><li>2. Buscar publicaciones</li><li>4. Filtrar por estado</li></ol></div></div>
            <div class="col-lg-4"><div class="warn h-100"><h3 class="h5">Al final</h3><ol class="small mb-0"><li>15. Publicar Facebook</li><li>16. Publicar Instagram</li><li>Insert from URL + cURL</li><li>Manejo formal de JSON y HTTP</li></ol></div></div>
          </div>
        </section>

        <section class="card-soft mb-4" id="scripts-erroresWrap">
          <h2 class="section-title h3 mb-3">Errores comunes que debes evitar</h2>
          <div class="row g-3" id="scripts-errors"></div>
        </section>

        <section class="card-soft mb-5" id="scripts-convenciones">
          <h2 class="section-title h3 mb-3">Convenciones de nombres</h2>
          <div class="row g-3">
            <div class="col-md-6 col-xl-3"><div class="metric"><h3 class="h6">UI |</h3><p class="small muted mb-0">Scripts de interfaz.</p></div></div>
            <div class="col-md-6 col-xl-3"><div class="metric"><h3 class="h6">NAV |</h3><p class="small muted mb-0">Navegación entre layouts.</p></div></div>
            <div class="col-md-6 col-xl-3"><div class="metric"><h3 class="h6">API |</h3><p class="small muted mb-0">Integración con Meta Graph API.</p></div></div>
            <div class="col-md-6 col-xl-3"><div class="metric"><h3 class="h6">btn_ / fld_ / portal_</h3><p class="small muted mb-0">Prefijos para objetos de layout.</p></div></div>
          </div>
        </section>
      </div>
    `;

    const root = section.querySelector(".scripts-manual");
    const cards = root.querySelector("#scripts-cards");
    const search = root.querySelector("#scripts-search");
    const category = root.querySelector("#scripts-cat");
    const clear = root.querySelector("#scripts-clear");
    const counter = root.querySelector("#scripts-counter");

    function renderCards() {
      const query = normalize(search.value.trim());
      const selectedCategory = category.value;

      const filtered = scripts.filter((script) => {
        const matchesCategory = selectedCategory === "ALL" || script.category === selectedCategory;
        const matchesSearch = !query || normalize(JSON.stringify(script)).includes(query);
        return matchesCategory && matchesSearch;
      });

      cards.innerHTML = filtered.map((script, index) => renderScriptCard(script, index, combined, visual)).join("");
      counter.textContent = `${filtered.length} / ${scripts.length} visibles`;
      setAccordionEvents(cards);
      setCopyEvents(cards);
      setCardCollapseEvents(cards);
    }

    search.addEventListener("input", renderCards);
    category.addEventListener("change", renderCards);
    clear.addEventListener("click", () => {
      search.value = "";
      category.value = "ALL";
      renderCards();
    });

    renderMetrics(root.querySelector("#scripts-metrics"), scripts);
    renderFlow(root.querySelector("#scripts-flow"), flow);
    renderMatrix(root.querySelector("#scripts-matrix"), matrix);
    renderErrors(root.querySelector("#scripts-errors"), errors);
    renderCards();
  } catch (error) {
    console.error("Error en renderScripts:", error);
    section.innerHTML = `
      <div class="section-placeholder">
        <h2>No se pudo cargar el manual de scripts</h2>
        <p>Revisa que exista <code>assets/data/scripts.json</code> y abre el proyecto con Live Server.</p>
      </div>
    `;
  }
}