# Talaqee — dev lokal: API PHP (8090) + Vite (5173)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:root
    npm run api:php 2>&1
}

Start-Sleep -Seconds 1
Write-Host "API PHP: http://127.0.0.1:8090" -ForegroundColor Green
Write-Host "Vite:    http://localhost:5173" -ForegroundColor Green
Write-Host "Tekan Ctrl+C untuk stop (API job akan dihentikan)." -ForegroundColor Yellow

try {
    npm run dev
} finally {
    Stop-Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob -Force -ErrorAction SilentlyContinue
}
