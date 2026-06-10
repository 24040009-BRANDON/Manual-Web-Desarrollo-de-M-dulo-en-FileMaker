import { escapeHTML, heroBackgroundHTML } from "./utils.js";

/* ============================================================
   MÓDULO META GRAPH API — manual interactivo
   Renderiza el contenido y conecta el simulador de llamadas.
   ============================================================ */

function chip(text) {
  return `<span class="meta-chip">${escapeHTML(text)}</span>`;
}

function permisoCard(p) {
  return `
    <div class="meta-perm meta-perm-${p.color}">
      <div class="meta-perm-ico"><i class="bi ${p.icon}"></i></div>
      <div class="meta-perm-body">
        <code class="meta-scope">${escapeHTML(p.scope)}</code>
        <p>${escapeHTML(p.desc)}</p>
        <span class="meta-perm-ep"><i class="bi bi-arrow-return-right"></i> ${escapeHTML(p.endpoint)}</span>
      </div>
    </div>`;
}

function taskCard(t) {
  return `
    <div class="meta-task${t.critical ? " meta-task-critical" : ""}">
      <i class="bi ${t.icon}"></i>
      <div>
        <strong>${escapeHTML(t.name)}</strong>
        ${t.critical ? '<span class="meta-task-flag">Indispensable</span>' : ""}
        <p>${escapeHTML(t.desc)}</p>
      </div>
    </div>`;
}

function tokenCard(t) {
  return `
    <div class="meta-token${t.destacado ? " meta-token-star" : ""}">
      <div class="meta-token-ico"><i class="bi ${t.icon}"></i></div>
      <h4>${escapeHTML(t.tipo)}</h4>
      <div class="meta-token-row"><span>Representa</span><b>${escapeHTML(t.rep)}</b></div>
      <div class="meta-token-row"><span>Duración</span><b>${escapeHTML(t.dur)}</b></div>
      <div class="meta-token-row"><span>Uso</span><b>${escapeHTML(t.uso)}</b></div>
      ${t.destacado ? '<div class="meta-token-badge"><i class="bi bi-star-fill"></i> El que usa FileMaker</div>' : ""}
    </div>`;
}

function flujoStep(s, last) {
  return `
    <div class="meta-flow-step">
      <div class="meta-flow-num"><i class="bi ${s.icon}"></i><span>${s.n}</span></div>
      <div class="meta-flow-card">
        <strong>${escapeHTML(s.titulo)}</strong>
        <p>${escapeHTML(s.detalle)}</p>
      </div>
      ${last ? "" : '<div class="meta-flow-arrow"><i class="bi bi-arrow-down"></i></div>'}
    </div>`;
}

function errorCard(e) {
  return `
    <div class="meta-err">
      <div class="meta-err-code">#${escapeHTML(e.code)}</div>
      <div class="meta-err-body">
        <strong>${escapeHTML(e.titulo)}</strong>
        <p><span class="meta-err-lbl">Causa:</span> ${escapeHTML(e.causa)}</p>
        <p><span class="meta-err-lbl meta-err-fix">Solución:</span> ${escapeHTML(e.fix)}</p>
      </div>
    </div>`;
}

/* ---------- SIMULADOR ---------- */

