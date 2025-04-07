// js/modules/pages/musicaPage.js
import { fetchAlbums } from '../dataAccess.js';

// --- Helper para crear enlaces de escucha (Sin cambios) ---
function createListenLinks(platformUrls, iconSize = '30px') {
    let linksHtml = '';
    // Spotify
    if (platformUrls.spotify_url && platformUrls.spotify_url !== 'null') {
        linksHtml += `
      <a target="_blank" rel="noopener noreferrer" title="Escuchar en Spotify" class="icono-escucha" href="${platformUrls.spotify_url}">
        <img src="assets/img/logos/spotify_brands.svg" alt="Spotify" style="width:${iconSize}; height:auto;">
      </a>`;
    }
    // YouTube Music
    if (platformUrls.youtubemusic_url && platformUrls.youtubemusic_url !== 'null') {
        linksHtml += `
      <a target="_blank" rel="noopener noreferrer" title="Escuchar en YouTube Music" class="icono-escucha" href="${platformUrls.youtubemusic_url}">
        <img src="assets/img/logos/Youtube_Music_icon.svg" alt="YouTube Music" style="width:${iconSize}; height:auto;">
      </a>`;
    }
    // YouTube Playlist (para álbumes como Covers o Algoritmo)
    if (platformUrls.youtube_playlist_url && platformUrls.youtube_playlist_url !== 'null') {
        linksHtml += `
      <a target="_blank" rel="noopener noreferrer" title="Escuchar Playlist en YouTube" class="icono-escucha" href="${platformUrls.youtube_playlist_url}">
        <img class="youtube" src="assets/img/logos/youtube_brands.svg" alt="YouTube Playlist" style="width:${iconSize}; height:auto;">
      </a>`;
    }
     // YouTube Individual (para canciones de Covers o Algoritmo)
     if (platformUrls.youtube_url && platformUrls.youtube_url !== 'null') {
        linksHtml += `
      <a target="_blank" rel="noopener noreferrer" title="Escuchar en YouTube" class="icono-escucha" href="${platformUrls.youtube_url}">
        <img src="assets/img/logos/youtube_brands.svg" alt="YouTube" style="width:${iconSize}; height:auto;">
      </a>`;
    }
    // Si no hay ningún enlace principal (ni Spotify ni YTMusic)
    const hasPrimaryLink = (platformUrls.spotify_url && platformUrls.spotify_url !== 'null') || (platformUrls.youtubemusic_url && platformUrls.youtubemusic_url !== 'null');
    if (!hasPrimaryLink && !linksHtml && !platformUrls.noStreamingText) { // Si no hay primarios NI otros links (YT)
       linksHtml = `<span class="no-streaming" style="font-size: 0.8em; opacity: 0.7;"></span>`; // No mostrar nada si no hay links
    } else if (!linksHtml && platformUrls.noStreamingText){ // Si no hay links pero sí texto alternativo
         linksHtml = `<span class="no-streaming" style="font-size: 0.8em; opacity: 0.7;">${platformUrls.noStreamingText}</span>`;
    }

    return `<div class="enlaces-escuchar">${linksHtml}</div>`;
}


