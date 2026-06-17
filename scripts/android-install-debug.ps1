# Install debug APK ke HP (retry otomatis, untuk Xiaomi USB install)
param(
    [string]$ApkPath = "android\app\build\outputs\apk\debug\app-debug.apk",
    [int]$MaxAttempts = 8
)

$root = Split-Path $PSScriptRoot -Parent
$fullApk = Join-Path $root $ApkPath

if (-not (Test-Path $fullApk)) {
    Write-Host "APK tidak ditemukan. Jalankan: npm run android:build" -ForegroundColor Red
    exit 1
}

Write-Host "Install: $fullApk" -ForegroundColor Cyan
Write-Host "Xiaomi: aktifkan Pengaturan > Opsi pengembang > Install via USB, lalu tap Izinkan di HP." -ForegroundColor Yellow
Write-Host ""

for ($i = 1; $i -le $MaxAttempts; $i++) {
    Write-Host "Percobaan $i/$MaxAttempts ..." -ForegroundColor Gray
    $out = adb install -r $fullApk 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -or $out -match 'Success') {
        Write-Host "[OK] APK ter-install." -ForegroundColor Green
        adb shell monkey -p com.talaqee.myapp -c android.intent.category.LAUNCHER 1 | Out-Null
        exit 0
    }
    if ($out -match 'INSTALL_FAILED_USER_RESTRICTED') {
        Write-Host "  Menunggu persetujuan Install via USB di HP (15 detik)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        continue
    }
    Write-Host $out -ForegroundColor Red
    exit 1
}

Write-Host "[FAIL] Install dibatalkan HP. Aktifkan Install via USB lalu jalankan ulang." -ForegroundColor Red
exit 1
