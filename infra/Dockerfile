# ─── Backend Laravel (PHP-FPM) ──────────────────────────────────────────────
# Context attendu: racine du repo (ndeya-shop/)
# Lancer depuis infra/ : docker-compose build backend
# ─────────────────────────────────────────────────────────────────────────────
FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    build-base autoconf \
    libpq-dev postgresql-client \
    libxml2-dev oniguruma-dev libzip-dev \
    freetype-dev libjpeg-turbo-dev libpng-dev libwebp-dev \
    git curl zip unzip

RUN docker-php-ext-configure gd --with-jpeg --with-freetype --with-webp \
    && docker-php-ext-install pdo_pgsql bcmath mbstring xml gd exif zip opcache

RUN pecl install redis && docker-php-ext-enable redis

# OPcache + JIT — sans ça PHP recompile chaque fichier à chaque requête
COPY backend/docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Dépendances Composer d'abord (layer cache)
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Code source backend
COPY backend/ .

RUN composer dump-autoload --optimize

RUN mkdir -p storage/logs storage/framework/cache/data \
             storage/framework/sessions storage/framework/views \
             bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Fichiers infra
COPY infra/docker/entrypoint.sh /usr/local/bin/app-entrypoint
RUN chmod +x /usr/local/bin/app-entrypoint

COPY infra/docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

EXPOSE 9000

ENTRYPOINT ["app-entrypoint"]
CMD ["php-fpm"]
