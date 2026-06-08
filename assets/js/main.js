import { initTabs } from "./tabs.js";
import { renderDatabase } from "./renderDatabase.js";
import { renderScripts } from "./renderScripts.js";
import { renderLayout } from "./renderLayout.js";
import { renderAbout } from "./renderAbout.js";

async function runRenderer(renderer, name) {
  if (typeof renderer !== "function") {
    console.warn(`El renderizador ${name} no es una función válida.`);
    return;
  }

  try {
    await renderer();
  } catch (error) {
    console.error(`Error al ejecutar ${name}:`, error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    initTabs();
    initThemeToggle();

    await runRenderer(renderDatabase, "renderDatabase");
    await runRenderer(renderScripts, "renderScripts");
    await runRenderer(renderLayout, "renderLayout");
    await runRenderer(renderAbout, "renderAbout");
  } catch (error) {
    console.error("Error al inicializar la página:", error);
  }
});

/**
 * Alterna entre modo oscuro (por defecto) y modo claro "PUCU".
 * Aplica data-theme en <html> y recuerda la preferencia en memoria de sesión.
 */
function initThemeToggle() {
  const btn = document.getElementById("themeToggle");
  const label = document.getElementById("themeToggleLabel");
  if (!btn) return;

  const root = document.documentElement;

  const apply = (theme) => {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      if (label) label.textContent = "Dark";
    } else {
      root.removeAttribute("data-theme");
      if (label) label.textContent = "Light";
    }
  };

  // Estado inicial: oscuro
  let current = "dark";
  apply(current);

  btn.addEventListener("click", () => {
    current = current === "light" ? "dark" : "light";
    apply(current);
  });
}