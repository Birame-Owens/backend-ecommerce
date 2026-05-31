#!/bin/sh
set -e

cd /app

echo "==> Running database migrations..."
php artisan migrate --force

echo "==> Creating storage symlink..."
php artisan storage:link 2>/dev/null || true

echo "==> Caching configuration for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache 2>/dev/null || true
php artisan optimize

echo "==> Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
