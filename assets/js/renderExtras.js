import { escapeHTML, heroBackgroundHTML } from "./utils.js";

/* Lista simple <li> a partir de un arreglo de textos */
function createList(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "<li>Sin información registrada.</li>";
  }
  return items.map((item) => `<li>${escapeHTML(item)}</li>`).join("");
}

/* Chips del hero */
function createChips(items = []) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items
    .map((item) => `<span class="hero-chip">${escapeHTML(item)}</span>`)
    .join("");
}

/* Lista de pares etiqueta/texto (consideraciones, incidencias) */
function createLabeledList(items = []) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items
    .map(
      (it) => `
      <li class="ex-labeled">
        <span class="ex-labeled-tag">${escapeHTML(it.label)}</span>
        <span class="ex-labeled-text">${escapeHTML(it.text)}</span>
      </li>`
    )
    .join("");
}

/* Tarjetas de módulos (loads.php / loads2.php) */
function createModules(modules = []) {
  if (!Array.isArray(modules) || modules.length === 0) return "";
  return modules
    .map(
      (m) => `
      <article class="ex-module-card">
        <h3 class="ex-module-name">${escapeHTML(m.name)}</h3>
        <p class="ex-module-desc">${escapeHTML(m.desc)}</p>
        <ul class="ex-module-points">${createList(m.points)}</ul>
      </article>`
    )
    .join("");
}

/* Bloque de muestrario de código con explicación */
function createSamples(samples = []) {
  if (!Array.isArray(samples) || samples.length === 0) return "";
  return samples
    .map((s) => {
      const varsHTML = Array.isArray(s.vars) && s.vars.length
        ? `<div class="ex-sample-vars">
             <p class="ex-sample-subtitle">Por qué de cada variable</p>
             <ul>${s.vars
               .map(
                 (v) =>
                   `<li><code class="ex-var">${escapeHTML(v.name)}</code> — ${escapeHTML(v.desc)}</li>`
               )
               .join("")}</ul>
           </div>`
        : "";

      const logicHTML = s.logic
        ? `<div class="ex-sample-block">
             <p class="ex-sample-subtitle">Lógica</p>
             <p>${escapeHTML(s.logic)}</p>
           </div>`
        : "";

      const resultHTML = s.result
        ? `<div class="ex-sample-block ex-sample-result">
             <p class="ex-sample-subtitle">Resultado</p>
             <p>${escapeHTML(s.result)}</p>
           </div>`
        : "";

      return `
      <article class="ex-sample">
        <header class="ex-sample-head">
          <h3 class="ex-sample-title">${escapeHTML(s.title)}</h3>
          <span class="ex-sample-lang">${escapeHTML(s.lang || "code")}</span>
        </header>
        <div class="ex-code">
          <pre><code>${escapeHTML(s.code)}</code></pre>
        </div>
        ${varsHTML}
        ${logicHTML}
        ${resultHTML}
      </article>`;
    })
    .join("");
}

function renderExtrasError(container, error) {
  console.error("Error en renderExtras:", error);
  container.innerHTML = `
    <div class="section-placeholder">
      <h2>No se pudo cargar la sección Extras</h2>
      <p>
        Revisa que exista el archivo
        <code>assets/data/extras.json</code>
        y abre el proyecto con Live Server.
      </p>
    </div>
  `;
}

export async function renderExtras() {
  const extrasSection = document.getElementById("extras");
  if (!extrasSection) {
    console.warn("No existe la sección #extras.");
    return;
  }

  try {
    const response = await fetch("assets/data/extras.json");
    if (!response.ok) {
      throw new Error("No se pudo cargar assets/data/extras.json");
    }
    const data = await response.json();

    const accent = data.heroTitleAccent
      ? ` <span class="hero-grad">${escapeHTML(data.heroTitleAccent)}</span>`
      : "";

    extrasSection.innerHTML = `
      <div class="extras-manual">
        <div class="section-hero has-hero-bg">
          ${heroBackgroundHTML()}
          <div class="hero-std">
            <span class="hero-eyebrow"><i class="bi bi-box-seam"></i> ${escapeHTML(data.heroEyebrow || "Extras")}</span>
            <h1 class="hero-title">${escapeHTML(data.heroTitle || "Extras")}${accent}</h1>
            <p class="hero-desc">${escapeHTML(data.heroDesc || "")}</p>
            <div class="hero-chips">${createChips(data.heroChips)}</div>
          </div>
        </div>

        <div class="card-grid">
          <article class="info-card full">
            <h3>${escapeHTML(data.intro?.title || "Contexto")}</h3>
            <p>${escapeHTML(data.intro?.text || "")}</p>
          </article>

          <article class="info-card full">
            <h3>${escapeHTML(data.architecture?.title || "Arquitectura general")}</h3>
            <p>${escapeHTML(data.architecture?.text || "")}</p>
            <div class="ex-flow">${escapeHTML(data.architecture?.flow || "")}</div>
            <div class="note-box"><strong>UUID + estado vigente:</strong> ${escapeHTML(data.architecture?.note || "")}</div>
          </article>

          <article class="info-card half">
            <h3>${escapeHTML(data.considerations?.title || "Consideraciones técnicas")}</h3>
            <ul class="ex-labeled-list">${createLabeledList(data.considerations?.items)}</ul>
          </article>

          <article class="info-card half">
            <h3>${escapeHTML(data.incidents?.title || "Incidencias")}</h3>
            <ul class="ex-labeled-list">${createLabeledList(data.incidents?.items)}</ul>
            <div class="note-box"><strong>Metodología:</strong> ${escapeHTML(data.incidents?.method || "")}</div>
          </article>
        </div>

        <h2 class="ex-h2">Módulos del sistema de transporte</h2>
        <div class="ex-modules">${createModules(data.modules)}</div>

        <article class="info-card full ex-whatsapp">
          <h3>${escapeHTML(data.whatsapp?.title || "WhatsApp (WordPress)")}</h3>
          <p><strong>Planteamiento:</strong> ${escapeHTML(data.whatsapp?.problem || "")}</p>
          <p class="ex-sample-subtitle">Solución implementada</p>
          <ul>${createList(data.whatsapp?.solution)}</ul>
          <div class="note-box"><strong>Resultado:</strong> ${escapeHTML(data.whatsapp?.result || "")}</div>
        </article>

        <h2 class="ex-h2">${escapeHTML(data.samplesTitle || "Muestrario de código")}</h2>
        <p class="ex-samples-intro">${escapeHTML(data.samplesIntro || "")}</p>
        <div class="ex-samples">${createSamples(data.samples)}</div>

        <article class="info-card full">
          <h3>${escapeHTML(data.closing?.title || "Resultados obtenidos")}</h3>
          <ul>${createList(data.closing?.items)}</ul>
        </article>
      </div>
    `;
  } catch (error) {
    renderExtrasError(extrasSection, error);
  }
}
