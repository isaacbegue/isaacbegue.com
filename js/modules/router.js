// js/modules/router.js

// --- Importa las funciones de carga de páginas y la función de limpieza ---
import { loadMainPageData } from './pages/mainPage.js';
import { loadMusicaPageData, loadAlbumDetailPageData, loadSongDetailPageData } from './pages/musicaPage.js';
// Importa la función de limpieza junto con las de carga de publicaciones
import { loadPublicacionesPageData, loadPostDetailPageData, cleanupPageObserver } from './pages/publicacionesPage.js';
import { loadDescargasPageData } from './pages/descargasPage.js';
import { loadNotFoundPageData } from './pages/notFoundPage.js';

// --- Definición de Rutas (Ajustadas para no requerir '/') ---
const routeDefinitions = [
  {
    pattern: /^$/, // Coincide con hash vacío '' (proveniente de '#' o sin hash)
    template: 'views/pages/main.html',
    loadData: loadMainPageData
  },
  {
    pattern: /^musica\/?$/, // Coincide con 'musica' o 'musica/'
    template: 'views/pages/musica.html',
    loadData: loadMusicaPageData
  },
  {
    // Coincide con 'musica/ID_ALBUM' o 'musica/ID_ALBUM/'
    pattern: /^musica\/([a-zA-Z0-9_-]+)\/?$/,
    template: 'views/pages/album_detail.html',
    loadData: (params) => loadAlbumDetailPageData(params[0])
  },
  {
    // Coincide con 'musica/ID_ALBUM/ID_CANCION' o 'musica/ID_ALBUM/ID_CANCION/'
    pattern: /^musica\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/?$/,
    template: 'views/pages/song_detail.html',
    loadData: (params) => loadSongDetailPageData(params[0], params[1])
  },
  {
    pattern: /^publicaciones\/?$/, // Coincide con 'publicaciones' o 'publicaciones/'
    template: 'views/pages/publicaciones.html',
    loadData: loadPublicacionesPageData
  },
  {
    // Coincide con 'publicaciones/ID_POST' o 'publicaciones/ID_POST/' (Ruta General para secciones y subproyectos)
    // findNodeByIdRecursive buscará en toda la estructura
    pattern: /^publicaciones\/([a-zA-Z0-9_-]+)\/?$/,
    template: 'views/pages/post_detail.html',
    loadData: (params) => loadPostDetailPageData(params[0])
  },
  {
    pattern: /^descargas\/?$/, // Coincide con 'descargas' o 'descargas/'
    template: 'views/pages/descargas.html',
    loadData: loadDescargasPageData
  }
  // Puedes añadir más rutas aquí si es necesario
];

// Ruta para página no encontrada (404)
const route404 = {
  template: 'views/pages/404.html',
  loadData: loadNotFoundPageData
};

// --- Función para encontrar la ruta que coincide ---
function matchRoute(rawPath) { // Recibe el path SIN la barra inicial forzada
  for (const route of routeDefinitions) {
    const match = rawPath.match(route.pattern);
    if (match) {
      // console.log(`Route matched: ${route.pattern} with path: ${rawPath}`); // Debugging
      return { route, params: match.slice(1) }; // Devuelve la ruta y los parámetros capturados
    }
  }
  // Si ninguna ruta coincide, devuelve la ruta 404
  // console.log(`No route matched for path: ${rawPath}. Using 404.`); // Debugging
  return { route: route404, params: [] };
}

// --- Resaltar Pestaña Activa en la Navegación ---
function highlightCurrentTab() {
    const currentBase = (window.location.hash.slice(1) || '').split('/')[0];
    const navLinks = document.querySelectorAll('#main-navigation a'); // Asegúrate que tu nav tenga id="main-navigation"

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Para el enlace principal (href="#"), la base es ''
        const linkBase = (linkHref === '#') ? '' : (linkHref.slice(1).split('/')[0] || '');

        if (linkBase === currentBase) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}


// --- Función Principal del Router (MODIFICADA con limpieza de observer) ---
async function router() {
  console.log('Router: Hash change detected or initial load.'); // Log para depuración

  // --- Limpiar observer ANTES de cualquier otra cosa ---
  // Llama a la función de limpieza exportada desde publicacionesPage.js
  // Esto asegura que cualquier observer anterior (del scroll infinito) se desconecte.
  cleanupPageObserver();
  // --- Fin Limpieza ---

  // Obtiene el path directamente después del #
  const rawPath = window.location.hash.slice(1);
  // Encuentra la ruta correspondiente y extrae parámetros
  const { route, params } = matchRoute(rawPath);
  // Obtiene el elemento donde se cargará el contenido
  const appElement = document.getElementById('app');

  if (!appElement) {
    console.error("Elemento #app no encontrado en el DOM.");
    return; // No se puede continuar si no existe #app
  }

  // Muestra un estado de carga mientras se obtiene el HTML y los datos
  appElement.innerHTML = '<p class="centrado" style="padding: 50px 0;">Cargando...</p>';

  try {
    // 1. Carga la plantilla HTML de la vista
    const response = await fetch(route.template);
    if (!response.ok) {
      throw new Error(`No se pudo cargar la plantilla: ${route.template} (Status: ${response.status})`);
    }
    const html = await response.text();
    // Inserta el HTML de la plantilla en el contenedor #app
    appElement.innerHTML = html;

    // 2. Ejecuta la función para cargar los datos específicos de esa vista (si existe)
    if (route.loadData && typeof route.loadData === 'function') {
      // console.log(`Executing loadData for path: ${rawPath} with params:`, params); // Debugging
      await route.loadData(params); // Llama a la función (ej: loadMusicaPageData, loadPostDetailPageData, etc.)
    } else if (route !== route404) { // No mostrar warning para 404 si no tiene loadData
        console.warn(`No se definió o no es una función loadData para la ruta: ${rawPath}`);
    }

    // 3. Resalta la pestaña activa en la navegación
    highlightCurrentTab();
    // 4. Sube al inicio de la página
    window.scrollTo(0, 0);

  } catch (error) {
    // Manejo de errores: Si falla la carga de la plantilla o datos, intenta mostrar 404
    console.error("Error en el router:", error);
    try {
      const response404 = await fetch(route404.template);
      if (response404.ok) {
        appElement.innerHTML = await response404.text();
        // Intenta cargar los datos de la página 404 también (si los tuviera)
        if (route404.loadData) await route404.loadData();
      } else {
        // Si hasta la plantilla 404 falla
        appElement.innerHTML = '<h1>Error</h1><p>Ocurrió un error al cargar la página y la página de error tampoco pudo cargarse.</p>';
      }
    } catch (finalError) {
       // Error irrecuperable
       console.error("Error cargando la página 404:", finalError);
       appElement.innerHTML = '<h1>Error Fatal</h1><p>Ocurrió un error irrecuperable.</p>';
    }
    // Asegurarse de resaltar la pestaña correcta incluso en caso de error (puede que ninguna)
    highlightCurrentTab();
  }
}

// --- Inicialización del Router ---
export function initRouter() {
  // Escucha los cambios en el hash de la URL (cuando el usuario navega)
  window.addEventListener('hashchange', router);
  // --- Limpieza inicial por si acaso al cargar la aplicación ---
  cleanupPageObserver();
  // Ejecuta el router inmediatamente para cargar la vista inicial basada en el hash actual
  router();
}