// js/modules/pages/mainPage.js
import { fetchAlbums, fetchPosts } from '../dataAccess.js';
import { findNodeByIdRecursive } from './publicacionesPage.js'; // Reutilizamos la función de búsqueda
// Importamos la función para crear enlaces de escucha (si no está aquí, habría que copiarla o importarla de otro lugar)
// Asumiremos por ahora que está disponible globalmente o la copiaremos aquí si es necesario.
// TEMPORAL: Copiamos la función createListenLinks aquí para evitar dependencia circular o refactorización mayor ahora.
// Idealmente, mover a un archivo 'utils.js'
function createListenLinks(platformUrls, iconSize = '30px') {
    let linksHtml = '';
    if (platformUrls.spotify_url && platformUrls.spotify_url !== 'null') {
        linksHtml += `
      <a target="_blank" rel="noopener noreferrer" title="Escuchar en Spotify" class="icono-escucha" href="${platformUrls.spotify_url}">
        <img src="assets/img/logos/spotify_brands.svg" alt="Spotify" style="width:${iconSize}; height:auto;">
      </a>`;
    }
    if (platformUrls.youtubemusic_url && platformUrls.youtubemusic_url !== 'null') {
        linksHtml += `
      <a target="_blank" rel="noopener noreferrer" title="Escuchar en YouTube Music" class="icono-escucha" href="${platformUrls.youtubemusic_url}">
        <img src="assets/img/logos/Youtube_Music_icon.svg" alt="YouTube Music" style="width:${iconSize}; height:auto;">
      </a>`;
    }
     if (platformUrls.youtube_url && platformUrls.youtube_url !== 'null') { // Para canciones individuales de covers (si aplica)
        linksHtml += `
      <a target="_blank" rel="noopener noreferrer" title="Escuchar en YouTube" class="icono-escucha" href="${platformUrls.youtube_url}">
        <img src="assets/img/logos/youtube_brands.svg" alt="YouTube" style="width:${iconSize}; height:auto;">
      </a>`;
    }
    // Añadir más plataformas si es necesario (ej. Apple Music, etc.)

    // Si no hay ningún enlace de streaming principal
    if (!linksHtml && !platformUrls.noStreamingText) {
       linksHtml = `<span class="no-streaming" style="font-size: 0.8em; opacity: 0.7;"></span>`; // Quizás no mostrar nada si no hay links
    } else if (!linksHtml && platformUrls.noStreamingText){
         linksHtml = `<span class="no-streaming" style="font-size: 0.8em; opacity: 0.7;">${platformUrls.noStreamingText}</span>`;
    }

    return `<div class="enlaces-escuchar">${linksHtml}</div>`;
}
// FIN TEMPORAL

