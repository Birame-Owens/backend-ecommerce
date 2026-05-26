#!/bin/sh
# Script d'initialisation — à lancer UNE FOIS après docker compose up
# Usage: ./init.sh

set -e

echo "==> Attente que le backend soit prêt..."
sleep 5

echo "==> Génération de la clé applicative..."
docker compose exec backend php artisan key:generate --force

echo "==> Migrations..."
docker compose exec backend php artisan migrate --force

echo "==> Seeder admin (ndeya@admin.com / password)..."
docker compose exec backend php artisan db:seed --class=AdminUserSeeder --force

echo "==> Optimisation Laravel..."
docker compose exec backend php artisan config:cache
docker compose exec backend php artisan route:cache

echo ""
echo "Prêt ! API disponible sur http://localhost:8080"
echo "Admin : ndeya@admin.com / password"
