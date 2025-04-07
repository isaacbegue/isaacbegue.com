@echo off
REM Script para iniciar el servidor local de Python y abrir el navegador

REM Define el puerto a utilizar (puedes cambiarlo si el 8000 está ocupado)
set PORT=8000

REM Define la URL base
set URL=http://localhost:%PORT%/

REM Cambia el título de la ventana de la consola
title Servidor Local IsaacBegue.com (Puerto %PORT%)

echo Iniciando servidor Python en el puerto %PORT%...
echo Puedes detener el servidor presionando Ctrl+C en esta ventana.
echo.

REM Inicia el servidor HTTP simple de Python 3 en segundo plano
REM El comando 'start "Servidor Python" /B ...' intenta iniciarlo sin bloquear la consola del batch
REM Si 'start /B' no funciona bien o prefieres ver los logs del servidor directamente,
REM puedes quitar 'start "Servidor Python" /B' y ejecutarlo directamente.
REM python -m http.server %PORT%

start "Servidor Python" /B python -m http.server %PORT%

REM Pequeña pausa para dar tiempo a que el servidor inicie (ajustar si es necesario)
timeout /t 2 /nobreak > nul

echo Abriendo %URL% en tu navegador predeterminado...

REM Abre la URL en el navegador predeterminado
start "" "%URL%"

echo.
echo El servidor se está ejecutando en segundo plano.
echo Cierra esta ventana o presiona Ctrl+C en la ventana del servidor (si se abrió por separado) para detenerlo.

REM Mantiene la ventana del batch abierta para mostrar los mensajes (opcional)
REM pause