// --- Helper para crear los botones de álbum destacado (Sin cambios respecto a la versión anterior)---
function createRandomAlbumButtons(album) {
    if (!album || !album.data) return '<p style="color: white; text-align: center; width: 100%;">No hay álbum destacado disponible.</p>';

    let buttonsHtml = '';
    const coverSrc = album.data.cover || 'assets/img/placeholder.png';
    const albumTitle = album.title || 'Álbum';
    // Corregir URL base para que use original_id si existe, si no, el id del nodo
    const albumUrlBase = `#musica/${album.data.original_id || album.id}`;

    // --- Lógica Botón 1 ---
    let link1Href = albumUrlBase;
    let link1Platform = '';
    let link1Icon = 'assets/img/logos/info-circle-solid.svg'; // Icono info por defecto
    let link1IsStreaming = false;

    if (album.data.spotify_url && album.data.spotify_url !== 'null') { // Añadido check 'null'
        link1Href = album.data.spotify_url;
        link1Platform = 'Spotify';
        link1Icon = 'assets/img/logos/spotify_brands.svg';
        link1IsStreaming = true;
    } else if (album.data.youtubemusic_url && album.data.youtubemusic_url !== 'null') { // Añadido check 'null'
        link1Href = album.data.youtubemusic_url;
        link1Platform = 'YouTube Music';
        link1Icon = 'assets/img/logos/Youtube_Music_icon.svg';
        link1IsStreaming = true;
    }

    buttonsHtml += `
        <a title="Da click para ${link1IsStreaming ? `abrir '${albumTitle}' en ${link1Platform}` : `ver detalles de '${albumTitle}'`}" href="${link1Href}" ${link1IsStreaming ? 'target="_blank" rel="noopener noreferrer"' : ''}>
            <img src="${coverSrc}" alt="Portada ${albumTitle}" class="portada4">
            <p>
                ${link1IsStreaming ? `Escuchar <em>${albumTitle}</em> en ${link1Platform}` : `Ver detalles de <em>${albumTitle}</em>`}
            </p>
            <img src="${link1Icon}" class="iconos" alt="${link1Platform || 'Info'}">
        </a>
    `;

    // --- Lógica Botón 2 ---
    let link2Href = albumUrlBase;
    let link2Platform = '';
    let link2Icon = 'assets/img/logos/info-circle-solid.svg';
    let link2IsStreaming = false;

    if (album.data.youtubemusic_url && album.data.youtubemusic_url !== 'null' && link1Href !== album.data.youtubemusic_url) {
        link2Href = album.data.youtubemusic_url;
        link2Platform = 'YouTube Music';
        link2Icon = 'assets/img/logos/Youtube_Music_icon.svg';
        link2IsStreaming = true;
    }
    else if (album.data.youtube_playlist_url && album.data.youtube_playlist_url !== 'null' && link1Href !== album.data.youtube_playlist_url) {
        link2Href = album.data.youtube_playlist_url;
        link2Platform = 'YouTube';
        link2Icon = 'assets/img/logos/youtube_brands.svg';
        link2IsStreaming = true;
    }
    // Si aún no tenemos link 2 de streaming, y el link 1 SÍ era de streaming,
    // entonces el link 2 puede ser el de detalle del álbum (si no es el mismo que el 1)
    else if (link1IsStreaming && link2Href === albumUrlBase && link1Href !== albumUrlBase) {
         link2Platform = 'Info'; // Ya no es streaming
         link2Icon = 'assets/img/logos/info-circle-solid.svg';
         link2IsStreaming = false;
    }
    // Si el link 1 NO era de streaming, y link2 sigue siendo albumUrlBase, NO mostramos segundo botón redundante.
    else if (!link1IsStreaming && link2Href === albumUrlBase) {
         link2Href = null; // Marcar para no mostrar
    }


     if (link2Href && (link2Href !== link1Href || (!link1IsStreaming && link2IsStreaming))) {
         buttonsHtml += `
            <a title="Da click para ${link2IsStreaming ? `abrir '${albumTitle}' en ${link2Platform}` : `ver detalles de '${albumTitle}'`}" href="${link2Href}" ${link2IsStreaming ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                <img src="${coverSrc}" alt="Portada ${albumTitle}" class="portada4">
                <p>
                     ${link2IsStreaming ? `Escuchar <em>${albumTitle}</em> en ${link2Platform}` : `Ver detalles de <em>${albumTitle}</em>`}
                </p>
                <img src="${link2Icon}" class="iconos" alt="${link2Platform || 'Info'}">
            </a>
        `;
     }

    return buttonsHtml;
}


// --- Helper para extraer un snippet de texto/HTML ---
function extractSnippet(htmlContent, maxLength = 250) {
    if (!htmlContent) return '';

    // 1. Quitar etiquetas HTML para obtener texto plano
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    let text = tempDiv.textContent || tempDiv.innerText || '';

    // 2. Limitar longitud
    if (text.length > maxLength) {
        text = text.substring(0, maxLength).trim() + '...';
    }
    return text;
}

