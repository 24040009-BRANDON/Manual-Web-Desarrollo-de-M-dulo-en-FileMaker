// Utilidades compartidas del manual web D&T Informática.
// Fuente única de verdad para funciones reutilizadas por los renderizadores.

/**
 * Escapa caracteres HTML para prevenir inyección (XSS) al insertar
 * texto en innerHTML. Acepta null/undefined sin romper.
 */
export function escapeHTML(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}
