# Generate Android icons, splash screens, and web favicon from public/images/logo_app.talaqee.png
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root "public\images\logo_app.talaqee.png"
if (-not (Test-Path $src)) {
    Write-Host "Logo tidak ditemukan: $src" -ForegroundColor Red
    exit 1
}

$bg = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

function New-SquareBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($bg)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    return @{ Bitmap = $bmp; Graphics = $g }
}

function Draw-CenteredLogo($graphics, $source, [int]$canvasSize, [double]$paddingRatio) {
    $pad = [int]($canvasSize * $paddingRatio)
    $max = $canvasSize - (2 * $pad)
    $scale = [Math]::Min($max / $source.Width, $max / $source.Height)
    $w = [int]($source.Width * $scale)
    $h = [int]($source.Height * $scale)
    $x = [int](($canvasSize - $w) / 2)
    $y = [int](($canvasSize - $h) / 2)
    $graphics.DrawImage($source, $x, $y, $w, $h)
}

function Save-Png($bitmap, [string]$path) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-SplashBitmap([int]$width, [int]$height, $source) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($bg)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $pad = [Math]::Min($width, $height) * 0.12
    $maxW = $width - (2 * $pad)
    $maxH = $height - (2 * $pad)
    $scale = [Math]::Min($maxW / $source.Width, $maxH / $source.Height)
    $w = [int]($source.Width * $scale)
    $h = [int]($source.Height * $scale)
    $x = [int](($width - $w) / 2)
    $y = [int](($height - $h) / 2)
    $g.DrawImage($source, $x, $y, $w, $h)
    return $bmp
}

Write-Host "Source: $src" -ForegroundColor Cyan
$original = [System.Drawing.Image]::FromFile($src)

$iconSizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}
$fgSizes = @{
    "mipmap-mdpi"    = 108
    "mipmap-hdpi"    = 162
    "mipmap-xhdpi"   = 216
    "mipmap-xxhdpi"  = 324
    "mipmap-xxxhdpi" = 432
}

$resRoot = Join-Path $root "android\app\src\main\res"
foreach ($folder in $iconSizes.Keys) {
    $size = $iconSizes[$folder]
    $sq = New-SquareBitmap $size
    Draw-CenteredLogo $sq.Graphics $original $size 0.10
    $dir = Join-Path $resRoot $folder
    Save-Png $sq.Bitmap (Join-Path $dir "ic_launcher.png")
    Save-Png $sq.Bitmap (Join-Path $dir "ic_launcher_round.png")
    $sq.Graphics.Dispose(); $sq.Bitmap.Dispose()

    $fgSize = $fgSizes[$folder]
    $fg = New-SquareBitmap $fgSize
    Draw-CenteredLogo $fg.Graphics $original $fgSize 0.16
    Save-Png $fg.Bitmap (Join-Path $dir "ic_launcher_foreground.png")
    $fg.Graphics.Dispose(); $fg.Bitmap.Dispose()
}

$splashSrc = Join-Path $root "public\splashscreen\splash.png"
Write-Host "Splash Source: $splashSrc" -ForegroundColor Cyan
if (-not (Test-Path $splashSrc)) {
    Write-Host "Logo splashscreen tidak ditemukan: $splashSrc" -ForegroundColor Red
    exit 1
}
$splashOriginal = [System.Drawing.Image]::FromFile($splashSrc)

$splashPort = @{
    "drawable-port-mdpi"    = @(320, 480)
    "drawable-port-hdpi"    = @(480, 800)
    "drawable-port-xhdpi"   = @(720, 1280)
    "drawable-port-xxhdpi"  = @(960, 1600)
    "drawable-port-xxxhdpi" = @(1280, 1920)
}
$splashLand = @{
    "drawable-land-mdpi"    = @(480, 320)
    "drawable-land-hdpi"    = @(800, 480)
    "drawable-land-xhdpi"   = @(1280, 720)
    "drawable-land-xxhdpi"  = @(1600, 960)
    "drawable-land-xxxhdpi" = @(1920, 1280)
}

foreach ($entry in $splashPort.GetEnumerator()) {
    $w, $h = $entry.Value
    $bmp = New-SplashBitmap $w $h $splashOriginal
    Save-Png $bmp (Join-Path $resRoot "$($entry.Key)\splash.png")
    $bmp.Dispose()
}
foreach ($entry in $splashLand.GetEnumerator()) {
    $w, $h = $entry.Value
    $bmp = New-SplashBitmap $w $h $splashOriginal
    Save-Png $bmp (Join-Path $resRoot "$($entry.Key)\splash.png")
    $bmp.Dispose()
}

$defaultSplash = New-SplashBitmap 1080 1920 $splashOriginal
Save-Png $defaultSplash (Join-Path $resRoot "drawable\splash.png")
$defaultSplash.Dispose()
$splashOriginal.Dispose()

$faviconSizes = @(16, 32, 48, 192)
$publicRoot = Join-Path $root "public"
foreach ($s in $faviconSizes) {
    $sq = New-SquareBitmap $s
    Draw-CenteredLogo $sq.Graphics $original $s 0.06
    Save-Png $sq.Bitmap (Join-Path $publicRoot "favicon-$s.png")
    $sq.Graphics.Dispose(); $sq.Bitmap.Dispose()
}
$sq32 = New-SquareBitmap 32
Draw-CenteredLogo $sq32.Graphics $original 32 0.06
Save-Png $sq32.Bitmap (Join-Path $publicRoot "favicon.png")
$sq32.Graphics.Dispose(); $sq32.Bitmap.Dispose()

$apple = New-SquareBitmap 180
Draw-CenteredLogo $apple.Graphics $original 180 0.08
Save-Png $apple.Bitmap (Join-Path $publicRoot "apple-touch-icon.png")
$apple.Graphics.Dispose(); $apple.Bitmap.Dispose()

# Play Store listing icon (512×512, max 1024 KB)
$playStoreDir = Join-Path $root "android\play-store"
if (-not (Test-Path $playStoreDir)) { New-Item -ItemType Directory -Path $playStoreDir -Force | Out-Null }
$play512 = New-SquareBitmap 512
Draw-CenteredLogo $play512.Graphics $original 512 0.075
Save-Png $play512.Bitmap (Join-Path $playStoreDir "app-icon-512.png")
$play512.Graphics.Dispose(); $play512.Bitmap.Dispose()

$play1024 = New-SquareBitmap 1024
Draw-CenteredLogo $play1024.Graphics $original 1024 0.075
Save-Png $play1024.Bitmap (Join-Path $playStoreDir "app-icon-1024.png")
$play1024.Graphics.Dispose(); $play1024.Bitmap.Dispose()

$original.Dispose()
Write-Host "Selesai - icon Android, splash, favicon, Play Store icon diperbarui." -ForegroundColor Green
