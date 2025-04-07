// js/modules/pages/notFoundPage.js

// Esta función es llamada por el router cuando no se encuentra una ruta
// o cuando se carga explícitamente la plantilla 404.
export async function loadNotFoundPageData() {
    console.log("Cargando página 404...");
    // La plantilla 404.html generalmente es estática,
    // así que esta función podría no necesitar hacer mucho.
    // Podrías usarla para logging adicional o tareas menores.

    // Ejemplo: Añadir un título dinámico si el elemento existe en 404.html
    const titleElement = document.getElementById('not-found-title'); // Necesitarías <h1 id="not-found-title"> en 404.html
    if (titleElement) {
        // titleElement.textContent = "Página No Encontrada (404)";
    } else {
        // El H1 ya está en el template 404.html, así que no es estrictamente necesario.
    }
}