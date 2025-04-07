// js/modules/pages/publicacionesPage.js
import { fetchPosts } from '../dataAccess.js';

// --- Constantes ---
const INITIAL_POST_COUNT = 7; // Cuántos posts desplegables cargar inicialmente
const LOAD_MORE_COUNT = 5;    // Cuántos posts desplegables cargar cada vez con scroll
const OTROS_PROYECTOS_ID = 'node-1743726534022-nlvt5'; // ID del nodo "Otros proyectos"
const PENSAMIENTOS_DISPERSOS_ID = 'node-1743726647566-wq9nk'; // ID del nodo "Pensamientos dispersos"

// --- Variables Globales del Módulo ---
let allChildNodesData = []; // Guarda todos los datos de los hijos para scroll infinito
let renderedPostCount = 0;  // Contador de posts desplegables renderizados
let observer = null;        // Referencia al IntersectionObserver

// --- NUEVO: Función de limpieza EXPORTADA ---
// Esta función será llamada por el router antes de cargar una nueva página
export function cleanupPageObserver() {
    if (observer) {
        console.log("Cleaning up IntersectionObserver."); // Log para depuración
        observer.disconnect(); // Desconecta el observer para detener la escucha
        observer = null;       // Elimina la referencia al observer
    }
    // Resetea el estado asociado al observer aquí también por seguridad
    allChildNodesData = [];
    renderedPostCount = 0;
}
// --- FIN NUEVO ---

// --- Función para extraer ID de YouTube y generar URL de Embed ---
function getYouTubeEmbedUrl(url) {
    if (!url || typeof url !== 'string') return null;
    let videoId = null;
    try {
        // Expresión más robusta para varios formatos de URL
        const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regExp);
        if (match && match[1]) {
            videoId = match[1];
        } else if (url.includes('/embed/')) { // Extraer de URLs de embed directas
            const parts = url.split('/embed/');
            if (parts.length > 1) {
                videoId = parts[1].split(/[?&]/)[0]; // Tomar solo el ID antes de parámetros
                 // Validar longitud del ID extraído
                 if (videoId.length !== 11) videoId = null;
            }
        }
    } catch (e) {
        console.error("Error parsing YouTube URL:", url, e);
        return null;
    }

    if (videoId) {
        // Usar la URL estándar de embed nocookie para mayor privacidad
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    return null;
}


// --- Función Recursiva para Buscar Nodo por ID (Exportada) ---
export function findNodeByIdRecursive(nodes, targetId) {
    if (!nodes || !Array.isArray(nodes)) return null;
    for (const node of nodes) {
        // Comprueba ID del nodo y original_id si existe
        if (node.id === targetId || (node.data && node.data.original_id === targetId)) {
            return node;
        }
        // Busca recursivamente en los hijos
        const foundInChildren = findNodeByIdRecursive(node.children, targetId);
        if (foundInChildren) return foundInChildren;
    }
    return null;
}