// --- Carga la página principal de Música (listas) ---
export async function loadMusicaPageData() {
    console.log("Cargando datos para la página de Música...");
    const albumListContainer = document.getElementById('albumList');
    const originalSongTable = document.getElementById('originalSongList');
    const coverSongTable = document.getElementById('coverSongList');
    // --- NUEVO: Obtener el contenedor de la nueva tabla ---
    const algoritmoSongTable = document.getElementById('algoritmoSongList');
    // --- FIN NUEVO ---

    // --- MODIFICADO: Verificar que exista el nuevo contenedor ---
    if (!albumListContainer || !originalSongTable || !coverSongTable || !algoritmoSongTable) {
        console.error("Error: No se encontraron los contenedores necesarios en musica.html (albumList, originalSongList, coverSongList, algoritmoSongList)");
        return;
    }
    // --- FIN MODIFICADO ---

    albumListContainer.innerHTML = '<p class="centrado">Cargando álbumes...</p>';
    // Inicializar tablas con cabeceras y mensaje de carga
    originalSongTable.innerHTML = '<caption>Originales</caption><thead><tr><th>Nombre</th><th>Álbum</th><th>Escuchar en</th></tr></thead><tbody><tr><td colspan="3">Cargando canciones...</td></tr></tbody>';
    coverSongTable.innerHTML = '<caption>Covers</caption><thead><tr><th>Nombre</th><th>Escuchar en</th></tr></thead><tbody><tr><td colspan="2">Cargando covers...</td></tr></tbody>';
    // --- NUEVO: Inicializar la nueva tabla ---
    algoritmoSongTable.innerHTML = '<caption>No fui yo, fue el algoritmo</caption><thead><tr><th>Nombre</th><th>Escuchar en</th></tr></thead><tbody><tr><td colspan="2">Cargando canciones...</td></tr></tbody>';
    // --- FIN NUEVO ---

    try {
        const albumsData = await fetchAlbums(); // Usará el caché si ya se cargó

        let albumsHtml = '<ul class="columnas-albumes">';
        let originalSongsBodyHtml = ''; // Para el tbody de originales
        let coverSongsBodyHtml = '';    // Para el tbody de covers
        // --- NUEVO: String para el cuerpo de la nueva tabla ---
        let algoritmoSongsBodyHtml = '';// Para el tbody de algoritmo
        // --- FIN NUEVO ---

        let hasOriginals = false;
        let hasCovers = false;
        // --- NUEVO: Flag para la nueva tabla ---
        let hasAlgoritmoSongs = false;
        // --- FIN NUEVO ---

        if (albumsData && albumsData.length > 0) {
             // Identificadores únicos para los álbumes especiales
             const coversAlbumId = 'covers'; // Asumiendo que 'covers' es el original_id
             // --- NUEVO: ID para el nuevo álbum (ajusta si es diferente cuando lo añadas) ---
             const algoritmoAlbumId = 'no-fui-yo-fue-el-algoritmo';
             // --- FIN NUEVO ---


            albumsData.forEach(albumNode => {
                const albumOriginalId = albumNode.data?.original_id || albumNode.id; // Usar original_id si existe

                // Renderizar la tarjeta del álbum (sin cambios)
                albumsHtml += `
                  <li class="lista-albumes">
                    <a title="Más información sobre ${albumNode.title}" href="#musica/${albumOriginalId}">
                      <img class="portada" src="${albumNode.data.cover || 'assets/img/placeholder.png'}" alt="Portada ${albumNode.title}">
                      <figcaption>
                        ${albumNode.title}
                        ${albumNode.data.year ? `<small>${albumNode.data.year}</small>` : ''}
                      </figcaption>
                    </a>
                    <div class="enlaces-escuchar-cajas">
                        ${createListenLinks(albumNode.data, '40px')}
                    </div>
                  </li>
                `;

                // Iterar canciones DENTRO de cada álbum para las tablas
                if (albumNode.children && albumNode.children.length > 0) {
                    albumNode.children.forEach(songNode => {
                        const songOriginalId = songNode.data?.original_id || songNode.id;
                        const songDetailLink = `#musica/${albumOriginalId}/${songOriginalId}`;
                        // Pasar solo youtube_url para canciones de Covers y Algoritmo
                        const songListenLinks = createListenLinks({ youtube_url: songNode.data?.youtube_url });
                        const albumLink = `#musica/${albumOriginalId}`;

                        // Crear título (con o sin enlace a detalles)
                        let songTitleHtml;
                        const hasLyrics = songNode.data?.lyrics && songNode.data.lyrics.trim() !== '';
                        const hasCommentary = songNode.data?.commentary && songNode.data.commentary.trim() !== '';
                        if (hasLyrics || hasCommentary) {
                            songTitleHtml = `<a title="Ver letra y/o comentarios" href="${songDetailLink}">${songNode.title}</a>`;
                        } else {
                            songTitleHtml = `<span>${songNode.title}</span>`;
                        }

                        // --- MODIFICADO: Clasificar canción y añadir a la tabla correcta ---
                        if (albumOriginalId === coversAlbumId) {
                             hasCovers = true;
                             coverSongsBodyHtml += `
                                <tr>
                                  <td>${songTitleHtml}</td>
                                  <td>${songListenLinks}</td>
                                </tr>
                             `;
                        } else if (albumOriginalId === algoritmoAlbumId) { // NUEVA CONDICIÓN
                             hasAlgoritmoSongs = true;
                             algoritmoSongsBodyHtml += `
                                <tr>
                                  <td>${songTitleHtml}</td>
                                  <td>${songListenLinks}</td>
                                </tr>
                             `;
                        } else { // Si no es Covers ni Algoritmo, es Original
                            hasOriginals = true;
                             // Para originales, pasar todos los links posibles
                            const originalSongListenLinks = createListenLinks(songNode.data);
                            originalSongsBodyHtml += `
                                <tr>
                                  <td>${songTitleHtml}</td>
                                  <td class="centrado"><a title="Información sobre el álbum" href="${albumLink}">${albumNode.title}</a></td>
                                  <td>${originalSongListenLinks}</td>
                                </tr>
                            `;
                        }
                        // --- FIN MODIFICADO ---
                    });
                }
            });
            albumsHtml += '</ul>';
        } else {
             albumsHtml = '<p class="centrado">No hay álbumes para mostrar.</p>';
        }

        // Insertar HTML de las tarjetas de álbumes
         albumListContainer.innerHTML = albumsHtml;

        // Construir y actualizar el contenido de las tablas de canciones
        if (!hasOriginals) originalSongsBodyHtml = '<tr><td colspan="3">No hay canciones originales disponibles.</td></tr>';
        if (!hasCovers) coverSongsBodyHtml = '<tr><td colspan="2">No hay covers disponibles.</td></tr>';
        // --- NUEVO: Comprobar si hay canciones para la nueva tabla ---
        if (!hasAlgoritmoSongs) algoritmoSongsBodyHtml = '<tr><td colspan="2">Aún no hay canciones disponibles para este álbum.</td></tr>';
        // --- FIN NUEVO ---

        // Actualizar el tbody de cada tabla
        originalSongTable.querySelector('tbody').innerHTML = originalSongsBodyHtml;
        coverSongTable.querySelector('tbody').innerHTML = coverSongsBodyHtml;
        // --- NUEVO: Actualizar la nueva tabla ---
        algoritmoSongTable.querySelector('tbody').innerHTML = algoritmoSongsBodyHtml;
         // Opcional: Ocultar la tabla si no tiene canciones (descomentar si se desea)
         // algoritmoSongTable.style.display = hasAlgoritmoSongs ? '' : 'none';
        // --- FIN NUEVO ---


    } catch (error) {
        console.error("Error cargando datos para la página de Música:", error);
        albumListContainer.innerHTML = '<p class="centrado error-mensaje">Error al cargar álbumes.</p>';
        originalSongTable.querySelector('tbody').innerHTML = '<tr><td colspan="3">Error al cargar canciones.</td></tr>';
        coverSongTable.querySelector('tbody').innerHTML = '<tr><td colspan="2">Error al cargar covers.</td></tr>';
        // --- NUEVO: Mensaje de error para la nueva tabla ---
        algoritmoSongTable.querySelector('tbody').innerHTML = '<tr><td colspan="2">Error al cargar canciones.</td></tr>';
        // --- FIN NUEVO ---
    }
}


