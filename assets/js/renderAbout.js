import { escapeHTML, heroBackgroundHTML } from "./utils.js";

function createList(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "<li>Sin información registrada.</li>";
  }

  return items
    .map((item) => `<li>${escapeHTML(item)}</li>`)
    .join("");
}

function createBadges(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return items
    .map((item) => `<span class="hero-chip">${escapeHTML(item)}</span>`)
    .join("");
}

function renderAboutError(container, error) {
  console.error("Error en renderAbout:", error);

  container.innerHTML = `
    <div class="section-placeholder">
      <h2>No se pudo cargar la sección Acerca de</h2>
      <p>
        Revisa que exista el archivo
        <code>assets/data/about.json</code>
        y abre el proyecto con Live Server.
      </p>
    </div>
  `;
}

function normalizeAboutData(data = {}) {
  return {
    projectName: data.projectName || "Desarrollo e integración de un módulo de gestión y publicación de contenido en redes sociales mediante FileMaker y Meta Graph API",
    manualTitle: data.manualTitle || "Manual técnico del módulo de gestión y publicación de contenido en redes sociales",
    company: data.company || "DT Informática",
    displayCompany: data.displayCompany || "D&T Informática",
    student: data.student || "Brandon Arreola Cortés",
    career: data.career || "Tecnologías de la Información — Área Desarrollo de Software Multiplataforma",
    period: data.period || "Mayo – Agosto 2026",
    businessTutor: data.businessTutor || "Tutor empresarial no registrado",
    university: data.university || "Universidad Tecnológica de Coahuila",
    location: data.location || "Saltillo, Coahuila",
    year: data.year || "2026",
    platform: data.platform || "FileMaker 18",
    description: data.description || "Sección informativa del proyecto.",
    companyDescription: data.companyDescription || "Información empresarial no registrada.",
    moduleDescription: data.moduleDescription || "Descripción técnica del módulo no registrada.",
    scope: Array.isArray(data.scope) ? data.scope : [],
    technology: Array.isArray(data.technology) ? data.technology : [],
    companyActivities: Array.isArray(data.companyActivities) ? data.companyActivities : []
  };
}

export async function renderAbout() {
  const aboutSection = document.getElementById("about");

  if (!aboutSection) {
    console.warn("No existe la sección #about.");
    return;
  }

  try {
    const response = await fetch("assets/data/about.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar assets/data/about.json");
    }

    const rawData = await response.json();
    const data = normalizeAboutData(rawData);

    aboutSection.innerHTML = `
      <div class="section-hero has-hero-bg">
        ${heroBackgroundHTML()}
        <div class="hero-std">
          <span class="hero-eyebrow"><i class="bi bi-info-circle-fill"></i> Acerca del proyecto</span>

          <h1 class="hero-title">${escapeHTML(data.manualTitle)}</h1>

          <p class="hero-desc">${escapeHTML(data.description)}</p>

          <div class="hero-chips badge-row">
            ${createBadges(data.technology)}
          </div>
        </div>
      </div>

      <div class="card-grid">
        <article class="info-card full">
          <h3>Nombre del proyecto</h3>
          <p>${escapeHTML(data.projectName)}</p>
        </article>

        <article class="info-card half">
          <h3>Contexto académico</h3>
          <p>
            Proyecto desarrollado como parte de la estadía profesional del alumno
            <strong>${escapeHTML(data.student)}</strong>, de la
            <strong>${escapeHTML(data.university)}</strong>, perteneciente a la carrera de
            <strong>${escapeHTML(data.career)}</strong>, durante el periodo
            <strong>${escapeHTML(data.period)}</strong> en
            <strong>${escapeHTML(data.location)}</strong>.
          </p>
        </article>

        <article class="info-card half">
          <h3>Contexto empresarial</h3>
          <p>
            El proyecto fue desarrollado en
            <strong>${escapeHTML(data.company)}</strong>,
            bajo supervisión del tutor empresarial
            <strong>${escapeHTML(data.businessTutor)}</strong>.
          </p>
        </article>

        <article class="info-card full">
          <h3>Empresa</h3>
          <p>${escapeHTML(data.companyDescription)}</p>
        </article>

        <article class="info-card half">
          <h3>Actividades de DT Informática</h3>
          <ul>
            ${createList(data.companyActivities)}
          </ul>
        </article>

        <article class="info-card half">
          <h3>Alcance del módulo</h3>
          <ul>
            ${createList(data.scope)}
          </ul>
        </article>

        <article class="info-card full">
          <h3>Desarrollo técnico</h3>
          <p>${escapeHTML(data.moduleDescription)}</p>
        </article>

        <article class="info-card full">
          <div class="note-box">
            <strong>Enfoque del manual:</strong>
            esta página documenta la estructura de base de datos, los scripts,
            el diseño del layout, las validaciones y el flujo operativo del módulo
            para que pueda mantenerse, revisarse y ampliarse de forma ordenada.
          </div>
        </article>
      </div>
    `;
  } catch (error) {
    renderAboutError(aboutSection, error);
  }
}