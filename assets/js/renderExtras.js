import { escapeHTML, heroBackgroundHTML } from "./utils.js";

/* --------------------------------------------------------------------------
   Resaltado de sintaxis ligero para PHP y JavaScript.
   Trabaja sobre el código YA escapado (entidades HTML) y envuelve cada
   categoría léxica en un <span class="tok-..."> que el CSS colorea por tema.
   Se usa un marcador temporal (\u0000N\u0000) para "congelar" comentarios y
   cadenas antes de tokenizar palabras clave, evitando colorear dentro de
   ellos. Es un resaltador didáctico, no un parser completo.
   -------------------------------------------------------------------------- */
function highlightCode(rawCode, lang = "php") {
  let code = escapeHTML(rawCode);

  const frozen = [];
  const freeze = (cls, text) => {
    const idx = frozen.length;
    frozen.push(`<span class="tok-${cls}">${text}</span>`);
    // Marcador con caracteres de control no alfanuméricos: \u0001 + dígitos como
    // secuencia de \u0002..\u000B (uno por dígito) + \u0001. Así ni \w ni \d ni
    // \b lo capturan, y los pasos de keyword/función/número no lo alteran.
    const mark = String(idx)
      .split("")
      .map((d) => String.fromCharCode(2 + Number(d)))
      .join("");
    return `\u0001${mark}\u0001`;
  };

  // 1) Cadenas primero (ya escapadas): '...' se vuelve &#39;...&#39; y "..." se vuelve &quot;...&quot;
  code = code.replace(/(&#39;(?:(?!&#39;).)*&#39;)/g, (m) => freeze("string", m));
  code = code.replace(/(&quot;(?:(?!&quot;).)*&quot;)/g, (m) => freeze("string", m));

  // 2) Comentarios de línea. El # se exige que NO forme parte de una entidad (&#..)
  //    usando un lookbehind negativo; // se captura normal.
  code = code.replace(/(\/\/[^\n]*)/g, (m) => freeze("comment", m));
  code = code.replace(/(?<!&)(#[^\n]*)/g, (m) => freeze("comment", m));

  // 3) Variables PHP ($algo)
  if (lang === "php") {
    code = code.replace(/(\$[A-Za-z_]\w*)/g, (m) => freeze("var", m));
  }

  // 4) Llamadas a función: nombre seguido de '('
  code = code.replace(/\b([A-Za-z_]\w*)(?=\s*\()/g, (m) => freeze("fn", m));

  // 5) Palabras clave
  const keywords =
    lang === "php"
      ? ["function", "global", "return", "if", "else", "elseif", "die", "echo", "exit", "isset", "empty", "array", "true", "false", "null", "foreach", "as", "new"]
      : ["function", "return", "if", "else", "var", "let", "const", "new", "this", "true", "false", "null", "document", "navigator"];
  const kwRe = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
  code = code.replace(kwRe, (m) => freeze("kw", m));

  // 6) Apertura/cierre PHP y números
  code = code.replace(/(&lt;\?php|\?&gt;)/g, (m) => freeze("php", m));
  code = code.replace(/\b(\d+\.?\d*)\b/g, (m) => freeze("num", m));

  // 7) Restaurar los marcadores congelados
  code = code.replace(/\u0001([\u0002-\u000B]+)\u0001/g, (_, mark) => {
    const idx = Number(
      mark.split("").map((c) => c.charCodeAt(0) - 2).join("")
    );
    return frozen[idx];
  });

  return code;
}

/* Asigna la clase de color (igual que en el código) a cada referencia de la
   lista "Por qué de cada variable", para que el color coincida con el bloque.
   Una referencia puede traer varios nombres separados por " / ". */
function varTokenClass(name = "") {
  const first = String(name).trim().split("/")[0].trim();
  if (first.startsWith("$")) return "ex-ref tok-var";       // variable PHP
  if (/^[a-z][A-Za-z]+$/.test(first)) return "ex-ref tok-fn"; // identificador/objeto JS
  return "ex-ref tok-var";
}

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

/* Recreación del celular del chofer (loads.php) en estilo VANILLA:
   sin estilos del manual, apariencia HTML por defecto del navegador.
   El loads.php real no tiene CSS; solo botones grandes. Por eso se usa
   all:revert dentro de un contenedor aislado para mostrar exactamente eso. */
function phoneMockupHTML() {
  return `
    <section class="ex-phone-wrap">
      <p class="ex-phone-caption">Así ve el chofer la pantalla de seguimiento en su celular (loads.php). La página real no tiene estilos: son los controles HTML por defecto del navegador.</p>
      <div class="ex-vanilla-frame">
        <div class="ex-vanilla">
          <h3>FACTURA: A-000</h3>
          <p>LOAD: LD0000000 - CLIENTE: Ejemplo S.A.</p>
          <hr>
          <button type="button" disabled>Ya llegué &#10003;</button>
          <p>Llegada: 06/17/2026 16:14</p>
          <button type="button" disabled>Ya me cargaron &#10003;</button>
          <p>Carga: 06/17/2026 15:43</p>
          <button type="button">Ya entregué</button>
          <button type="button">Ya me descargaron</button>
        </div>
      </div>
    </section>`;
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
                   `<li><code class="${varTokenClass(v.name)}">${escapeHTML(v.name)}</code> — ${escapeHTML(v.desc)}</li>`
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
          <pre><code>${highlightCode(s.code, s.lang)}</code></pre>
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

        ${phoneMockupHTML()}

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