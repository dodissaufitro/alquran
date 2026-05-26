# Faithful Path — production (PHP 8.2 + router.php + API rekaman PHP)
FROM php:8.2-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends libonig-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY router.php /app/router.php
COPY api /app/api
COPY dist /app/dist

RUN mkdir -p /app/api/talaqqi/uploads /app/api/talaqqi/data \
    && chmod -R 777 /app/api/talaqqi/uploads /app/api/talaqqi/data

EXPOSE 80

CMD ["php", "-S", "0.0.0.0:80", "-t", "/app", "/app/router.php"]
