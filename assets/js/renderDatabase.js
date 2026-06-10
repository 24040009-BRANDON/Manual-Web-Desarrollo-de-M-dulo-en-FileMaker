import { escapeHTML, heroBackgroundHTML } from "./utils.js";

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value = "") {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureDatabaseManualStyles() {
  const id = "database-manual-css";

  if (document.getElementById(id)) {
    return;
  }

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "assets/css/database-manual.css";
  document.head.appendChild(link);
}

function convertOriginalMarkup(html = "") {
  return String(html)
    .replace(/class="fm-row([^"]*)"/g, 'class="dbm-fm-row$1"')
    .replace(/class="fm-label([^"]*)"/g, 'class="dbm-fm-label$1"')
    .replace(/class="fm-input([^"]*)"/g, 'class="dbm-fm-input$1"')
    .replace(/class="fm-sep([^"]*)"/g, 'class="dbm-fm-sep$1"')

    .replace(/class="cb checked"/g, 'class="dbm-cb checked"')
    .replace(/class="cb grayed"/g, 'class="dbm-cb grayed"')
    .replace(/class="cb"/g, 'class="dbm-cb"')

    .replace(/class="rb checked"/g, 'class="dbm-rb checked"')
    .replace(/class="rb"/g, 'class="dbm-rb"')

    .replace(/class="note"/g, 'class="dbm-note"')
    .replace(/class="warn"/g, 'class="dbm-warn"');
}

function roleClass(role = "") {
  const clean = String(role).replace(/\s+/g, "_");
  return `dbm-cat dbm-cat-${escapeHTML(clean)}`;
}

function renderRoles(roles = []) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return `<span class="dbm-pill">Campo</span>`;
  }

  return roles
    .map((role) => `<span class="${roleClass(role)}">${escapeHTML(role)}</span>`)
    .join("");
}

function renderTags(items = [], type = "") {
  if (!Array.isArray(items) || items.length === 0) {
    return `<span class="dbm-tag">Sin datos</span>`;
  }

  return items
    .map((item) => {
      const value = typeof item === "string" ? item : item.name || JSON.stringify(item);
      return `<span class="dbm-tag ${type}">${escapeHTML(value)}</span>`;
    })
    .join("");
}

function renderRelatedScripts(scripts = []) {
  if (!Array.isArray(scripts) || scripts.length === 0) {
    return `<span class="dbm-muted">Sin script directo</span>`;
  }

  return scripts
    .map((script) => {
      return `
        <span class="dbm-tag object" title="${escapeHTML(script.does || "")}">
          ${escapeHTML(script.name)}
        </span>
      `;
    })
    .join("");
}

function renderValidationKey(field) {
  return field.validationKey
    ? escapeHTML(field.validationKey)
    : "Sin validación documentada";
}