// --- Carga la página de detalle de un Álbum (Sin cambios) ---
export async function loadAlbumDetailPageData(albumId) {
    console.log(`Cargando detalle del álbum: ${albumId}`);
    const appElement = document.getElementById('app');
    // ... (resto del código de loadAlbumDetailPageData sin cambios) ...
    // ... (asegúrate de que usa la función createListenLinks actualizada si es necesario) ...
     if (!appElement) {
        console.error("Contenedor #app no encontrado");
        return;
    }
    const titleElement = appElement.querySelector('#album-detail-title');
    const coverElement = appElement.querySelector('#album-detail-cover');
    const yearElement = appElement.querySelector('#album-detail-year');
    const linksElement = appElement.querySelector('#album-detail-links');
    const songListElement = appElement.querySelector('#album-detail-songlist');
    const descriptionElement = appElement.querySelector('#album-detail-description');

    if (!titleElement || !coverElement || !linksElement || !songListElement || !descriptionElement || !yearElement) {
         console.error("Error: Faltan elementos con IDs requeridos en album_detail.html");
         return;
    }

     titleElement.textContent = 'Cargando...';
     coverElement.alt = 'Cargando...';
     coverElement.src = 'assets/img/placeholder.png'; // Placeholder mientras carga
     yearElement.textContent = '';
     linksElement.innerHTML = '';
     songListElement.innerHTML = '<li>Cargando canciones...</li>';
     descriptionElement.innerHTML = '<p>Cargando descripción...</p>';

    try {
        const albumsData = await fetchAlbums();
        const albumNode = albumsData.find(node => (node.data?.original_id === albumId || node.id === albumId));

        if (albumNode) {
            const albumOriginalId = albumNode.data?.original_id || albumNode.id; // ID a usar en links
            titleElement.textContent = albumNode.title;
            coverElement.src = albumNode.data.cover || 'assets/img/placeholder.png';
            coverElement.alt = `Portada ${albumNode.title}`;
            yearElement.textContent = albumNode.data.year ? `(${albumNode.data.year})` : '';
            // Pasar todos los datos del álbum para generar links
            linksElement.innerHTML = createListenLinks(albumNode.data);

            // Lista de Canciones del álbum
            let songsHtml = ''; // Inicializar vacío
            if (albumNode.children && albumNode.children.length > 0) {
                 songsHtml += '<ol class="mostrar-con-hover">'; // Abrir lista ordenada
                albumNode.children.forEach(songNode => {
                    const songOriginalId = songNode.data?.original_id || songNode.id;
                    const songDetailLink = `#musica/${albumOriginalId}/${songOriginalId}`;
                    const songTitle = songNode.title || 'Canción sin título';

                    // Crear título (enlace si hay letra/comentario, si no, solo texto)
                    const hasLyrics = songNode.data?.lyrics && songNode.data.lyrics.trim() !== '';
                    const hasCommentary = songNode.data?.commentary && songNode.data.commentary.trim() !== '';
                    let songTitleHtml = (hasLyrics || hasCommentary)
                        ? `<a href="${songDetailLink}" title="Ver letra y/o comentarios">${songTitle}</a>`
                        : `<span>${songTitle}</span>`;

                    songsHtml += `<li>${songTitleHtml}</li>`;
                });
                 songsHtml += '</ol>'; // Cerrar lista ordenada
            } else {
                songsHtml = '<p>No hay lista de canciones detallada para este álbum.</p>';
            }
            songListElement.innerHTML = songsHtml;

            // Descripción (Comentarios del álbum)
            descriptionElement.innerHTML = albumNode.data.description
                ? albumNode.data.description.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') // Mejor manejo de párrafos y saltos
                : '<p>No hay descripción disponible.</p>';
             // Envolver en <p> si no contiene etiquetas HTML ya
             if (!descriptionElement.innerHTML.startsWith('<p>') && !descriptionElement.innerHTML.startsWith('<div')) {
                descriptionElement.innerHTML = `<p>${descriptionElement.innerHTML}</p>`;
             }


        } else {
            console.warn(`Álbum con ID '${albumId}' no encontrado.`);
            appElement.innerHTML = `<h1>Álbum no encontrado</h1><p>El álbum solicitado ('${albumId}') no existe.</p><p><a href="#musica">Volver a Música</a></p>`;
        }
    } catch (error) {
        console.error(`Error cargando detalle del álbum ${albumId}:`, error);
         titleElement.textContent = 'Error';
         descriptionElement.innerHTML = '<p>Error al cargar los detalles del álbum.</p>';
         songListElement.innerHTML = '';
         linksElement.innerHTML = '';
    }
}


