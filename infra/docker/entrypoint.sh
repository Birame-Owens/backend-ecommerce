#!/bin/sh
set -e

mkdir -p \
  storage/app/public \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache

# Optimisations Laravel au demarrage (reduit les I/O par requete)
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
