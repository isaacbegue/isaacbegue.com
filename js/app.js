// js/app.js
import { initRouter } from './modules/router.js';
import { injectHeaderFooter } from './modules/templates.js';

// Primero inyecta el header y footer, luego inicializa el router
document.addEventListener('DOMContentLoaded', async () => {
  await injectHeaderFooter();
  initRouter();
});
