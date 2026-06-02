# Talaqee — production (build frontend + PHP 8.2 router)
# Build: docker compose -f docker-compose.prod.yml build
# Pastikan api/config.local.php ada di host (volume) sebelum up.

FROM node:20-alpine AS frontend
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html admin.html ./
COPY public ./public
COPY src ./src

ARG VITE_APP_ORIGIN=https://app.talaqee.com
ARG VITE_CMS_API_BASE=https://app.talaqee.com/api/cms
ENV VITE_APP_ORIGIN=$VITE_APP_ORIGIN
ENV VITE_CMS_API_BASE=$VITE_CMS_API_BASE

RUN npm run build \
    && test -f dist/admin.html \
    && test -f dist/index.html

FROM php:8.2-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends libonig-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY router.php /app/router.php
COPY api /app/api
COPY --from=frontend /build/dist /app/dist
COPY deploy/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /app/api/talaqqi/uploads /app/api/talaqqi/data /app/uploads/jurnal-covers \
    && chmod -R 777 /app/api/talaqqi/uploads /app/api/talaqqi/data /app/uploads/jurnal-covers

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
