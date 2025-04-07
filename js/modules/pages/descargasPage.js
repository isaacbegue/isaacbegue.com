// js/modules/pages/descargasPage.js
import { fetchSiteInfo } from '../dataAccess.js';

// --- Carga la página de Descargas ---
export async function loadDescargasPageData() {
    console.log("Cargando datos para la página de Descargas...");
    const downloadListContainer = document.getElementById('download-list'); // Asegúrate de tener este ID en descargas.html

    if (!downloadListContainer) {
        console.error("Error: Contenedor #download-list no encontrado en descargas.html");
        return;
    }

    downloadListContainer.innerHTML = '<li>Cargando descargas...</li>';

    try {
        const siteData = await fetchSiteInfo(); // site_info.json contiene los enlaces de descarga
        // Busca el nodo contenedor de descargas por su ID
        const downloadsContainerNode = siteData.find(node => node.id === 'node-download-links-container');

        let downloadsHtml = '';
        if (downloadsContainerNode && downloadsContainerNode.children && downloadsContainerNode.children.length > 0) {
            downloadsContainerNode.children.forEach(linkNode => {
                const title = linkNode.title;
                const url = linkNode.data.file_url || '#'; // Usa '#' si no hay URL
                // Extrae el nombre del archivo para el atributo 'download'
                 const filename = url.substring(url.lastIndexOf('/') + 1);

                downloadsHtml += `
                  <li>
                    <a target="_blank" href="${url}" title="Descargar ${title}" download="${filename}">
                      ${title}
                    </a>
                  </li>
                `;
            });
        } else {
            console.warn("Nodo contenedor de descargas no encontrado o vacío en site_info.json.");
            downloadsHtml = '<li>No hay descargas disponibles por el momento.</li>';
        }

        downloadListContainer.innerHTML = downloadsHtml;

    } catch (error) {
        console.error("Error cargando lista de descargas:", error);
        downloadListContainer.innerHTML = '<li>Error al cargar las descargas.</li>';
    }
}