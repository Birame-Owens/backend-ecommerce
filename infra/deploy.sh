#!/usr/bin/env sh
set -eu

echo "Starting VIVIAS-SHOP with Docker..."

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed."
  exit 1
fi

docker compose version >/dev/null

if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env created from .env.example"
fi

docker compose up -d --build

echo "Creating default users..."
docker compose exec -T backend php artisan db:seed --class=AdminUserSeeder --force

echo ""
echo "VIVIAS-SHOP is ready."
echo "Client:   http://localhost:8001"
echo "API:      http://localhost:8001/api"
echo "Admin:    http://localhost:8001/admin"
echo "Vite:     http://localhost:5173"
echo ""
echo "Admin login:  admin@vivias.com / password"
echo "Client login: client@vivias.com / password"
