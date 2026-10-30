@echo off
chcp 65001 > nul
title Estudio de Yoga - Gestion de Paquetes SDD

echo ==========================================================
echo   Estudio de Yoga — Andrea (Gestion de Paquetes SDD)
echo ==========================================================
echo.

if not exist node_modules (
    echo Instalando dependencias con pnpm...
    call pnpm install
)

echo Iniciando servidor en http://localhost:3000 ...
echo Presiona Ctrl + C para detener el servidor.
echo.

call pnpm dev
pause
