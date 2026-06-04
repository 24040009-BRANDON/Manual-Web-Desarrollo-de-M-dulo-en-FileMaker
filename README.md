# Manual técnico — Módulo de Publicaciones DT Informática

Proyecto modular HTML/CSS/JS/JSON para documentar el desarrollo del módulo de gestión y publicación de contenido en redes sociales mediante FileMaker y Meta Graph API.

## Cómo abrirlo correctamente

Este proyecto usa módulos JavaScript (`type="module"`) y carga datos desde archivos JSON mediante `fetch()`. Por seguridad del navegador, no debe abrirse con doble clic usando `file://`.

Forma correcta:

1. Abrir la carpeta en Visual Studio Code.
2. Instalar o usar la extensión Live Server.
3. Clic derecho sobre `index.html`.
4. Seleccionar `Open with Live Server`.
5. Abrirlo desde una URL tipo `http://127.0.0.1:5500/`.

## Estructura

```text
MANUALES_WEB_DT/
├── index.html
├── README.md
└── assets/
    ├── css/
    ├── data/
    └── js/
```

## Pestañas integradas

- Base de datos
- Lista de scripts
- Diseño y arquitectura del Layout
- Acerca de

## Notas técnicas

- La versión modular es la base de desarrollo.
- Una versión autocontenida de un solo HTML puede generarse después como exportación portable, pero no debe reemplazar esta arquitectura.
- Los datos técnicos se mantienen separados en JSON para facilitar mantenimiento y futuras correcciones.
