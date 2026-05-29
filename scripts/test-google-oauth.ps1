# Cek kesiapan OAuth Google sebelum build release APK
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

Write-Host "=== Tes OAuth Google (pre-release) ===" -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $root ".env.production"
if (-not (Test-Path $envFile)) {
    Write-Host "[FAIL] .env.production tidak ditemukan" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envFile -Raw
$clientId = if ($envContent -match 'VITE_GOOGLE_CLIENT_ID=(.+)') { $Matches[1].Trim() } else { "" }
$redirectUri = if ($envContent -match 'VITE_GOOGLE_OAUTH_REDIRECT_URI=(.+)') { $Matches[1].Trim() } else { "" }

if ($clientId -match 'apps\.googleusercontent\.com') {
    Write-Host "[OK] VITE_GOOGLE_CLIENT_ID: $clientId" -ForegroundColor Green
} else {
    Write-Host "[FAIL] VITE_GOOGLE_CLIENT_ID tidak valid" -ForegroundColor Red
    exit 1
}

if ($redirectUri -match '^https://') {
    Write-Host "[OK] Redirect URI: $redirectUri" -ForegroundColor Green
} else {
    Write-Host "[FAIL] VITE_GOOGLE_OAUTH_REDIRECT_URI tidak valid" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Cek API google-token.php ..." -ForegroundColor Yellow
try {
    $tokenResp = Invoke-RestMethod -Uri "https://app.talaqee.com/api/auth/google-token.php" -TimeoutSec 20
    if ($tokenResp.ok -eq $true) {
        $idOk = $tokenResp.config.googleClientId
        $secretOk = $tokenResp.config.googleClientSecret
        if ($idOk -and $secretOk) {
            Write-Host "[OK] google-token.php aktif, GOOGLE_CLIENT_ID + SECRET terkonfigurasi" -ForegroundColor Green
        } elseif ($idOk) {
            Write-Host "[WARN] google-token.php aktif, tapi GOOGLE_CLIENT_SECRET belum diset" -ForegroundColor Yellow
        } else {
            Write-Host "[FAIL] GOOGLE_CLIENT_ID belum diset di server" -ForegroundColor Red
        }
    } else {
        Write-Host "[FAIL] google-token.php respons tidak OK" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Tidak bisa hubungi google-token.php: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Cek API google-app-callback.php ..." -ForegroundColor Yellow
try {
    $cbResp = Invoke-WebRequest -Uri "https://app.talaqee.com/api/auth/google-app-callback.php" -TimeoutSec 20 -UseBasicParsing
    if ($cbResp.StatusCode -eq 200 -and $cbResp.Content -match 'OAuth callback aktif') {
        Write-Host "[OK] google-app-callback.php aktif" -ForegroundColor Green
    } else {
        Write-Host "[WARN] google-app-callback.php merespons tapi konten tidak dikenali" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[FAIL] Tidak bisa hubungi google-app-callback.php: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Cek bridge deep link ..." -ForegroundColor Yellow
try {
    $bridgeResp = Invoke-WebRequest -Uri "https://app.talaqee.com/api/auth/google-app-callback.php?code=test-bridge" -TimeoutSec 20 -UseBasicParsing
    if ($bridgeResp.Content -match 'com\.faithfulpath\.alquran://oauth\?code=test-bridge') {
        Write-Host "[OK] Bridge redirect ke deep link app benar" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Bridge tidak mengarah ke deep link app" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Bridge test gagal: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Cek client ID di build dist ..." -ForegroundColor Yellow
$mainJs = Get-ChildItem (Join-Path $root "dist\assets\main-*.js") -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $mainJs) {
    Write-Host "[WARN] dist/assets/main-*.js belum ada. Jalankan npm run build" -ForegroundColor Yellow
} else {
    $bundle = Get-Content $mainJs.FullName -Raw
    if ($bundle.Contains($clientId)) {
        Write-Host "[OK] Client ID ada di bundle JS ($($mainJs.Name))" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Client ID TIDAK ada di bundle. Jalankan npm run build dulu" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Selesai ===" -ForegroundColor Cyan
Write-Host "Langkah manual: install debug APK, buka Profil, tap Sign in with Google." -ForegroundColor White
