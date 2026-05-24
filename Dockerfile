# Faithful Path — production (PHP 8.2 built-in server + router.php)
# Build frontend di host/CI dulu: npm run build
# Lalu: docker build -t alquran . && docker run ...

FROM php:8.2-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends libonig-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Salin artefak deploy (dist + api + router). Volume mount di VPS menimpa folder ini.
COPY router.php /app/router.php
COPY api /app/api
COPY dist /app/dist

EXPOSE 80

# JANGAN pakai -t /app/dist — API ada di /app/api/
CMD ["php", "-S", "0.0.0.0:80", "-t", "/app", "/app/router.php"]
