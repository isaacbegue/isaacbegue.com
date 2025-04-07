// js/modules/templates.js
export async function loadTemplate(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', url, error);
      return '';
    }
  }
  
  export async function injectHeaderFooter() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    let headerInjected = false;
    if (headerPlaceholder) {
      // Ahora la ruta apunta a views/templates/header.html
      const headerHtml = await loadTemplate('views/templates/header.html');
      if (headerHtml) {
        headerPlaceholder.innerHTML = headerHtml;
        setupMenuToggle();
        headerInjected = true;
      } else {
        console.error("Header template failed to load or was empty.");
      }
    } else {
      console.error("Header placeholder not found in index.html.");
    }
    if (footerPlaceholder) {
      // Ruta actualizada para footer
      const footerHtml = await loadTemplate('views/templates/footer.html');
      if (footerHtml) {
        footerPlaceholder.innerHTML = footerHtml;
        await injectSocialLinks();
        injectFooterYear();
      } else {
        console.error("Footer template failed to load or was empty.");
      }
    } else {
      console.error("Footer placeholder not found in index.html.");
    }
    if (!headerInjected) {
      console.warn("Header was not dynamically injected, attempting to setup menu toggle anyway.");
      setupMenuToggle();
    }
  }
  
  export async function injectSocialLinks() {
    const socialContainer = document.getElementById('social-links-container');
    if (!socialContainer) {
      console.warn("Element with ID 'social-links-container' not found in footer template.");
      return;
    }
    try {
      const response = await fetch('data/site_info.json');
      if (!response.ok) throw new Error(`Failed to fetch site_info.json (status: ${response.status})`);
      const siteData = await response.json();
      const socialContainerNode = siteData.find(node => node.id === 'node-social-links-container');
      if (socialContainerNode && socialContainerNode.children && socialContainerNode.children.length > 0) {
        let linksHtml = '';
        socialContainerNode.children.forEach(linkNode => {
          const linkUrl = linkNode.data.url || '#';
          const linkName = linkNode.data.name || linkNode.title || 'Social Link';
          const linkIcon = linkNode.data.icon || '';
          if (linkIcon) {
            linksHtml += `<a target="_blank" rel="noopener noreferrer" href="${linkUrl}" title="${linkName}">
                            <img src="${linkIcon}" alt="${linkName}">
                          </a> `;
          } else {
            console.warn(`Skipping social link "${linkName}" because icon is missing.`);
          }
        });
        socialContainer.innerHTML = linksHtml;
      } else {
        console.warn("Social links container node not found or empty in site_info.json.");
        socialContainer.innerHTML = '';
      }
    } catch (error) {
      console.error("Error injecting social links:", error);
      socialContainer.innerHTML = 'No se cargaron los enlaces sociales';
    }
  }
  
  export function injectFooterYear() {
    const yearSpan = document.getElementById('footer-year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    } else {
      console.warn("Element with ID 'footer-year' not found in footer template.");
    }
  }
  
  export function setupMenuToggle() {
    const botonMenu = document.getElementById('boton-menu-desplegable');
    const menuDesplegable = document.getElementById('menu-desplegable');
    if (botonMenu && menuDesplegable) {
      botonMenu.addEventListener('click', () => {
        menuDesplegable.classList.toggle('mostrar-menu');
      });
      const navLinks = menuDesplegable.querySelectorAll('a');
      navLinks.forEach(link => {
        if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
          link.addEventListener('click', () => {
            menuDesplegable.classList.remove('mostrar-menu');
          });
        }
      });
    } else {
      if (!botonMenu) console.warn("Botón de menú con ID 'boton-menu-desplegable' no encontrado.");
      if (!menuDesplegable) console.warn("Contenedor de menú con ID 'menu-desplegable' no encontrado.");
    }
  }
  