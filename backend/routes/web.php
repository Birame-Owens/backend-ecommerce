<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SeoController;

Route::get('/robots.txt', [SeoController::class, 'robots'])->name('seo.robots');
Route::get('/sitemap.xml', [SeoController::class, 'sitemap'])->name('seo.sitemap');
Route::get('/llms.txt', [SeoController::class, 'llms'])->name('seo.llms');
Route::get('/products-feed.json', [SeoController::class, 'productFeed'])->name('seo.products-feed');
Route::redirect('/products/{slug}', '/produits/{slug}', 301);

// Dynamic rendering : le nginx du front proxie ici les requetes des robots.
// Renvoie un HTML SEO (meta + JSON-LD + contenu visible) pour le chemin demande.
Route::get('/seo-render/{path?}', [SeoController::class, 'clientApp'])
    ->where('path', '.*')
    ->name('seo.render');
