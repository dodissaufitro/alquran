# Cetak SHA-1 sertifikat APK (untuk Google Cloud Console → OAuth Android client)
param(
    [ValidateSet('release', 'debug', 'both')]
    [string]$Variant = 'both'
)

$projectRoot = Split-Path $PSScriptRoot -Parent
$releaseApk = Join-Path $projectRoot "android\app\build\outputs\apk\release\app-release.apk"
$debugApk = Join-Path $projectRoot "android\app\build\outputs\apk\debug\app-debug.apk"

function Show-Sha1([string]$label, [string]$path) {
    if (-not (Test-Path $path)) {
        Write-Host "[$label] APK tidak ada: $path" -ForegroundColor Yellow
        Write-Host "  Build: npm run android:build (debug) atau npm run android:release" -ForegroundColor Gray
        return
    }
    Write-Host "=== $label ===" -ForegroundColor Cyan
    Write-Host "APK: $path" -ForegroundColor Gray
    keytool -printcert -jarfile $path 2>&1 | Select-String "Owner|SHA1|SHA256"
    Write-Host ""
}

Write-Host "Google Cloud Console -> Credentials -> OAuth Android client" -ForegroundColor Yellow
Write-Host "  Package name: com.talaqee.myapp" -ForegroundColor White
Write-Host "  Daftarkan SHA-1 debug DAN release jika tes keduanya." -ForegroundColor White
Write-Host ""

if ($Variant -eq 'release' -or $Variant -eq 'both') {
    Show-Sha1 "Release APK" $releaseApk
}
if ($Variant -eq 'debug' -or $Variant -eq 'both') {
    Show-Sha1 "Debug APK" $debugApk
}
