# Cetak SHA-1 sertifikat APK (untuk Google Cloud Console → OAuth Android client)
param(
    [string]$ApkPath = "android\app\build\outputs\apk\release\app-release.apk"
)

$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path $ApkPath)) {
    $ApkPath = Join-Path $projectRoot "android\app\build\outputs\apk\release\app-release.apk"
}

if (-not (Test-Path $ApkPath)) {
    Write-Host "APK tidak ditemukan. Jalankan dulu: npm run android:release" -ForegroundColor Red
    exit 1
}

Write-Host "APK: $ApkPath" -ForegroundColor Cyan
Write-Host ""
keytool -printcert -jarfile $ApkPath 2>&1 | Select-String "Owner|SHA1|SHA256"
Write-Host ""
Write-Host "Google Cloud Console → Credentials → Create OAuth Android client:" -ForegroundColor Yellow
Write-Host "  Package name: com.faithfulpath.alquran"
Write-Host "  SHA-1: (salin dari baris SHA1 di atas)"
