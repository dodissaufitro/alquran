#!/bin/sh
set -e

if [ ! -f /app/dist/index.html ]; then
  echo "[alquran] ERROR: /app/dist/index.html tidak ditemukan."
  echo "[alquran] Rebuild image: docker compose -f docker-compose.prod.yml up -d --build"
  exit 1
fi

if [ ! -f /app/dist/admin.html ]; then
  echo "[alquran] ERROR: /app/dist/admin.html tidak ditemukan (CMS admin)."
  echo "[alquran] Pastikan npm run build dijalankan saat build image, lalu rebuild container."
  exit 1
fi

echo "[alquran] OK — dist/index.html + dist/admin.html"
echo "[alquran] CMS admin: /admin.html"
exec php -S 0.0.0.0:80 -t /app /app/router.php