function simulatorHTML() {
  return `
  <div class="meta-sim" id="meta-sim">
    <div class="meta-sim-head">
      <div>
        <span class="meta-sim-tag"><i class="bi bi-terminal-fill"></i> Simulador interactivo</span>
        <h3>Prueba una publicación (datos simulados)</h3>
        <p class="meta-sim-sub">Llena los campos y ejecuta las fases. Las respuestas son simuladas con el formato real de Meta v25.0 — no se envía nada a internet.</p>
      </div>
    </div>

    <div class="meta-sim-grid">
      <!-- Formulario -->
      <div class="meta-sim-form">
        <label class="meta-field">
          <span><i class="bi bi-flag-fill"></i> Plataforma</span>
          <div class="meta-seg" id="sim-plat">
            <button type="button" class="meta-seg-btn active" data-plat="facebook"><i class="bi bi-facebook"></i> Facebook</button>
            <button type="button" class="meta-seg-btn" data-plat="instagram"><i class="bi bi-instagram"></i> Instagram</button>
          </div>
        </label>

        <label class="meta-field">
          <span><i class="bi bi-fonts"></i> Mensaje / caption</span>
          <textarea id="sim-msg" rows="3" placeholder="Escribe el texto de la publicación...">¡Hola desde Graph API! Promo de mayo 🎉 #FileMaker</textarea>
        </label>

        <label class="meta-field" id="sim-img-wrap">
          <span><i class="bi bi-image"></i> URL de imagen (HTTPS)</span>
          <input type="text" id="sim-img" placeholder="https://..." value="https://ejemplo.com/img/promo.jpg" />
          <small class="meta-hint">Instagram exige imagen en URL pública HTTPS (JPEG).</small>
        </label>

        <label class="meta-field meta-field-check">
          <input type="checkbox" id="sim-pagetoken" checked />
          <span>Usar <b>Page Access Token</b> (recomendado)</span>
        </label>
        <small class="meta-hint meta-hint-warn" id="sim-token-warn" hidden>
          <i class="bi bi-exclamation-triangle-fill"></i> Sin Page Token, Meta responde error #200.
        </small>

        <button type="button" class="meta-run" id="sim-run">
          <i class="bi bi-play-fill"></i> Ejecutar publicación
        </button>
        <button type="button" class="meta-reset" id="sim-reset">
          <i class="bi bi-arrow-counterclockwise"></i> Reiniciar
        </button>
      </div>

      <!-- Consola de respuesta -->
      <div class="meta-sim-console">
        <div class="meta-console-bar">
          <span class="meta-dot r"></span><span class="meta-dot y"></span><span class="meta-dot g"></span>
          <span class="meta-console-title">respuesta · graph.facebook.com/v25.0</span>
        </div>
        <div class="meta-console-body" id="sim-out">
          <div class="meta-console-idle">
            <i class="bi bi-terminal"></i>
            <p>Pulsa <b>Ejecutar</b> para ver las fases de la llamada y la respuesta JSON simulada.</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

/* Simula la(s) llamada(s) y devuelve un arreglo de "pasos" con su salida */
function simulateCall({ plat, msg, img, usePageToken }) {
  const steps = [];
  const fakeId = () => Math.floor(1e14 + Math.random() * 8e14).toString();

  if (!usePageToken) {
    steps.push({
      ok: false,
      method: "POST",
      url: plat === "facebook" ? "/<PAGE_ID>/feed" : "/<IG_USER_ID>/media",
      note: "Llamada con User Access Token (incorrecto)",
      json: {
        error: {
          message: "(#200) requires both pages_read_engagement and pages_manage_posts as an admin with sufficient administrative permission",
          type: "OAuthException",
          code: 200
        }
      }
    });
    return steps;
  }

  if (plat === "facebook") {
    const postId = `<PAGE_ID>_${fakeId()}`;
    steps.push({
      ok: true, method: "POST", url: "/<PAGE_ID>/feed",
      note: "Fase 1 — crear la publicación",
      params: { message: msg || "(vacío)", access_token: "<PAGE_ACCESS_TOKEN>" },
      json: { id: postId }
    });
    steps.push({
      ok: true, method: "GET", url: `/${postId}?fields=permalink_url`,
      note: "Fase 2 — obtener el enlace público",
      json: { permalink_url: "https://www.facebook.com/<PAGE>/posts/<POST_ID>", id: postId }
    });
  } else {
    const containerId = fakeId();
    const igPostId = fakeId();
    steps.push({
      ok: true, method: "POST", url: "/<IG_USER_ID>/media",
      note: "Fase 1 — crear el contenedor de media",
      params: { image_url: img || "(falta URL)", caption: msg || "(vacío)", access_token: "<PAGE_ACCESS_TOKEN>" },
      json: { id: containerId }
    });
    steps.push({
      ok: true, method: "POST", url: "/<IG_USER_ID>/media_publish",
      note: "Fase 2 — publicar el contenedor",
      params: { creation_id: containerId, access_token: "<PAGE_ACCESS_TOKEN>" },
      json: { id: igPostId }
    });
  }
  return steps;
}

function renderSimSteps(steps) {
  return steps.map((s, i) => {
    const cls = s.ok ? "ok" : "err";
    const paramsHTML = s.params
      ? `<div class="meta-req-params">${Object.entries(s.params)
          .map(([k, v]) => `<div><span>${escapeHTML(k)}</span> = ${escapeHTML(String(v))}</div>`)
          .join("")}</div>`
      : "";
    return `
      <div class="meta-step meta-step-${cls}" style="animation-delay:${i * 0.12}s">
        <div class="meta-step-head">
          <span class="meta-verb meta-verb-${s.method.toLowerCase()}">${s.method}</span>
          <code>${escapeHTML(s.url)}</code>
          <span class="meta-step-badge">${s.ok ? '<i class="bi bi-check-circle-fill"></i> 200' : '<i class="bi bi-x-circle-fill"></i> error'}</span>
        </div>
        <div class="meta-step-note">${escapeHTML(s.note)}</div>
        ${paramsHTML}
        <pre class="meta-json">${escapeHTML(JSON.stringify(s.json, null, 2))}</pre>
      </div>`;
  }).join("");
}

function wireSimulator(root) {
  const platBtns = root.querySelectorAll("#sim-plat .meta-seg-btn");
  const imgWrap = root.querySelector("#sim-img-wrap");
  const tokenChk = root.querySelector("#sim-pagetoken");
  const tokenWarn = root.querySelector("#sim-token-warn");
  const out = root.querySelector("#sim-out");
  const runBtn = root.querySelector("#sim-run");
  const resetBtn = root.querySelector("#sim-reset");
  let plat = "facebook";

  platBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      platBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      plat = btn.dataset.plat;
      // Instagram siempre necesita imagen; resaltar
      imgWrap.classList.toggle("meta-field-req", plat === "instagram");
    });
  });

  tokenChk.addEventListener("change", () => {
    tokenWarn.hidden = tokenChk.checked;
  });

  runBtn.addEventListener("click", () => {
    const msg = root.querySelector("#sim-msg").value.trim();
    const img = root.querySelector("#sim-img").value.trim();
    const usePageToken = tokenChk.checked;

    runBtn.classList.add("meta-run-loading");
    out.innerHTML = `<div class="meta-console-loading"><i class="bi bi-arrow-repeat"></i> Enviando a graph.facebook.com/v25.0...</div>`;

    setTimeout(() => {
      const steps = simulateCall({ plat, msg, img, usePageToken });
      out.innerHTML = renderSimSteps(steps);
      runBtn.classList.remove("meta-run-loading");
    }, 650);
  });

  resetBtn.addEventListener("click", () => {
    root.querySelector("#sim-msg").value = "¡Hola desde Graph API! Promo de mayo 🎉 #FileMaker";
    root.querySelector("#sim-img").value = "https://ejemplo.com/img/promo.jpg";
    tokenChk.checked = true;
    tokenWarn.hidden = true;
    out.innerHTML = `<div class="meta-console-idle"><i class="bi bi-terminal"></i><p>Pulsa <b>Ejecutar</b> para ver las fases de la llamada y la respuesta JSON simulada.</p></div>`;
  });
}

/* ---------- SHELL ---------- */

function createMetaShell(data) {
  return `
    <div class="meta">
      <header class="meta-hero has-hero-bg">
        ${heroBackgroundHTML()}
        <div class="meta-hero-inner">
          <span class="meta-eyebrow"><i class="bi bi-plug-fill"></i> Integración · ${escapeHTML(data.version)}</span>
          <h1>Enlazamiento con <span class="meta-grad">Meta Graph API</span></h1>
          <p>Cómo se conecta el módulo de FileMaker con Facebook e Instagram: permisos, tokens, endpoints y publicación automatizada. Incluye un simulador para probar las llamadas.</p>
          <div class="meta-hero-chips">
            ${chip("Meta for Developers")}${chip("Graph API Explorer")}${chip("Page Access Token")}${chip("Facebook + Instagram")}
          </div>
        </div>
      </header>

      <!-- Conceptos base -->
      <section class="meta-block">
        <h2 class="meta-h2"><i class="bi bi-diagram-3-fill"></i> El grafo: nodos, aristas y campos</h2>
        <div class="meta-concepts">
          <div class="meta-concept"><i class="bi bi-circle-fill"></i><h4>Nodo</h4><p>Objeto con ID único: un usuario, una Página, un post.</p></div>
          <div class="meta-concept"><i class="bi bi-arrow-left-right"></i><h4>Arista</h4><p>Conexión entre nodos: <code>/feed</code>, <code>/photos</code>, <code>/accounts</code>.</p></div>
          <div class="meta-concept"><i class="bi bi-tag-fill"></i><h4>Campo</h4><p>Propiedad de un nodo: <code>name</code>, <code>id</code>, <code>permalink_url</code>.</p></div>
        </div>
        <div class="meta-pattern">
          <div><span class="meta-verb meta-verb-get">GET</span> <code>/{nodo}</code> leer campos</div>
          <div><span class="meta-verb meta-verb-get">GET</span> <code>/{nodo}/{arista}</code> leer conectados</div>
          <div><span class="meta-verb meta-verb-post">POST</span> <code>/{nodo}/{arista}</code> crear (publicar)</div>
        </div>
      </section>

      <!-- Permisos -->
      <section class="meta-block">
        <h2 class="meta-h2"><i class="bi bi-shield-lock-fill"></i> Permisos requeridos (scopes)</h2>
        <p class="meta-lead">Cada operación exige un permiso explícito. Sin el correcto, el endpoint falla aunque el token sea válido.</p>
        <div class="meta-perms">${data.permisos.map(permisoCard).join("")}</div>
      </section>

      <!-- Tasks -->
      <section class="meta-block">
        <h2 class="meta-h2"><i class="bi bi-list-check"></i> El campo <code>tasks</code>: qué puede hacer el usuario</h2>
        <p class="meta-lead">Al llamar <code>GET /me/accounts</code>, cada Página trae un arreglo <code>tasks</code> con las acciones permitidas. Para publicar, debe incluir <b>CREATE_CONTENT</b>.</p>
        <div class="meta-tasks">${data.tasks.map(taskCard).join("")}</div>
      </section>

      <!-- Tokens -->
      <section class="meta-block">
        <h2 class="meta-h2"><i class="bi bi-key-fill"></i> Tipos de token</h2>
        <p class="meta-lead">La diferencia clave: un <b>token de usuario</b> actúa en nombre de la persona; un <b>token de Página</b> actúa en nombre de la Página. <b>Para publicar siempre se usa el Page Token.</b></p>
        <div class="meta-tokens">${data.tokens.map(tokenCard).join("")}</div>
      </section>

      <!-- Flujo del token -->
      <section class="meta-block">
        <h2 class="meta-h2"><i class="bi bi-signpost-split-fill"></i> Cómo se genera el Page Token que no expira</h2>
        <div class="meta-flow">${data.flujoToken.map((s, i) => flujoStep(s, i === data.flujoToken.length - 1)).join("")}</div>
      </section>

      <!-- SIMULADOR -->
      <section class="meta-block">
        <h2 class="meta-h2"><i class="bi bi-controller"></i> Pruébalo tú mismo</h2>
        ${simulatorHTML()}
      </section>

      <!-- Errores -->
      <section class="meta-block">
        <h2 class="meta-h2"><i class="bi bi-bug-fill"></i> Errores comunes</h2>
        <div class="meta-errs">${data.errores.map(errorCard).join("")}</div>
      </section>

      <!-- Perfil vs Página -->
      <section class="meta-block">
        <div class="meta-note">
          <i class="bi bi-info-circle-fill"></i>
          <div>
            <strong>¿Por qué Páginas y no perfiles personales?</strong>
            <p>Publicar en el muro de una persona <b>no es posible</b> vía API desde 2018 (el permiso <code>publish_actions</code> fue eliminado tras el caso Cambridge Analytica). Por eso el módulo trabaja sobre <b>Páginas de Facebook</b> y <b>cuentas Business de Instagram</b>.</p>
          </div>
        </div>
      </section>

      <p class="meta-foot"><i class="bi bi-shield-check"></i> Todos los IDs y tokens mostrados (<code>&lt;PAGE_ID&gt;</code>, <code>&lt;PAGE_ACCESS_TOKEN&gt;</code>...) son <b>ejemplos</b>. Los valores reales viven solo dentro del archivo <code>.fmp12</code>.</p>
    </div>`;
}

function renderMetaError(container) {
  container.innerHTML = `
    <div class="section-placeholder">
      <h2>No se pudo cargar el módulo Meta Graph API</h2>
      <p>Revisa que existan <code>assets/data/meta.json</code>, <code>assets/js/renderMeta.js</code> y <code>assets/css/meta-manual.css</code>. Abre el proyecto con Live Server.</p>
    </div>`;
}

export async function renderMeta() {
  const section = document.getElementById("meta");
  if (!section) {
    console.warn("No existe la sección #meta.");
    return;
  }
  try {
    const response = await fetch("assets/data/meta.json");
    if (!response.ok) throw new Error("No se pudo cargar assets/data/meta.json");
    const data = await response.json();
    section.innerHTML = createMetaShell(data);
    wireSimulator(section);
  } catch (error) {
    console.error("Error en renderMeta:", error);
    renderMetaError(section);
  }
}