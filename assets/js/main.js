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

    await runRenderer(renderDatabase, "renderDatabase");
    await runRenderer(renderScripts, "renderScripts");
    await runRenderer(renderLayout, "renderLayout");
    await runRenderer(renderAbout, "renderAbout");
  } catch (error) {
    console.error("Error al inicializar la página:", error);
  }
});