// --- Carga la página de detalle de una Canción (Sin cambios) ---
export async function loadSongDetailPageData(albumId, songId) {
    console.log(`Cargando detalle de la canción: ${songId} (Álbum: ${albumId})`);
     const appElement = document.getElementById('app');
     // ... (resto del código de loadSongDetailPageData sin cambios) ...
     // ... (asegúrate de que usa la función createListenLinks actualizada si es necesario) ...
     if (!appElement) {
        console.error("Contenedor #app no encontrado");
        return;
    }

    const titleElement = appElement.querySelector('#song-detail-title');
    const coverElement = appElement.querySelector('#song-detail-cover');
    const linksElement = appElement.querySelector('#song-detail-links');
    const lyricsElement = appElement.querySelector('#song-detail-lyrics');
    const commentaryElement = appElement.querySelector('#song-detail-commentary');
    const backLinkElement = appElement.querySelector('#song-detail-backlink');
    const backLinkBottomElement = appElement.querySelector('#song-detail-backlink-bottom');

     if (!titleElement || !coverElement || !linksElement || !lyricsElement || !commentaryElement || !backLinkElement || !backLinkBottomElement) {
         console.error("Error: Faltan elementos con IDs requeridos en song_detail.html");
         return;
    }

     titleElement.textContent = 'Cargando...';
     coverElement.alt = 'Cargando...';
     coverElement.src = 'assets/img/placeholder.png';
     linksElement.innerHTML = '';
     lyricsElement.innerHTML = '<h3>Letra</h3><p>Cargando...</p>';
     commentaryElement.innerHTML = '<h3>Comentarios</h3><p>Cargando...</p>';
     backLinkElement.href = '#musica'; // Link por defecto
     backLinkBottomElement.href = '#musica';

    try {
        const albumsData = await fetchAlbums();
        const albumNode = albumsData.find(node => (node.data?.original_id === albumId || node.id === albumId));

        if (albumNode && albumNode.children) {
             const albumOriginalId = albumNode.data?.original_id || albumNode.id; // ID del álbum para el link de vuelta
            const songNode = albumNode.children.find(node => (node.data?.original_id === songId || node.id === songId));

            if (songNode) {
                titleElement.textContent = songNode.title;
                coverElement.src = albumNode.data.cover || 'assets/img/placeholder.png';
                coverElement.alt = `Portada del álbum ${albumNode.title}`;
                 // Pasar todos los datos de la canción para generar links
                linksElement.innerHTML = createListenLinks(songNode.data);

                // Letra
                 if (songNode.data?.lyrics) {
                    lyricsElement.innerHTML = `<h3>Letra</h3><pre>${songNode.data.lyrics}</pre>`;
                 } else {
                     lyricsElement.innerHTML = '<h3>Letra</h3><p>Letra no disponible.</p>';
                 }

                // Comentarios
                if (songNode.data?.commentary) {
                    const commentaryHtml = songNode.data.commentary.includes('<')
                        ? songNode.data.commentary // Asume HTML
                        : songNode.data.commentary.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>'); // Maneja párrafos y saltos
                     commentaryElement.innerHTML = `<h3>Comentarios</h3><div class="commentary-content">${commentaryHtml}</div>`;
                     // Envolver en <p> si no es HTML complejo
                     if (!commentaryHtml.startsWith('<p>') && !commentaryHtml.startsWith('<div') && !commentaryHtml.includes('<br>')) {
                        commentaryElement.querySelector('.commentary-content').innerHTML = `<p>${commentaryHtml}</p>`;
                     }

                } else {
                    commentaryElement.innerHTML = '<h3>Comentarios</h3><p>No hay comentarios disponibles.</p>';
                }

                // Enlace para volver al álbum
                 const backLinkHref = `#musica/${albumOriginalId}`;
                 backLinkElement.href = backLinkHref;
                 backLinkElement.textContent = `Volver a ${albumNode.title}`;
                 backLinkBottomElement.href = backLinkHref;
                 backLinkBottomElement.textContent = `Volver a ${albumNode.title}`;


            } else {
                console.warn(`Canción con ID '${songId}' no encontrada en el álbum '${albumId}'.`);
                appElement.innerHTML = `<h1>Canción no encontrada</h1><p>La canción solicitada ('${songId}') no existe en este álbum.</p><p><a href="#musica/${albumOriginalId}">Volver al álbum ${albumNode.title}</a></p><p><a href="#musica">Volver a Música</a></p>`;
            }
        } else {
            console.warn(`Álbum con ID '${albumId}' no encontrado o sin canciones.`);
             appElement.innerHTML = `<h1>Álbum no encontrado</h1><p>El álbum solicitado ('${albumId}') no existe o no tiene canciones.</p><p><a href="#musica">Volver a Música</a></p>`;
        }
    } catch (error) {
        console.error(`Error cargando detalle de la canción ${songId}:`, error);
        titleElement.textContent = 'Error';
        lyricsElement.innerHTML = '<h3>Letra</h3><p>Error al cargar la letra.</p>';
        commentaryElement.innerHTML = '<h3>Comentarios</h3><p>Error al cargar los comentarios.</p>';
        linksElement.innerHTML = '';
    }
}