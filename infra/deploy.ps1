Write-Host "Starting VIVIAS-SHOP with Docker..." -ForegroundColor Green

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is not installed." -ForegroundColor Red
    exit 1
}

docker compose version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Compose is not available." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env created from .env.example" -ForegroundColor Yellow
}

docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker startup failed. Check logs with: docker compose logs" -ForegroundColor Red
    exit 1
}

Write-Host "Creating default users..." -ForegroundColor Yellow
docker compose exec -T backend php artisan db:seed --class=AdminUserSeeder --force

Write-Host ""
Write-Host "VIVIAS-SHOP is ready." -ForegroundColor Green
Write-Host "Client:   http://localhost:8001"
Write-Host "API:      http://localhost:8001/api"
Write-Host "Admin:    http://localhost:8001/admin"
Write-Host "Vite:     http://localhost:5173"
Write-Host ""
Write-Host "Admin login:  admin@vivias.com / password"
Write-Host "Client login: client@vivias.com / password"