// --- Helper para formatear un item del feed (REFINADO) ---
function formatFeedItem(item) {
    if (!item || !item.data) {
        console.warn("Intentando formatear un item inválido:", item);
        return '<div class="feed-item contenedor" style="border: 1px solid red;"><p>Error al procesar este item.</p></div><hr>';
    }

    let itemHtml = '<div class="feed-item contenedor">'; // Añade clase contenedor
    const title = item.title || 'Sin Título';
    let snippet = '';
    let link = '#';
    let linkText = 'Ver más';
    let typeText = '';
    let listenLinksHtml = ''; // Para enlaces de escucha de canciones

    try {
        // Determinar enlace principal (al detalle)
        if (item.type === 'song') {
            link = `#musica/${item.albumId}/${item.data.original_id || item.id}`;
            linkText = 'Ver letra y comentarios';
            typeText = `<small><em>(Canción de ${item.albumTitle || 'álbum desconocido'})</em></small>`;
            // Usar el comentario como snippet principal si existe, si no, la letra
            snippet = extractSnippet(item.data.commentary || item.data.lyrics);
            // Generar enlaces de escucha específicos para la canción
            listenLinksHtml = createListenLinks(item.data, '20px'); // Iconos pequeños para feed

        } else if (item.type === 'post_section') {
            // Para secciones como Autobiografía, Issy Reverb (que tienen 'commentary')
            link = `#publicaciones/${item.data.original_id || item.id}`;
            linkText = `Leer ${title}`;
            typeText = '<small><em>(Publicación)</em></small>';
            snippet = extractSnippet(item.data.commentary); // Extraer de commentary

        } else if (item.type === 'post_thought') {
             // Para pensamientos individuales
            link = `#publicaciones/${item.data.original_id || item.id}`;
            linkText = 'Leer pensamiento';
            const date = item.data.fecha ? `(${item.data.fecha}) ` : '';
            typeText = `<small><em>${date}(Pensamiento Disperso)</em></small>`;
            snippet = extractSnippet(item.data.commentary); // Extraer de commentary
        }
         else {
             // Caso por defecto o tipo no reconocido
             console.warn("Tipo de item no reconocido para feed:", item.type, item);
             snippet = 'Contenido no disponible para vista previa.';
         }

        // Construir HTML
        itemHtml += `<h2>${title} ${typeText}</h2>`;
        if (snippet) {
            itemHtml += `<p>${snippet}</p>`;
        }
         // Añadir enlaces de escucha si es una canción y tiene enlaces
        if (item.type === 'song' && listenLinksHtml.includes('<a')) {
            itemHtml += `<p>Puedes escucharla en: ${listenLinksHtml}</p>`;
        }

        itemHtml += `<p class="centrado"><a title="${linkText}" href="${link}">${linkText}</a></p>`;

    } catch (error) {
        console.error(`Error formateando item del feed: ${title}`, error, item);
        itemHtml += `<p style="color: red;">Error al mostrar vista previa.</p><p class="centrado"><a href="${link}">Ir al contenido</a></p>`;
    }

    itemHtml += '<hr></div>';
    return itemHtml;
}


