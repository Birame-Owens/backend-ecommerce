<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * 🔐 RATE LIMITING MIDDLEWARE
 * 
 * Protect API endpoints from abuse
 * - Login attempts: 5 per minute per IP
 * - API calls: 60 per minute per user
 * - Search: 30 per minute per user
 */
class RateLimitingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Login attempts - strict
        if ($request->is('api/auth/login', 'api/auth/register')) {
            return $this->limitByIp($request, $next, 'login', 5, 60);
        }

        // API calls - per user
        if ($request->is('api/*') && auth()->check()) {
            return $this->limitByUser($request, $next, 'api', 60, 60);
        }

        // Search - moderate
        if ($request->is('api/products/search')) {
            return $this->limitByUser($request, $next, 'search', 30, 60);
        }

        // Payment - very strict
        if ($request->is('api/payments/*')) {
            return $this->limitByUser($request, $next, 'payment', 10, 60);
        }

        return $next($request);
    }

    /**
     * Rate limit by IP address
     */
    protected function limitByIp(Request $request, Closure $next, string $key, int $limit, int $decay): Response
    {
        $limiter = "ip:{$key}:" . $request->ip();

        if (RateLimiter::tooManyAttempts($limiter, $limit)) {
            return response()->json([
                'success' => false,
                'message' => 'Trop de tentatives. Réessayez dans ' . RateLimiter::availableIn($limiter) . ' secondes.',
                'code' => 'RATE_LIMIT',
            ], 429);
        }

        RateLimiter::hit($limiter, $decay);

        return $next($request)->header('X-RateLimit-Remaining', RateLimiter::remaining($limiter, $limit));
    }

    /**
     * Rate limit by user ID
     */
    protected function limitByUser(Request $request, Closure $next, string $key, int $limit, int $decay): Response
    {
        $userId = auth()->id() ?? $request->ip();
        $limiter = "user:{$key}:{$userId}";

        if (RateLimiter::tooManyAttempts($limiter, $limit)) {
            return response()->json([
                'success' => false,
                'message' => 'Limite de requêtes dépassée. Réessayez dans ' . RateLimiter::availableIn($limiter) . ' secondes.',
                'code' => 'RATE_LIMIT',
            ], 429);
        }

        RateLimiter::hit($limiter, $decay);

        $response = $next($request);
        $remaining = RateLimiter::remaining($limiter, $limit);

        return $response
            ->header('X-RateLimit-Limit', $limit)
            ->header('X-RateLimit-Remaining', $remaining)
            ->header('X-RateLimit-Reset', RateLimiter::resetAfter($limiter));
    }
}

/**
 * 🔐 SECURITY HEADERS MIDDLEWARE
 * Add important security headers
 */
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        return $response
            // Prevent clickjacking attacks
            ->header('X-Frame-Options', 'SAMEORIGIN')
            // Prevent MIME type sniffing
            ->header('X-Content-Type-Options', 'nosniff')
            // Enable XSS protection
            ->header('X-XSS-Protection', '1; mode=block')
            // Content Security Policy
            ->header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
            // Referrer Policy
            ->header('Referrer-Policy', 'strict-origin-when-cross-origin')
            // Feature Policy / Permissions Policy
            ->header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
            // Strict Transport Security
            ->header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
}

/**
 * 🔐 CORS EXPLICIT MIDDLEWARE
 * Secure CORS configuration
 */
class CorsMiddleware
{
    protected $except = ['api/public/*'];

    public function handle(Request $request, Closure $next): Response
    {
        $allowed_origins = config('cors.allowed_origins', [
            'http://localhost:3000',
            'http://localhost:5173', // Vite dev
            'https://ndeya-shop.com',
        ]);

        $origin = $request->header('Origin');

        if (in_array($origin, $allowed_origins)) {
            $response = $next($request);

            return $response
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        return $next($request);
    }
}