function renderFieldDetail(field) {
  const fieldId = slugify(`${field.table}-${field.name}`);

  return `
    <div class="dbm-field-detail">
      <div class="dbm-detail-grid">
        <div class="dbm-mini-card">
          <b>Campo</b>
          <span>${escapeHTML(field.name)}</span>
        </div>

        <div class="dbm-mini-card">
          <b>Tabla</b>
          <span>${escapeHTML(field.table)}</span>
        </div>

        <div class="dbm-mini-card">
          <b>Estado de congruencia</b>
          <span>${escapeHTML(field.consistencyStatus || "Sin estado registrado")}</span>
        </div>
      </div>

      <div class="dbm-tabs-shell">
        <div class="dbm-tabs-nav">
          <button class="dbm-tab-link active" type="button" data-db-tab-target="#${fieldId}-resumen">Resumen funcional</button>
          <button class="dbm-tab-link" type="button" data-db-tab-target="#${fieldId}-auto">Auto-Enter</button>
          <button class="dbm-tab-link" type="button" data-db-tab-target="#${fieldId}-validation">Validation</button>
          <button class="dbm-tab-link" type="button" data-db-tab-target="#${fieldId}-storage">Storage</button>
          <button class="dbm-tab-link" type="button" data-db-tab-target="#${fieldId}-notes">Notas senior y dependencias</button>
        </div>

        <div class="dbm-tab-pane active" id="${fieldId}-resumen">
          <div class="dbm-pane-text">
            <p><strong>Descripción:</strong> ${escapeHTML(field.description || "Sin descripción.")}</p>
            <p><strong>Lista de valores:</strong> ${escapeHTML(field.valueList || "No aplica")}</p>
            <p><strong>Validación clave:</strong> ${renderValidationKey(field)}</p>
            <p><strong>Scripts relacionados:</strong></p>
            <div>${renderRelatedScripts(field.relatedScripts)}</div>
          </div>
        </div>

        <div class="dbm-tab-pane" id="${fieldId}-auto">
          <div class="dbm-pane-text">
            ${convertOriginalMarkup(field.autoEnter || "<p>Sin opciones Auto-Enter documentadas.</p>")}
          </div>
        </div>

        <div class="dbm-tab-pane" id="${fieldId}-validation">
          <div class="dbm-pane-text">
            ${convertOriginalMarkup(field.validation || "<p>Sin validaciones documentadas.</p>")}
          </div>
        </div>

        <div class="dbm-tab-pane" id="${fieldId}-storage">
          <div class="dbm-pane-text">
            ${convertOriginalMarkup(field.storage || "<p>Sin configuración Storage documentada.</p>")}
          </div>
        </div>

        <div class="dbm-tab-pane" id="${fieldId}-notes">
          <div class="dbm-pane-text">
            <p><strong>Notas:</strong></p>
            <ul>
              ${(field.notes || []).map((note) => `<li>${escapeHTML(note)}</li>`).join("") || "<li>Sin notas registradas.</li>"}
            </ul>

            <p><strong>Advertencias:</strong></p>
            <ul>
              ${(field.warnings || []).map((warning) => `<li>${escapeHTML(warning)}</li>`).join("") || "<li>Sin advertencias registradas.</li>"}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderFieldRow(field) {
  const targetId = slugify(`${field.table}-${field.name}`);

  return `
    <tr class="dbm-field-row" data-db-toggle="collapse" data-db-target="#detail-${targetId}">
      <td class="dbm-col-role">
        <div class="dbm-role-wrap">${renderRoles(field.role)}</div>
      </td>

      <td class="dbm-col-name">
        <div class="dbm-field-name">${escapeHTML(field.name)}</div>
      </td>

      <td class="dbm-col-type">
        <span class="dbm-pill">${escapeHTML(field.type || "Sin tipo")}</span>
      </td>

      <td class="dbm-col-use">
        <div class="dbm-field-desc">${escapeHTML(field.description || "Sin descripción.")}</div>
      </td>

      <td class="dbm-col-action">
        <button class="dbm-copy dbm-row-copy" type="button" data-db-copy="${escapeHTML(field.name)}">Copiar</button>
      </td>
    </tr>

    <tr id="detail-${targetId}" class="dbm-collapse dbm-detail-holder">
      <td colspan="5">
        ${renderFieldDetail(field)}
      </td>
    </tr>
  `;
}

function renderTableBlock(table, fields) {
  const tableId = slugify(table.name);

  return `
    <article class="dbm-table-card dbm-table-${tableId} dbm-collapsible" data-db-collapsed="true">
      <header class="dbm-table-head" data-db-accordion="${tableId}" role="button" tabindex="0" aria-expanded="false">
        <div>
          <h3>${escapeHTML(table.name)}</h3>
          <p>${escapeHTML(table.description || "")}</p>
        </div>

        <span class="dbm-head-right">
          <span class="dbm-chip">${fields.length} / ${table.fields.length} campos visibles</span>
          <span class="dbm-accordion-icon" aria-hidden="true">⌄</span>
        </span>
      </header>

      <div class="dbm-table-responsive dbm-collapse-body">
        <table class="dbm-table dbm-field-table">
          <thead>
            <tr>
              <th class="dbm-col-role">Rol</th>
              <th class="dbm-col-name">Campo</th>
              <th class="dbm-col-type">Tipo</th>
              <th class="dbm-col-use">Descripción</th>
              <th class="dbm-col-action">Acción</th>
            </tr>
          </thead>

          <tbody>
            ${fields.map(renderFieldRow).join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function renderMetrics(root, database, allFields) {
  const metrics = root.querySelector("[data-db-metrics]");
  const totalTables = database.tables.length;
  const totalFields = allFields.length;
  const apiFields = allFields.filter((field) => field.role?.includes("API")).length;
  const validationFields = allFields.filter((field) => field.role?.includes("VALIDACIÓN")).length;
  const calcFields = allFields.filter((field) => field.role?.includes("CALC")).length;
  const logFields = allFields.filter((field) => field.role?.includes("LOG")).length;

  metrics.innerHTML = `
    <div class="dbm-metric"><div class="dbm-num dbm-text-primary">${totalTables}</div><p class="dbm-muted dbm-mb-0">Tablas</p></div>
    <div class="dbm-metric"><div class="dbm-num dbm-text-success">${totalFields}</div><p class="dbm-muted dbm-mb-0">Campos</p></div>
    <div class="dbm-metric"><div class="dbm-num dbm-text-info">${apiFields}</div><p class="dbm-muted dbm-mb-0">Campos API</p></div>
    <div class="dbm-metric"><div class="dbm-num dbm-text-warning">${validationFields}</div><p class="dbm-muted dbm-mb-0">Validaciones</p></div>
    <div class="dbm-metric"><div class="dbm-num dbm-text-primary">${calcFields}</div><p class="dbm-muted dbm-mb-0">Cálculos</p></div>
    <div class="dbm-metric"><div class="dbm-num dbm-text-danger">${logFields}</div><p class="dbm-muted dbm-mb-0">Log</p></div>
  `;
}

function renderFlow(root, database) {
  const flow = root.querySelector("[data-db-flow]");

  const fallbackFlow = [
    {
      title: "Publicaciones",
      description: "Tabla principal del módulo. Guarda contenido, plataforma destino, estado, programación y respuesta API."
    },
    {
      title: "Publicaciones_Log",
      description: "Historial técnico de intentos de publicación por plataforma, resultado, HTTP, JSON y detalle."
    },
    {
      title: "Config_Plataformas",
      description: "Configuración de cuentas Meta, tokens, versión API, expiración y estado activo."
    },
    {
      title: "Publicacion_Multimedia",
      description: "Tabla auxiliar para archivos multimedia, contenedores, URLs públicas y orden de carrusel."
    },
    {
      title: "Validaciones",
      description: "Reglas de datos para permitir borradores incompletos y validar estrictamente antes de publicar."
    },
    {
      title: "Cálculos",
      description: "Campos calculados para contadores del tablero y métricas operativas del módulo."
    },
    {
      title: "Relaciones",
      description: "Conexiones entre publicaciones, logs, multimedia y configuración de plataformas."
    },
    {
      title: "Meta Graph API",
      description: "Campos preparados para integración con Facebook, Instagram, tokens, URLs públicas y respuestas JSON."
    }
  ];

  const sourceItems = Array.isArray(database.flow) && database.flow.length
    ? database.flow
    : fallbackFlow;

  const items = sourceItems.map((item, index) => {
    const fallback = fallbackFlow[index] || {
      title: `Elemento ${index + 1}`,
      description: "Elemento estructural del módulo de publicaciones."
    };

    return {
      title: item.title || item.name || item.label || fallback.title,
      description: item.description || item.text || item.detail || fallback.description
    };
  });

  flow.innerHTML = items
    .map((item, index) => {
      return `
        <div class="dbm-flow">
          <div class="dbm-fnum">${index + 1}</div>
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.description)}</p>
        </div>
      `;
    })
    .join("");
}

function renderMatrix(root, database) {
  const matrix = root.querySelector("[data-db-matrix]");
  const rows = database.matrix || [];

  matrix.innerHTML = rows
    .map((row) => {
      return `
        <tr>
          <td>
            <span class="dbm-table-name">${escapeHTML(row.table)}</span>
          </td>
          <td><code>${escapeHTML(row.field)}</code></td>
          <td>${escapeHTML(row.type)}</td>
          <td>${renderRoles(row.role)}</td>
          <td>${escapeHTML(row.script || "Sin script directo")}</td>
          <td>${escapeHTML(row.validation || "Sin validación")}</td>
          <td>${escapeHTML(row.result || "Sin resultado documentado")}</td>
        </tr>
      `;
    })
    .join("");
}

function renderRelations(root, database) {
  const relations = root.querySelector("[data-db-relations]");
  const items = database.relations || [];

  relations.innerHTML = items
    .map((relation) => {
      return `
        <div class="dbm-warnbox">
          <h3>${escapeHTML(relation.from)} → ${escapeHTML(relation.to)}</h3>
          <p class="dbm-muted"><strong>Tipo:</strong> ${escapeHTML(relation.type)}</p>
          <div class="dbm-disc-action">${escapeHTML(relation.note || "")}</div>
        </div>
      `;
    })
    .join("");
}

function renderDiscrepancies(root, database) {
  const discrepancies = root.querySelector("[data-db-discrepancies]");
  const items = database.discrepancies || [];

  discrepancies.innerHTML = items
    .map((item) => {
      return `
        <div class="dbm-warnbox">
          <span class="dbm-disc-status dbm-disc-status-${escapeHTML(item.status)}">${escapeHTML(item.statusLabel || item.status)}</span>
          <h3>${escapeHTML(item.title)}</h3>
          <p class="dbm-muted">${escapeHTML(item.detail)}</p>
          <div class="dbm-disc-action"><strong>Acción:</strong> ${escapeHTML(item.action || "Sin acción documentada.")}</div>
        </div>
      `;
    })
    .join("");
}

function filterMatch(database, field, selectedCategory) {
  if (selectedCategory === "ALL") return true;
  if (field.table === selectedCategory) return true;
  if (field.role?.includes(selectedCategory)) return true;

  if (selectedCategory === "CONFIG") {
    return field.table === "Config_Plataformas";
  }

  if (selectedCategory === "MULTIMEDIA") {
    return field.table === "Publicacion_Multimedia";
  }

  return false;
}

function createDatabaseShell() {
  return `
    <div class="dbm">
      <div class="dbm-app">
        <main class="dbm-main">
          <section class="dbm-hero dbm-mb-4 has-hero-bg" id="dbm-inicio">
            ${heroBackgroundHTML()}
            <div class="dbm-hero-inner hero-std">
              <span class="hero-eyebrow"><i class="bi bi-database-fill"></i> Estructura de datos · FileMaker 18</span>

              <h1 class="hero-title">Manual interactivo de <span class="hero-grad">base de datos</span></h1>

              <p class="hero-desc">
                Documenta las tablas, campos, tipos de dato, llaves, validaciones, opciones Auto-Enter, Storage y dependencias del módulo de publicaciones en FileMaker y su integración con Meta Graph API.
              </p>

              <div class="hero-chips">
                <span class="hero-chip">FileMaker Manage Database</span>
                <span class="hero-chip">Auto-Enter</span>
                <span class="hero-chip">Validation</span>
                <span class="hero-chip">Storage</span>
                <span class="hero-chip">Meta Graph API</span>
              </div>
            </div>
          </section>

          <section class="dbm-metrics-row dbm-mb-4" data-db-metrics></section>

          <section class="dbm-card-soft dbm-mb-4" id="dbm-flujo">
            <h2 class="dbm-section-title">Mapa de estructura</h2>
            <div class="dbm-flow-row" data-db-flow></div>
          </section>

          <section class="dbm-card-soft dbm-mb-4" id="dbm-matrizWrap">
            <div class="dbm-section-head">
              <h2 class="dbm-section-title dbm-mb-0">Matriz tabla → campo → script</h2>
              <span class="dbm-chip">Referencia cruzada</span>
            </div>

            <div class="dbm-table-responsive">
              <table class="dbm-table dbm-matrix-table">
                <thead>
                  <tr>
                    <th>Tabla</th>
                    <th>Campo</th>
                    <th>Tipo</th>
                    <th>Rol</th>
                    <th>Usado por script</th>
                    <th>Validación clave</th>
                    <th>Resultado esperado</th>
                  </tr>
                </thead>

                <tbody data-db-matrix></tbody>
              </table>
            </div>
          </section>

          <section class="dbm-mb-4" id="dbm-campos">
            <div class="dbm-card-soft dbm-mb-3">
              <div class="dbm-search-grid">
                <div class="dbm-search-main">
                  <label>Buscar tabla, campo, tipo, validación, fórmula, API o script</label>
                  <input class="dbm-input" data-db-search placeholder="Ejemplo: Plataforma_Destino, Resultado, Access_Token, Not empty, Meta Graph API..." />
                </div>

                <div>
                  <label>Filtro</label>
                  <select class="dbm-select" data-db-cat></select>
                </div>

                <div>
                  <button class="dbm-clear" data-db-clear type="button">Limpiar</button>
                </div>
              </div>

              <div class="dbm-filter-title dbm-mt-3">Filtros rápidos</div>
              <div class="dbm-chip-row" data-db-quick-filters></div>
            </div>

            <div class="dbm-section-head dbm-mb-3">
              <h2 class="dbm-section-title dbm-mb-0">Estructura de tablas y campos</h2>
              <span class="dbm-chip" data-db-counter></span>
            </div>

            <div class="dbm-cards" data-db-cards></div>
          </section>

          <section class="dbm-card-soft dbm-mb-4" id="dbm-relaciones">
            <h2 class="dbm-section-title">Relaciones y dependencias</h2>
            <div class="dbm-relation-row" data-db-relations></div>
          </section>

          <section class="dbm-card-soft dbm-mb-4" id="dbm-discrepancias">
            <h2 class="dbm-section-title">Discrepancias detectadas y acciones correctivas</h2>
            <div class="dbm-relation-row" data-db-discrepancies></div>
          </section>

          <section class="dbm-card-soft dbm-mb-5" id="dbm-convenciones">
            <h2 class="dbm-section-title">Convenciones de nombres</h2>

            <div class="dbm-conventions-grid">
              <div class="dbm-metric">
                <h3>PK / FK</h3>
                <p class="dbm-small dbm-muted dbm-mb-0">Llaves primarias y foráneas. Deben respetarse exactamente en scripts y relaciones.</p>
              </div>

              <div class="dbm-metric">
                <h3>c_</h3>
                <p class="dbm-small dbm-muted dbm-mb-0">Campos calculados para tarjetas, contadores o dashboard.</p>
              </div>

              <div class="dbm-metric">
                <h3>_Log / Config_</h3>
                <p class="dbm-small dbm-muted dbm-mb-0">Historial técnico y configuración separada de datos operativos.</p>
              </div>

              <div class="dbm-metric">
                <h3>URL_Imagen</h3>
                <p class="dbm-small dbm-muted dbm-mb-0">URL pública requerida por Meta; no es lo mismo que un campo Container local.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  `;
}

function wireDatabaseInteractions(root, database, allFields) {
  const search = root.querySelector("[data-db-search]");
  const cat = root.querySelector("[data-db-cat]");
  const cards = root.querySelector("[data-db-cards]");
  const counter = root.querySelector("[data-db-counter]");
  const quickFilters = root.querySelector("[data-db-quick-filters]");
  const clear = root.querySelector("[data-db-clear]");

  const filters = [
    ["ALL", "Todas"],
    ...database.tables.map((table) => [table.name, table.name]),
    ["PK", "PK"],
    ["FK", "FK"],
    ["CALC", "Calculation"],
    ["API", "Campos API"],
    ["VALIDACIÓN", "Validación obligatoria"],
    ["LOG", "Campos Log"],
    ["CONFIG", "Config_Plataformas"],
    ["MULTIMEDIA", "Publicacion_Multimedia"]
  ];

  function renderFilteredFields() {
    const query = normalizeText(search.value.trim());
    const selectedCategory = cat.value;

    const filtered = allFields.filter((field) => {
      const matchesFilter = filterMatch(database, field, selectedCategory);
      const matchesSearch = !query || normalizeText(JSON.stringify(field)).includes(query);

      return matchesFilter && matchesSearch;
    });

    cards.innerHTML =
      database.tables
        .map((table) => {
          const fields = filtered.filter((field) => field.table === table.name);
          return fields.length ? renderTableBlock(table, fields) : "";
        })
        .join("") ||
      `
        <div class="dbm-card-soft">
          <p class="dbm-muted dbm-mb-0">No hay campos que coincidan con la búsqueda o filtro actual.</p>
        </div>
      `;

    counter.textContent = `${filtered.length} / ${allFields.length} visibles`;
    wireDynamicButtons();
  }

  function wireDynamicButtons() {
    root.querySelectorAll("[data-db-copy]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.stopPropagation();

        const text = button.dataset.dbCopy || "";

        try {
          await navigator.clipboard.writeText(text);
          const original = button.innerText;
          button.innerText = "Copiado";

          setTimeout(() => {
            button.innerText = original;
          }, 1200);
        } catch (error) {
          window.prompt("Copia manualmente:", text);
        }
      });
    });
  }

  cat.innerHTML = filters
    .map(([value, label]) => `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`)
    .join("");

  quickFilters.innerHTML = filters
    .slice(0, 10)
    .map(([value, label], index) => {
      return `
        <button
          class="dbm-filter-btn ${index === 0 ? "active" : ""}"
          data-db-filter="${escapeHTML(value)}"
          type="button"
        >
          ${escapeHTML(label)}
        </button>
      `;
    })
    .join("");

  root.querySelectorAll("[data-db-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      root.querySelectorAll("[data-db-filter]").forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");
      cat.value = button.dataset.dbFilter;
      renderFilteredFields();

      root.querySelector("#dbm-campos")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  root.addEventListener("click", (event) => {
    const accordionHead = event.target.closest("[data-db-accordion]");

    if (accordionHead && root.contains(accordionHead) && !event.target.closest("[data-db-copy]")) {
      const card = accordionHead.closest(".dbm-collapsible");
      if (card) {
        const collapsed = card.getAttribute("data-db-collapsed") === "true";
        card.setAttribute("data-db-collapsed", collapsed ? "false" : "true");
        accordionHead.setAttribute("aria-expanded", collapsed ? "true" : "false");
      }
      return;
    }

    const collapseTrigger = event.target.closest("[data-db-toggle='collapse']");

    if (collapseTrigger && root.contains(collapseTrigger)) {
      const targetSelector = collapseTrigger.dataset.dbTarget;
      const target = targetSelector ? root.querySelector(targetSelector) : null;

      if (target) {
        target.classList.toggle("dbm-show");
      }
    }

    const tabButton = event.target.closest("[data-db-tab-target]");

    if (tabButton && root.contains(tabButton)) {
      const shell = tabButton.closest(".dbm-tabs-shell");
      const target = shell?.querySelector(tabButton.dataset.dbTabTarget);

      if (shell && target) {
        shell.querySelectorAll(".dbm-tab-link").forEach((button) => {
          button.classList.remove("active");
        });

        shell.querySelectorAll(".dbm-tab-pane").forEach((pane) => {
          pane.classList.remove("active");
        });

        tabButton.classList.add("active");
        target.classList.add("active");
      }
    }
  });

  search.addEventListener("input", renderFilteredFields);

  cat.addEventListener("change", renderFilteredFields);

  clear.addEventListener("click", () => {
    search.value = "";
    cat.value = "ALL";

    root.querySelectorAll("[data-db-filter]").forEach((button) => {
      button.classList.toggle("active", button.dataset.dbFilter === "ALL");
    });

    renderFilteredFields();
  });

  renderMetrics(root, database, allFields);
  renderFlow(root, database);
  renderMatrix(root, database);
  renderRelations(root, database);
  renderDiscrepancies(root, database);
  renderFilteredFields();
}

function renderDatabaseError(container) {
  container.innerHTML = `
    <div class="section-placeholder">
      <h2>No se pudo cargar la sección Base de datos</h2>
      <p>
        Revisa que exista
        <code>assets/data/database.json</code>,
        <code>assets/js/renderDatabase.js</code>
        y
        <code>assets/css/database-manual.css</code>.
        Abre el proyecto con Live Server.
      </p>
    </div>
  `;
}

export async function renderDatabase() {
  const databaseSection = document.getElementById("database");

  if (!databaseSection) {
    console.warn("No existe la sección #database.");
    return;
  }

  ensureDatabaseManualStyles();

  try {
    const response = await fetch("assets/data/database.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar assets/data/database.json");
    }

    const database = await response.json();
    const allFields = database.tables.flatMap((table) => table.fields);

    databaseSection.innerHTML = createDatabaseShell();
    wireDatabaseInteractions(databaseSection, database, allFields);
  } catch (error) {
    console.error("Error en renderDatabase:", error);
    renderDatabaseError(databaseSection);
  }
}