<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SeoController;

Route::get('/robots.txt', [SeoController::class, 'robots'])->name('seo.robots');
Route::get('/sitemap.xml', [SeoController::class, 'sitemap'])->name('seo.sitemap');
Route::get('/llms.txt', [SeoController::class, 'llms'])->name('seo.llms');
Route::get('/products-feed.json', [SeoController::class, 'productFeed'])->name('seo.products-feed');
Route::redirect('/products/{slug}', '/produits/{slug}', 301);

// Désinscription des e-mails commerciaux (lien signé présent dans chaque relance de panier).
// GET pour le lien de l'e-mail, POST pour la désinscription « en un clic » des messageries.
Route::match(['get', 'post'], '/desinscription/{client}', \App\Http\Controllers\DesinscriptionController::class)
    ->middleware(['signed', 'throttle:20,1'])
    ->name('relance.desinscription');

// Dynamic rendering : le nginx du front proxie ici les requetes des robots.
// Renvoie un HTML SEO (meta + JSON-LD + contenu visible) pour le chemin demande.
Route::get('/seo-render/{path?}', [SeoController::class, 'clientApp'])
    ->where('path', '.*')
    ->name('seo.render');