// --- Función Principal para Cargar Datos de Main (REVISADA) ---
export async function loadMainPageData() {
    console.log("Cargando datos para la página principal...");
    const albumButtonsContainer = document.getElementById('random-album-buttons');
    const feedContainer = document.getElementById('main-feed-content');

    // --- Cargar Álbum Aleatorio (Sin cambios mayores) ---
    if (albumButtonsContainer) {
        try {
            const albums = await fetchAlbums();
            // Filtrar álbumes que NO sean la colección de covers Y que tengan algún link de streaming
            const suitableAlbums = albums.filter(album =>
                album.id !== 'node-ep-covers-1' && // Excluir explícitamente la colección de covers por ID
                ( (album.data.spotify_url && album.data.spotify_url !== 'null') ||
                  (album.data.youtubemusic_url && album.data.youtubemusic_url !== 'null') )
            );

            let randomAlbum = null;
            if (suitableAlbums.length > 0) {
                const randomIndex = Math.floor(Math.random() * suitableAlbums.length);
                randomAlbum = suitableAlbums[randomIndex];
            } else {
                // Fallback: si no hay con streaming, busca uno que NO sea covers
                 const fallbackAlbum = albums.find(album => album.id !== 'node-ep-covers-1');
                 randomAlbum = fallbackAlbum || null; // Si solo existiera el de covers, sería null
            }
             albumButtonsContainer.innerHTML = createRandomAlbumButtons(randomAlbum);

        } catch (error) {
            console.error("Error cargando álbum aleatorio:", error);
            albumButtonsContainer.innerHTML = '<p style="color: orange; text-align: center; width: 100%;">Error al cargar álbum destacado.</p>';
        }
    } else {
        console.warn("Contenedor #random-album-buttons no encontrado.");
    }

    // --- Cargar Feed (NUEVA LÓGICA) ---
    if (feedContainer) {
        feedContainer.innerHTML = '<p class="centrado">Cargando publicaciones...</p>'; // Estado de carga
        try {
            const [albums, posts] = await Promise.all([fetchAlbums(), fetchPosts()]);
            let eligibleFeedItems = [];

            // 1. Recopilar Canciones elegibles (con letra Y comentario)
            albums.forEach(album => {
                // Excluir la colección de covers de aparecer como canciones individuales en el feed
                if (album.children && album.id !== 'node-ep-covers-1') {
                    album.children.forEach(song => {
                        if (song.data && song.data.lyrics && song.data.commentary) {
                            eligibleFeedItems.push({
                                ...song, // Copia todas las propiedades de la canción
                                type: 'song',
                                albumTitle: album.title, // Añade título del álbum
                                albumId: album.data.original_id || album.id // Añade ID del álbum para el link
                            });
                        }
                    });
                }
            });

            // 2. Recopilar Secciones y Pensamientos elegibles (con 'commentary')
            const pensamientosNodeId = 'node-1743726647566-wq9nk'; // ID de "Pensamientos dispersos"
            const otrosProyectosNodeId = 'node-1743726534022-nlvt5'; // ID de "Otros proyectos" (excluir)
            const programacionNodeId = 'node-1743726621562-5wj2g'; // ID de "Programación" (excluir si está vacío)

            posts.forEach(postNode => {
                 // Si es un nodo principal (sección) y TIENE commentary y NO es uno de los excluidos
                 if (postNode.data && postNode.data.commentary &&
                     postNode.id !== pensamientosNodeId &&
                     postNode.id !== otrosProyectosNodeId &&
                     postNode.id !== programacionNodeId)
                 {
                    eligibleFeedItems.push({
                        ...postNode,
                        type: 'post_section'
                    });
                }
                 // Si es el nodo "Pensamientos dispersos", procesar sus hijos
                 else if (postNode.id === pensamientosNodeId && postNode.children) {
                    postNode.children.forEach(thought => {
                        if (thought.data && thought.data.commentary) {
                            eligibleFeedItems.push({
                                ...thought,
                                type: 'post_thought'
                            });
                        }
                    });
                }
            });

             // 3. Mezclar y Seleccionar
             eligibleFeedItems.sort(() => 0.5 - Math.random()); // Mezclar aleatoriamente
             const selectedItems = eligibleFeedItems.slice(0, 5); // Tomar los primeros 5

             // 4. Renderizar
             let feedHtml = '';
             if (selectedItems.length > 0) {
                 console.log("Items seleccionados para el feed:", selectedItems); // Log para depuración
                 selectedItems.forEach(item => {
                     feedHtml += formatFeedItem(item);
                 });
             } else {
                 feedHtml = '<p class="centrado">No hay publicaciones disponibles para mostrar en el feed.</p>';
             }
             // Asegúrate de que el contenedor se limpie antes de añadir el nuevo HTML
             feedContainer.innerHTML = `<h2 class="centrado">Publicaciones</h2>${feedHtml}`;

        } catch (error) {
            console.error("Error general cargando el feed:", error);
            feedContainer.innerHTML = `<h2 class="centrado">Publicaciones</h2><p class="centrado" style="color: orange;">Error al cargar el feed. Revisa la consola (F12).</p><p style="color:grey; font-size:0.8em; text-align:center;">(${error.message})</p>`;
        }
    } else {
        console.warn("Contenedor #main-feed-content no encontrado.");
    }
}
