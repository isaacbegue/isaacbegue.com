// js/modules/dataAccess.js

// --- Variables de Caché a nivel de Módulo ---
// Se inicializan como null. Una vez que se cargan los datos,
// se almacenarán aquí para evitar fetches repetidos.
let cachedAlbums = null;
let cachedSiteInfo = null;
let cachedPosts = null;

// --- Función Genérica para Fetch (con reintento simple opcional) ---
// (No cambia fundamentalmente, pero podrías añadir lógica de reintento aquí si quisieras)
async function fetchData(url) {
    try {
      console.log(`Workspaceing data from: ${url}`); // Log para ver cuándo ocurre el fetch real
      const response = await fetch(url);
      if (!response.ok) {
        // Podrías intentar resetear el caché específico si falla,
        // aunque si falla la primera vez, el caché aún sería null.
        console.error(`Error fetching ${url}: Status ${response.status}`);
        throw new Error(`Error fetching ${url}: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Data fetch error:", error);
      // Propagar el error para que la función que llama lo maneje
      throw error;
    }
}

// --- Funciones de Acceso a Datos (MODIFICADAS con caché) ---

/**
 * Obtiene los datos de los álbumes.
 * Usa caché en memoria para evitar fetches repetidos.
 * @returns {Promise<Array>} Una promesa que resuelve con el array de álbumes.
 */
export async function fetchAlbums() {
    // Si ya tenemos los datos en caché, devolverlos directamente (envueltos en Promise.resolve)
    if (cachedAlbums !== null) {
        console.log("Returning cached Albums data."); // Log para depuración
        return Promise.resolve(cachedAlbums);
    }

    // Si no están en caché, hacer el fetch
    console.log("Cache miss for Albums. Fetching...");
    try {
        const data = await fetchData('data/albums.json');
        cachedAlbums = data; // Guardar en caché
        return data;
    } catch (error) {
        console.error("Failed to fetch and cache Albums:", error);
        // Resetear caché en caso de error para permitir reintento en la próxima llamada
        cachedAlbums = null;
        throw error; // Propagar el error
    }
}

/**
 * Obtiene la información del sitio (enlaces sociales, descargas).
 * Usa caché en memoria.
 * @returns {Promise<Array>} Una promesa que resuelve con los datos del sitio.
 */
export async function fetchSiteInfo() {
    if (cachedSiteInfo !== null) {
        console.log("Returning cached Site Info data.");
        return Promise.resolve(cachedSiteInfo);
    }

    console.log("Cache miss for Site Info. Fetching...");
    try {
        const data = await fetchData('data/site_info.json');
        cachedSiteInfo = data;
        return data;
    } catch (error) {
        console.error("Failed to fetch and cache Site Info:", error);
        cachedSiteInfo = null;
        throw error;
    }
}

/**
 * Obtiene los datos de las publicaciones.
 * Usa caché en memoria.
 * @returns {Promise<Array>} Una promesa que resuelve con el array de posts.
 */
export async function fetchPosts() {
    if (cachedPosts !== null) {
        console.log("Returning cached Posts data.");
        return Promise.resolve(cachedPosts);
    }

    console.log("Cache miss for Posts. Fetching...");
    try {
        const data = await fetchData('data/posts.json');
        cachedPosts = data;
        return data;
    } catch (error) {
        console.error("Failed to fetch and cache Posts:", error);
        cachedPosts = null;
        throw error;
    }
}

// --- (Opcional) Función para Limpiar el Caché ---
// Podría ser útil si en el futuro implementas alguna forma de actualizar los datos
// sin recargar la página. Por ahora, no es estrictamente necesaria.
/*
export function clearDataCache() {
    console.log("Clearing data cache...");
    cachedAlbums = null;
    cachedSiteInfo = null;
    cachedPosts = null;
}
*/