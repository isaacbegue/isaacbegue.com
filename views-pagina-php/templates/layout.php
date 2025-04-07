<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="author" content="Isaac Begué">
    <meta name="description" content="Página Web del proyecto musical de Isaac Begué">
    <meta name="keywords" content="isaac begue music">
    <link rel="stylesheet" href="app.css"> <!-- Cargar hoja de estilos -->
    <link rel="icon" href="/build/img/iconsNlogos/icon-isaacbegue.jpg"> <!-- Cargar hoja de estilos -->
    <script src="/build/js/app.js"></script>
    <title>Isaac Begué Música</title>
</head>
<body>
    <header>
        <div class="">
            <div class="logo-div">
                <a title="Ir a la página principal" href="/">
                    <img src="/build/img/iconsNlogos/logo-isaacbegue-white.png" alt="logo-isaacbegue">
                </a>
            </div>
            <span class="ocultar-en-mayor-768px" id="boton-menu-desplegable">
                <img src="/build/img/iconsNlogos/bars_solid.svg" alt="menu">
            </span>
        </div>
        <nav class="menu-desplegable" id="menu-desplegable">
            <ul>
                <li><a class="<?php echo $tabSelected == 'musica' ? 'tab-selected' : ''?>" href="/musica">Música</a></li>
                    <!-- <ul>
                        <li><a href="#"></a></li>
                    </ul> -->
                <li><a class="<?php echo $tabSelected == 'publicaciones' ? 'tab-selected' : ''?>" href="/publicaciones">Publicaciones</a></li>
                <li><a class="<?php echo $tabSelected == 'descargar' ? 'tab-selected' : ''?>" href="/descargar">Descargas</a></li>
            </ul>
        </nav>
    </header>
    <div class="under-header"></div>

    <?php echo $contenido_pagina; ?>

    <div class="under-footer"></div>
    <footer>
        <div class="footer-columns">
            <!-- <a href="/contacto"> Contactar </a> -->
            <div class="social-networks">
                <h6>Redes Sociales</h6>
                <div class="links-social-networks">
                    <a target="_blank" href="https://www.youtube.com/channel/UCv2g8KHAHQJTMRaCuut3r3Q"><img src="/build/img/iconsNlogos/youtube_brands.svg" alt="youtube"></a>
                    <a target="_blank" href="https://www.facebook.com/IsaacBegueMusic/"> <img src="/build/img/iconsNlogos/facebook_brands.svg" alt="facebook"></a>
                    <a target="_blank" href="https://soundcloud.com/isaacbegue"><img src="/build/img/iconsNlogos/soundcloud_brands.svg" alt="soundcloud"></a>
                    <a target="_blank" href="https://open.spotify.com/artist/2gTkLP3FFdcE2xM8NCnTPz"><img src="/build/img/iconsNlogos/spotify_brands.svg" alt="spotify"></a>
                    <a target="_blank" href="https://www.instagram.com/isaacbegue/"><img src="/build/img/iconsNlogos/instagram_brands.svg" alt="instagram"></a>
                </div>
            </div>
        </div>
        <!-- <p>Todos los derechos reservados <wbr/> Isaac Begué &#169 <?php /* echo date("Y"); */?></p> -->
    </footer>
</body>
</html>
