<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Faire confiance au proxy Coolify/Traefik (SSL termination)
        $middleware->trustProxies(at: '*');

        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Headers sécurité sur toutes les réponses
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        // Middleware CORS
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\EnsureJsonResponse::class,
        ]);
        
        // Ajouter les middleware de session pour les routes API
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\ApiResponseCache::class,
        ]);
        
        // Rate limiting et Monitoring
        $middleware->alias([
            'admin.auth'   => \App\Http\Middleware\AdminAuthenticated::class,
            'admin.role'   => \App\Http\Middleware\CheckAdminRole::class,
            'throttle.api' => \App\Http\Middleware\RateLimitMiddleware::class,
            'admin.audit'  => \App\Http\Middleware\AdminAuditLog::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
