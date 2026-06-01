# Generate SVG cover placeholders for jurnal/buku
$covers = @{
  'sholat-digital' = @{ bg = '#1a5f56'; accent = '#ffd54f'; label = 'Sholat' }
  'ramadan-ibadah' = @{ bg = '#4a148c'; accent = '#ce93d8'; label = 'Ramadan' }
  'adab-ilmu' = @{ bg = '#0d47a1'; accent = '#90caf9'; label = 'Adab Ilmu' }
  'zakat-dan-infaq' = @{ bg = '#1b5e20'; accent = '#a5d6a7'; label = 'Zakat' }
  'parenting-islami' = @{ bg = '#880e4f'; accent = '#f48fb1'; label = 'Parenting' }
  'muamalah-sehari-hari' = @{ bg = '#004d40'; accent = '#80cbc4'; label = 'Muamalah' }
  'buku-hadits-arbaein' = @{ bg = '#33691e'; accent = '#dcedc8'; label = '40 Hadits' }
  'buku-tahajud-malamm' = @{ bg = '#1a237e'; accent = '#9fa8da'; label = 'Tahajud' }
  'buku-sirah-10-hari' = @{ bg = '#bf360c'; accent = '#ffcc80'; label = 'Sirah' }
}
$dir = Join-Path $PSScriptRoot '..\public\images\jurnal\covers'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
foreach ($id in $covers.Keys) {
  $c = $covers[$id]
  $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 340" fill="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="$($c.bg)"/>
      <stop offset="100%" stop-color="#082020"/>
    </linearGradient>
  </defs>
  <rect width="240" height="340" rx="12" fill="url(#g)"/>
  <circle cx="200" cy="52" r="36" fill="$($c.accent)" opacity="0.22"/>
  <circle cx="40" cy="280" r="48" fill="$($c.accent)" opacity="0.15"/>
  <rect x="28" y="48" width="184" height="8" rx="4" fill="#ffffff" opacity="0.25"/>
  <rect x="28" y="68" width="140" height="6" rx="3" fill="#ffffff" opacity="0.18"/>
  <text x="120" y="190" text-anchor="middle" fill="#ffffff" font-family="Georgia,serif" font-size="26" font-weight="700">$($c.label)</text>
  <text x="120" y="300" text-anchor="middle" fill="$($c.accent)" font-family="system-ui,sans-serif" font-size="13" font-weight="600" letter-spacing="2">TALAQEE</text>
</svg>
"@
  Set-Content -Path (Join-Path $dir "$id.svg") -Value $svg -Encoding UTF8
}
Write-Host "Covers written to $dir"