// --- Función Auxiliar para Renderizar Media (YouTube/Audio) ---
function renderMediaFromData(dataObject, titlePrefix = '') {
    if (!dataObject) return '';
    let mediaHtml = '';
    let youtubeHtml = '';
    let audioHtml = '';

    for (const key in dataObject) {
        // Ignorar propiedades conocidas que no son media
        if (key === 'commentary' || key === 'original_id' || key === 'fecha' || key === 'icon_path') continue;

        const value = dataObject[key];
        let videoData = null;
        let audioData = null;

        // Detectar YouTube (URL o iframe)
        if (typeof value === 'string') {
            const embedUrl = getYouTubeEmbedUrl(value);
            if (embedUrl) {
                 videoData = { title: key, embedUrl: embedUrl };
            } else if (value.trim().startsWith('<iframe') && value.includes('youtube.com/embed')) {
                 // Extraer src del iframe para validarlo y usar nocookie
                 const srcMatch = value.match(/src="([^"]+)"/);
                 if (srcMatch && srcMatch[1]) {
                    const validatedEmbedUrl = getYouTubeEmbedUrl(srcMatch[1]);
                     if(validatedEmbedUrl){
                        // Reconstruir iframe con URL nocookie y atributos de accesibilidad/seguridad
                        videoData = {
                            title: key,
                            embedHtml: `<iframe width="560" height="315" src="${validatedEmbedUrl}" title="YouTube video player: ${key}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
                        };
                    } else {
                         console.warn(`Invalid YouTube src found in iframe for key "${key}": ${srcMatch[1]}`);
                    }
                 }
            }
            // Detectar Audio (por extensión .mp3)
            else if (value.endsWith('.mp3')) {
                 audioData = { title: key, audioUrl: value };
            }
        }

        // Generar HTML para Video
        if (videoData) {
            youtubeHtml += `<div class="iframe-container">`;
            youtubeHtml += `<p>${titlePrefix}${videoData.title}</p>`; // Título del video
            if (videoData.embedUrl) {
                 // Construir iframe con URL validada
                 youtubeHtml += `<iframe width="560" height="315" src="${videoData.embedUrl}" title="YouTube video player: ${videoData.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
            } else if (videoData.embedHtml) {
                 youtubeHtml += videoData.embedHtml; // Usar el iframe reconstruido
            }
            youtubeHtml += `</div>`;
        }
        // Generar HTML para Audio
        else if (audioData) {
             const fullAudioPath = audioData.audioUrl.startsWith('assets/') ? audioData.audioUrl : `assets/audio/${audioData.audioUrl}`;
             // Validar si la ruta parece correcta (simple check)
             if (fullAudioPath.startsWith('assets/audio/')) {
                 audioHtml += `<div class="audio-container">`;
                 audioHtml += `<p>${titlePrefix}${audioData.title}</p>`;
                 audioHtml += `<audio src="${fullAudioPath}" controls preload="metadata" type="audio/mpeg"></audio>`;
                 audioHtml += `</div>`;
             } else {
                 console.warn(`Ruta de audio potencialmente inválida (${audioData.title}): ${audioData.audioUrl}`);
             }
        }
    }

    // Agrupar videos y audios
    if (youtubeHtml) {
        mediaHtml += `<div class="youtube-group">${youtubeHtml}</div>`;
    }
    if (audioHtml) {
        if (youtubeHtml) mediaHtml += '<hr style="margin: 1rem 0; border-color: #444;">'; // Separador visual
        mediaHtml += `<div class="audio-group">${audioHtml}</div>`;
    }

    return mediaHtml;
}


// --- Función para generar el HTML de un lote de posts hijos (PARA DESPLEGABLES) ---
function renderChildPostsBatch(nodesToRender) {
    let batchHtml = '';
    nodesToRender.forEach(childNode => {
        const childTitle = childNode.title || 'Elemento sin título';
        const childDate = childNode.data?.fecha ? `<small>(${childNode.data.fecha})</small>` : '';
        const childNodeId = childNode.id || `child-${Math.random().toString(36).substring(2)}`;
        let deployableContent = '';
        let hasContentInside = false; // Flag para saber si hay algo que mostrar

        // 1. Renderizar Comentario del Hijo
        if (childNode.data?.commentary) {
            const contentHtml = childNode.data.commentary.includes('<')
                ? childNode.data.commentary
                : childNode.data.commentary.replace(/\n/g, '<br>');
            deployableContent += `<div class="child-commentary">${contentHtml}</div>`;
            hasContentInside = true;
        }

        // 2. Renderizar Media Directa del Hijo
        const childMediaHtml = renderMediaFromData(childNode.data);
        if (childMediaHtml) {
            if (hasContentInside) deployableContent += '<hr style="margin: 1rem 0; border-color: #444;">';
            deployableContent += childMediaHtml;
            hasContentInside = true;
        }

        // 3. Procesar Nietos (y buscar media en bisnietos si aplica)
        if (childNode.children && childNode.children.length > 0) {
             // Añadir separador visual si había contenido antes
            if (hasContentInside) deployableContent += '<hr style="margin: 1rem 0; border-color: #444;">';
            deployableContent += '<div class="grandchildren-section">';

            childNode.children.forEach(grandchildNode => {
                // Usar un estilo visual para separar/indentar cada nieto
                deployableContent += `<div class="grandchild-item" style="margin-left: 1em; border-left: 1px solid #555; padding-left: 1em; margin-top: 0.5em; padding-top: 0.5em;">`;
                // Título del nieto
                deployableContent += `<h5>${grandchildNode.title || 'Sub-elemento'}</h5>`;
                hasContentInside = true; // Si hay nietos, hay contenido

                // Comentario del Nieto
                if (grandchildNode.data?.commentary) {
                    const grandchildCommentaryHtml = grandchildNode.data.commentary.includes('<')
                         ? grandchildNode.data.commentary
                         : grandchildNode.data.commentary.replace(/\n/g, '<br>');
                    deployableContent += `<div class="grandchild-commentary">${grandchildCommentaryHtml}</div>`;
                }

                // Media del Nieto
                const grandchildMediaHtml = renderMediaFromData(grandchildNode.data);
                 if (grandchildMediaHtml) {
                    deployableContent += grandchildMediaHtml;
                }

                 // Media de los Bisnietos (Itera sobre los hijos del nieto)
                 if (grandchildNode.children && grandchildNode.children.length > 0) {
                     deployableContent += '<div class="great-grandchildren-media" style="margin-top: 0.5em;">';
                     grandchildNode.children.forEach(greatGrandchildNode => {
                         // Renderizar media del bisnieto, usando su título como prefijo
                         const greatGrandchildMediaHtml = renderMediaFromData(
                             greatGrandchildNode.data,
                             `${greatGrandchildNode.title || 'Item'} - ` // Añadir prefijo
                         );
                         if (greatGrandchildMediaHtml) {
                             deployableContent += greatGrandchildMediaHtml;
                         }
                     });
                     deployableContent += '</div>';
                 }
                deployableContent += `</div>`; // Cerrar grandchild-item
            });
            deployableContent += '</div>'; // Cerrar grandchildren-section
        }

        // 4. Determinar si es Desplegable (si tiene algo dentro)
        const isDeployable = hasContentInside;

        // 5. Renderizar HTML Final del Hijo
        if (isDeployable) {
             batchHtml += `
                <div class="deployable-section">
                    <h4 class="deployable-title" data-target="${childNodeId}">
                        ${childTitle} ${childDate}
                        <span class="deploy-icon">▼</span>
                    </h4>
                    <div id="${childNodeId}" class="deployable-content" style="display: none;">
                         ${deployableContent}
                    </div>
                </div>
             `;
        } else {
             // Si no hay NADA dentro, solo mostrar el título (sin icono ni capacidad de despliegue)
             batchHtml += `<div class="deployable-section"><h4 class="deployable-title no-deploy">${childTitle} ${childDate}</h4></div>`;
        }
    });
    return batchHtml;
}

// --- Función para generar el HTML de la lista de "Otros Proyectos" ---
function renderOtrosProyectosList(childNodes) {
    let listHtml = '<div class="otros-proyectos-list">'; // Contenedor específico
    if (!childNodes || childNodes.length === 0) {
        listHtml += '<p>No hay subproyectos listados.</p>';
    } else {
        childNodes.forEach(childNode => {
            const childTitle = childNode.title || 'Proyecto sin título';
            // Usa original_id si existe, si no, el ID del nodo para el enlace
            const childId = childNode.data?.original_id || childNode.id;
            const childLink = `#publicaciones/${childId}`; // Enlace al detalle del subproyecto

            // Estructura similar al PHP original
            listHtml += `
                <div class="proyecto-alterno">
                    <a href="${childLink}">
                        <h3>${childTitle}</h3>
                    </a>
                    <hr>
                </div>
            `;
        });
    }
    listHtml += '</div>';
    return listHtml;
}

// --- Función para añadir listeners a los desplegables ---
function addDeployableListeners(parentElement) {
    // Usar delegación de eventos en el contenedor padre
    parentElement.addEventListener('click', function(event) {
        // Buscar si el clic fue en un título desplegable (que no tenga la clase 'no-deploy')
        const titleElement = event.target.closest('.deployable-title:not(.no-deploy)');

        if (titleElement) {
            const targetId = titleElement.dataset.target;
             // Buscar el contenido DENTRO del contenedor padre específico
            const contentElement = parentElement.querySelector(`#${targetId}`);
            const iconElement = titleElement.querySelector('.deploy-icon');

            if (contentElement) {
                // Alternar visibilidad
                const isVisible = contentElement.style.display === 'block';
                contentElement.style.display = isVisible ? 'none' : 'block';

                // Alternar icono
                if (iconElement) {
                    iconElement.textContent = isVisible ? '▼' : '▲';
                }

                // Alternar clase activa en el título (para CSS opcional)
                titleElement.classList.toggle('active', !isVisible);
            }
        }
    });
}

// --- Configura el Intersection Observer ---
function setupIntersectionObserver(contentElement) {
    const loadMoreTrigger = contentElement.querySelector('#load-more-trigger');
    if (!loadMoreTrigger) {
        console.warn("Trigger #load-more-trigger no encontrado para configurar observer.");
        return; // Salir si no hay trigger
    }

    // Seguridad: Si por alguna razón ya existe un observer, desconectarlo antes de crear uno nuevo.
    if (observer) {
        console.warn("Intentando configurar observer cuando uno ya existe. Desconectando el anterior.");
        observer.disconnect();
        observer = null;
    }

    const options = {
        root: null, // Observa intersecciones relativas al viewport
        rootMargin: '0px',
        threshold: 0.1 // Trigger cuando al menos 10% del elemento sea visible
    };

    // Callback que se ejecuta cuando el trigger entra/sale de la vista
    const callback = (entries) => {
        entries.forEach(entry => {
            // Si el trigger está visible y aún quedan posts por cargar
            if (entry.isIntersecting && renderedPostCount < allChildNodesData.length) {
                console.log("Cargando más posts (scroll)...");
                loadMoreTrigger.textContent = "Cargando..."; // Feedback visual

                // Calcular el siguiente lote de datos
                const startIndex = renderedPostCount;
                const endIndex = Math.min(startIndex + LOAD_MORE_COUNT, allChildNodesData.length);
                const nextBatchData = allChildNodesData.slice(startIndex, endIndex);

                // Generar HTML para el nuevo lote
                const nextBatchHtml = renderChildPostsBatch(nextBatchData); // Usa la función actualizada

                // Insertar el nuevo HTML ANTES del trigger
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = nextBatchHtml;
                while(tempContainer.firstChild) {
                     contentElement.insertBefore(tempContainer.firstChild, loadMoreTrigger);
                }

                // Actualizar contador de posts renderizados
                renderedPostCount = endIndex;

                // Comprobar si se han cargado todos los posts
                if (renderedPostCount >= allChildNodesData.length) {
                    console.log("Todos los posts cargados.");
                    loadMoreTrigger.textContent = "Fin."; // Ocultar o cambiar texto
                    if (observer) observer.unobserve(loadMoreTrigger); // Dejar de observar este trigger
                } else {
                     loadMoreTrigger.textContent = ""; // Limpiar texto "Cargando..."
                }
            }
        });
    };

     // Crear y asignar el NUEVO observer a la variable del módulo
     observer = new IntersectionObserver(callback, options);
     console.log("New IntersectionObserver created and assigned.");

     // Empezar a observar el elemento trigger
     observer.observe(loadMoreTrigger);
     console.log("Observing #load-more-trigger");
}

// --- Carga la página PRINCIPAL de Publicaciones ---
export async function loadPublicacionesPageData() {
    // La limpieza del observer y estado la hace el router ANTES de llamar esta función
    console.log("Cargando datos para la página de Publicaciones...");
    const sectionListContainer = document.getElementById('publication-section-list');
    if (!sectionListContainer) {
        console.error("Error: Contenedor #publication-section-list no encontrado.");
        return;
    }
    sectionListContainer.innerHTML = '<li>Cargando secciones...</li>';

    try {
        const postsData = await fetchPosts();
        let sectionsHtml = '';
        if (postsData && postsData.length > 0) {
            postsData.forEach(postNode => {
                const sectionId = postNode.data?.original_id || postNode.id;
                const sectionTitle = postNode.title;
                const sectionIcon = postNode.data?.icon_path || `assets/img/logos/feather-alt-solid.svg`; // Icono por defecto

                sectionsHtml += `
                  <li>
                    <a href="#publicaciones/${sectionId}" title="Ir a la sección ${sectionTitle}">
                      <img src="${sectionIcon}" alt="icono ${sectionTitle}">
                      <figcaption>${sectionTitle}</figcaption>
                    </a>
                  </li>
                `;
            });
        } else {
            sectionsHtml = '<li>No hay secciones de publicaciones disponibles.</li>';
        }
        sectionListContainer.innerHTML = sectionsHtml;
    } catch (error) {
        console.error("Error cargando lista de secciones:", error);
        sectionListContainer.innerHTML = '<li>Error al cargar las secciones.</li>';
    }
}

// --- Carga la página de DETALLE de una Publicación/Sección ---
export async function loadPostDetailPageData(postId) {
    // La limpieza del observer y estado la hace el router ANTES de llamar esta función
    console.log(`Cargando detalle de la publicación/sección: ${postId}`);
    const appElement = document.getElementById('app');

    // Reiniciar estado local para esta carga específica (aunque cleanup ya lo hizo globalmente)
    allChildNodesData = [];
    renderedPostCount = 0;
    // NO limpiar 'observer' aquí, la limpieza es global en el router

    if (!appElement) { console.error("Contenedor #app no encontrado"); return; }

    // Obtener elementos del DOM donde se mostrará el contenido
    const titleElement = appElement.querySelector('#post-detail-title');
    const contentElement = appElement.querySelector('#post-detail-content');
    const backLinkElement = appElement.querySelector('#post-detail-backlink');
    const backLinkBottomElement = appElement.querySelector('#post-detail-backlink-bottom'); // Enlace inferior

    // Verificar que todos los elementos necesarios existen
    if (!titleElement || !contentElement || !backLinkElement || !backLinkBottomElement) {
        console.error("Error: Faltan elementos con IDs requeridos en post_detail.html"); return;
    }

    // Estado de carga inicial
    titleElement.textContent = 'Cargando...';
    contentElement.innerHTML = '<p class="centrado" style="padding: 30px 0;">Cargando contenido...</p>';
    backLinkElement.href = '#publicaciones';
    backLinkBottomElement.href = '#publicaciones';

    try {
        // Obtener todos los datos de publicaciones
        const postsData = await fetchPosts();
        // Encontrar el nodo específico para esta página usando el ID (o original_id)
        const postNode = findNodeByIdRecursive(postsData, postId);

        if (postNode) {
            // Establecer el título de la página
            titleElement.textContent = postNode.title;

            // Ajustar el enlace "Volver" para subproyectos
            let parentNode = null;
            const otrosProyectosNode = findNodeByIdRecursive(postsData, OTROS_PROYECTOS_ID);
             // Comprobar si el nodo actual es hijo de "Otros Proyectos"
             if (otrosProyectosNode?.children?.some(child => child.id === postNode.id || child.data?.original_id === postId)) {
                 parentNode = otrosProyectosNode;
             }
            if (parentNode) { // Si es subproyecto, enlaza a "Otros Proyectos"
                 backLinkElement.href = `#publicaciones/${parentNode.data?.original_id || parentNode.id}`;
                 backLinkElement.textContent = `Volver a ${parentNode.title}`;
            } else { // Si es sección principal, enlaza a la lista general
                 backLinkElement.href = '#publicaciones';
                 backLinkElement.textContent = 'Volver a Publicaciones';
            }
             // Sincronizar enlace inferior
             backLinkBottomElement.href = backLinkElement.href;
             backLinkBottomElement.textContent = backLinkElement.textContent;

            // Construir el HTML del contenido
            let finalHtml = '';

            // 1. Renderizar Contenido Principal (commentary del nodo actual)
            if (postNode.data?.commentary) {
                 // Asegurarse que el HTML del comentario se interprete correctamente
                 const mainCommentaryHtml = postNode.data.commentary.includes('<')
                     ? postNode.data.commentary
                     : `<p>${postNode.data.commentary.replace(/\n/g, '<br>')}</p>`; // Envolver en <p> si no es HTML
                finalHtml += `<div class="main-post-content">${mainCommentaryHtml}</div>`;
            }

            // 2. Renderizar Media Directa del nodo principal
            const mainMediaHtml = renderMediaFromData(postNode.data);
            if (mainMediaHtml) {
                 // Añadir separador si ya había comentario
                 if (finalHtml.length > 0 && postNode.data?.commentary) finalHtml += '<hr style="margin: 1.5rem 0;">';
                finalHtml += mainMediaHtml;
            }

            // 3. Lógica condicional para renderizar hijos
            //--------------------------------------------------
            if (postNode.children && postNode.children.length > 0) {
                // Añadir separador antes de la lista/desplegables si había contenido antes
                if (finalHtml.length > 0) {
                    finalHtml += '<hr style="margin: 1.5rem 0;">';
                }

                // Caso 1: "Otros Proyectos" - Renderizar como lista de enlaces
                if (postNode.id === OTROS_PROYECTOS_ID) {
                    console.log("Renderizando 'Otros Proyectos' como lista.");
                    finalHtml += renderOtrosProyectosList(postNode.children);
                    // No se necesita configurar observer ni listeners para la lista
                }
                // Caso 2: "Pensamientos Dispersos" o Comportamiento por Defecto (Desplegables)
                else {
                     if (postNode.id === PENSAMIENTOS_DISPERSOS_ID) {
                         console.log("Renderizando 'Pensamientos Dispersos' con desplegables.");
                     } else {
                         console.log(`Renderizando sección '${postNode.title}' con desplegables (defecto).`);
                     }

                     // Guardar datos de hijos para scroll infinito
                     allChildNodesData = postNode.children;
                     // Renderizar el lote inicial de desplegables
                     const initialBatch = allChildNodesData.slice(0, INITIAL_POST_COUNT);
                     finalHtml += renderChildPostsBatch(initialBatch);
                     renderedPostCount = initialBatch.length;

                    // Añadir trigger para cargar más si es necesario
                    if (renderedPostCount < allChildNodesData.length) {
                         finalHtml += '<div id="load-more-trigger" style="height: 50px; margin-top: 20px; text-align: center; color: #555;"></div>';
                    }
                }
            } else if (finalHtml.length === 0) {
                 // Mensaje si no hay NADA que mostrar (ni comentario, ni media, ni hijos)
                 finalHtml = '<p><em>Esta sección no tiene contenido detallado para mostrar.</em></p>';
            }
            //--------------------------------------------------

            // Actualizar el DOM con el HTML generado
            contentElement.innerHTML = finalHtml;

            // Añadir Listeners y configurar Observer DESPUÉS de actualizar DOM
            // SOLO si se renderizaron desplegables (no para la lista de Otros Proyectos)
             if (postNode.id !== OTROS_PROYECTOS_ID && postNode.children && postNode.children.length > 0) {
                 addDeployableListeners(contentElement); // Añade listeners para clics en títulos desplegables

                 // Configurar observer si se añadió el trigger
                 if (renderedPostCount < allChildNodesData.length) {
                     // Esperar un breve instante para asegurar que el trigger está renderizado
                     setTimeout(() => {
                        const trigger = contentElement.querySelector('#load-more-trigger');
                        if (trigger && !observer) { // Configurar solo si el trigger existe Y no hay un observer ya
                            setupIntersectionObserver(contentElement);
                        } else if (!trigger) {
                            console.warn("El trigger #load-more-trigger no se encontró después del renderizado para el observer.");
                        }
                     }, 50); // 50ms de delay, ajustar si es necesario
                 }
             }

        } else {
            // Manejo si el post/sección no se encuentra
            console.warn(`Publicación/sección con ID '${postId}' no encontrada.`);
            titleElement.textContent = 'No encontrado';
            contentElement.innerHTML = `<p>La publicación o sección solicitada ('${postId}') no existe.</p>`;
        }
    } catch (error) {
         // Manejo de errores durante la carga
         console.error(`Error cargando detalle de la publicación ${postId}:`, error);
         titleElement.textContent = 'Error';
         contentElement.innerHTML = '<p>Error al cargar el contenido.</p>';
    }
}