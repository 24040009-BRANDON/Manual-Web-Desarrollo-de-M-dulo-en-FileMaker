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

/**
 * Devuelve el HTML del fondo decorativo (glows + iconos flotantes)
 * idéntico al del inicio, para reutilizarlo en los heroes de los
 * demás módulos. Usa la clase .hero-bg (estilada en hero-bg.css)
 * para no chocar con .hm-bg del inicio. Los SVG usan currentColor
 * y se adaptan a cada tema.
 */
export function heroBackgroundHTML() {
  return `
    <div class="hero-bg" aria-hidden="true">
      <div class="hero-glow hero-glow-1"></div>
      <div class="hero-glow hero-glow-2"></div>
      <div class="hero-shape hero-shape-1"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg></div>
      <div class="hero-shape hero-shape-2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></div>
      <div class="hero-shape hero-shape-3"><svg viewBox="0 0 100 100" fill="currentColor"><rect x="10" y="30" width="80" height="50" rx="8" fill="none" stroke="currentColor" stroke-width="3"/><text x="50" y="62" font-size="26" font-weight="700" text-anchor="middle" font-family="Oswald, sans-serif">D&amp;T</text></svg></div>
      <div class="hero-shape hero-shape-4"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg></div>
      <div class="hero-shape hero-shape-5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/></svg></div>
      <div class="hero-shape hero-shape-6"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/><circle cx="7" cy="6.5" r=".9" fill="currentColor"/><circle cx="7" cy="17.5" r=".9" fill="currentColor"/></svg></div>
      <div class="hero-shape hero-shape-7"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
      <div class="hero-shape hero-shape-8"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 18a4 4 0 0 1 1-7.87A5 5 0 0 1 17 9a3.5 3.5 0 0 1 0 9H6z"/></svg></div>
    </div>`;
}