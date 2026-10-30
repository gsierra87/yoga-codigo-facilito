# Script de inicio para el sistema del Estudio de Yoga (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Estudio de Yoga — Andrea (Gestión de Paquetes SDD)     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Comprobar si node_modules existe; si no, instalar dependencias
if (-not (Test-Path "node_modules")) {
    Write-Host "`nInstalando dependencias con pnpm..." -ForegroundColor Yellow
    pnpm install
}

Write-Host "`nIniciando servidor local en http://localhost:3000 ..." -ForegroundColor Green
Write-Host "Presiona Ctrl + C para detener el servidor.`n" -ForegroundColor Gray

pnpm dev
