export function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  const sections = document.querySelectorAll(".manual-section");

  if (!tabs.length) {
    console.warn("No se encontraron pestañas con la clase .nav-tab.");
    return;
  }

  if (!sections.length) {
    console.warn("No se encontraron secciones con la clase .manual-section.");
    return;
  }

  function activateSection(sectionId) {
    const sectionToShow = document.getElementById(sectionId);

    if (!sectionToShow) {
      console.warn(`No existe una sección con el id: ${sectionId}`);
      return;
    }

    tabs.forEach((tab) => {
      const isActive = tab.dataset.section === sectionId;

      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    sections.forEach((section) => {
      const isActive = section.id === sectionId;

      section.classList.toggle("active", isActive);

      if (isActive) {
        section.removeAttribute("hidden");
      } else {
        section.setAttribute("hidden", "true");
      }
    });
  }

  tabs.forEach((tab) => {
    tab.setAttribute("role", "tab");

    tab.addEventListener("click", () => {
      const targetSection = tab.dataset.section;

      if (!targetSection) {
        console.warn("La pestaña seleccionada no tiene atributo data-section.");
        return;
      }

      activateSection(targetSection);
    });
  });

  sections.forEach((section) => {
    section.setAttribute("role", "tabpanel");
  });

  const activeTab = document.querySelector(".nav-tab.active");
  const firstTab = tabs[0];

  const initialSection =
    activeTab?.dataset.section ||
    firstTab?.dataset.section ||
    sections[0]?.id;

  if (initialSection) {
    activateSection(initialSection);
  }
}