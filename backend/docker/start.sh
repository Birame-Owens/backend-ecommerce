#!/bin/sh
set -e

cd /app

echo "==> Ensuring storage directories exist..."
mkdir -p storage/framework/views storage/framework/cache storage/framework/sessions storage/logs bootstrap/cache

echo "==> Running database migrations..."
php artisan migrate --force

echo "==> Creating storage symlink..."
php artisan storage:link 2>/dev/null || true

echo "==> Caching configuration for production..."
php artisan config:cache
php artisan route:cache
php artisan optimize 2>/dev/null || true

echo "==> Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
