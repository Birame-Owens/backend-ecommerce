<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sépare l'authentification client (jeton Bearer) de l'authentification admin
 * (cookie de session), qui partagent le même navigateur.
 *
 * Par défaut, Sanctum regarde la session AVANT le jeton : avec l'admin connecté
 * dans un onglet et un client dans un autre, les requêtes du client étaient
 * attribuées à l'admin (et inversement après une connexion client). Quand une
 * requête porte un jeton, on n'utilise donc QUE ce jeton.
 */
class PreferBearerToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken()) {
            config(['sanctum.guard' => []]);
            Auth::shouldUse('sanctum');
        }

        return $next($request);
    }
}
