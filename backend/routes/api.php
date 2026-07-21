<?php



use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\ProduitController;
use App\Http\Controllers\Api\Admin\CommandeController; 
use App\Http\Controllers\Api\Admin\ClientController;
use App\Http\Controllers\Api\Admin\PaiementController;
use App\Http\Controllers\Api\Admin\PromotionController;
use App\Http\Controllers\Api\Admin\AvisClientController;
use App\Http\Controllers\Api\Admin\RapportController;
use App\Http\Controllers\Api\Admin\MessageGroupeController;
use App\Http\Controllers\Api\Admin\SyncController;
use App\Http\Controllers\Api\Admin\ShopSettingController;
use App\Http\Controllers\Api\Admin\DeliveryZoneController as AdminDeliveryZoneController;
use App\Http\Controllers\Api\Client\HomeController;

use App\Http\Controllers\Api\Client\HomeController as ClientHomeController;
use App\Http\Controllers\Api\Client\NavigationController;
use App\Http\Controllers\Api\Client\ProductController as ClientProductController;
use App\Http\Controllers\Api\Client\CategoryController as ClientCategoryController;
use App\Http\Controllers\Api\Client\CartController;
use App\Http\Controllers\Api\Client\WishlistController;
use App\Http\Controllers\Api\Client\AuthController as ClientAuthController;
use App\Http\Controllers\Api\Client\SearchController;
use App\Http\Controllers\Api\Client\PasswordResetController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\EmailStatsController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\JobStatsController;


// Middlewares de session/cookie retirés des routes PUBLIQUES de lecture (catalogue).
// Sans StartSession, la réponse ne porte pas de Set-Cookie -> nginx peut la mettre
// en cache FastCGI et PHP-FPM n'est plus sollicité. À n'appliquer qu'aux routes qui
// ne touchent JAMAIS Auth::/session() (le guard par défaut est "web" = session).
$statelessPublic = [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
];

// =================== ROUTES PUBLIQUES ===================

// Health check (publique, sans authentification)
Route::prefix('health')->name('health.')->group(function () {
    Route::get('/', [HealthController::class, 'check'])->name('check');
    Route::get('/stats', [HealthController::class, 'stats'])->name('stats');
});

// Webhooks (publics, sans authentification)
Route::prefix('webhooks')->name('webhooks.')->group(function () {
    Route::get('/test', [WebhookController::class, 'test'])->name('test');
    Route::post('/whatsapp', [WebhookController::class, 'whatsappWebhook'])->name('whatsapp');
    Route::post('/email-bounce', [WebhookController::class, 'emailBounceWebhook'])->name('email-bounce');
    Route::get('/email-open/{token}', [WebhookController::class, 'emailOpenWebhook'])->name('email-open');
    Route::get('/email-click/{token}', [WebhookController::class, 'emailClickWebhook'])->name('email-click');
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('admin')->group(function () {
    // Authentification avec RATE LIMITING (5 tentatives par minute)
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle.api:5,1');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('throttle.api:10,1');

    // Routes protégées
    Route::middleware(['throttle.api:120,1', 'auth:sanctum', 'admin.auth', 'admin.audit'])->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/check', [AuthController::class, 'check']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        
        // =================== EMAIL & MESSAGE STATS ===================
        Route::prefix('email-stats')->name('email-stats.')->group(function () {
            Route::get('/', [EmailStatsController::class, 'dashboard'])->name('dashboard');
            Route::get('/queue', [EmailStatsController::class, 'queueStats'])->name('queue');
            Route::get('/tracker', [EmailStatsController::class, 'trackerStats'])->name('tracker');
            Route::get('/whatsapp', [EmailStatsController::class, 'whatsappStats'])->name('whatsapp');
            Route::get('/pending', [EmailStatsController::class, 'pendingEmails'])->name('pending');
            Route::get('/failed', [EmailStatsController::class, 'failedEmails'])->name('failed');
            Route::get('/job/{id}', [EmailStatsController::class, 'jobDetails'])->name('job-details');
            Route::post('/process', [EmailStatsController::class, 'processManually'])->name('process');
            Route::post('/retry-failed', [EmailStatsController::class, 'retryFailed'])->name('retry-failed');
        });
        // =================== FIN EMAIL & MESSAGE STATS ===================
        
        // =================== MONITORING & LOGS ===================
        Route::prefix('logs')->name('logs.')->group(function () {
            Route::get('/performance', [\App\Http\Controllers\LogsController::class, 'performance'])->name('performance');
            Route::get('/errors', [\App\Http\Controllers\LogsController::class, 'errors'])->name('errors');
            Route::get('/api', [\App\Http\Controllers\LogsController::class, 'api'])->name('api');
            Route::get('/actions', [\App\Http\Controllers\LogsController::class, 'actions'])->name('actions');
            Route::get('/database', [\App\Http\Controllers\LogsController::class, 'database'])->name('database');
            Route::get('/slow-queries', [\App\Http\Controllers\LogsController::class, 'slowQueries'])->name('slow-queries');
        });
        // =================== FIN MONITORING & LOGS ===================
        
        // =================== JOBS & EMAIL STATS ===================
        Route::prefix('jobs')->name('jobs.')->group(function () {
            Route::get('/stats', [\App\Http\Controllers\JobStatsController::class, 'dashboard'])->name('dashboard');
            Route::get('/email-stats', [\App\Http\Controllers\JobStatsController::class, 'emailStats'])->name('email-stats');
            Route::get('/whatsapp-stats', [\App\Http\Controllers\JobStatsController::class, 'whatsappStats'])->name('whatsapp-stats');
            Route::get('/tracker-stats', [\App\Http\Controllers\JobStatsController::class, 'trackerStats'])->name('tracker-stats');
            Route::get('/failed-emails', [\App\Http\Controllers\JobStatsController::class, 'failedEmails'])->name('failed-emails');
        });
        // =================== FIN JOBS & EMAIL STATS ===================

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/quick-stats', [DashboardController::class, 'quickStats']);

        // =================== SYSTÈME DE RAPPORTS ===================
        
        // Liste et informations générales des rapports
        Route::get('/rapports', [RapportController::class, 'index']);
        Route::get('/rapports/dashboard', [RapportController::class, 'dashboard']);
        Route::get('/rapports/alertes', [RapportController::class, 'alertes']);
        Route::get('/rapports/tendances', [RapportController::class, 'tendances']);
        
        // Rapports spécifiques par type
        Route::get('/rapports/ventes', [RapportController::class, 'ventes']);
        Route::get('/rapports/produits', [RapportController::class, 'produits']);
        Route::get('/rapports/clients', [RapportController::class, 'clients']);
        Route::get('/rapports/financier', [RapportController::class, 'financier']);
        Route::get('/rapports/commandes', [RapportController::class, 'commandes']);
        Route::get('/rapports/tailleurs', [RapportController::class, 'tailleurs']);
        Route::get('/rapports/tissus', [RapportController::class, 'tissus']);
        Route::get('/rapports/analytics', [RapportController::class, 'analytics']);
        Route::get('/rapports/performance-produits', [RapportController::class, 'performanceProduits']);


        // Export et fonctionnalités avancées
        Route::post('/rapports/export', [RapportController::class, 'export']);
        Route::post('/rapports/comparatif', [RapportController::class, 'comparatif']);
        Route::post('/rapports/planifier', [RapportController::class, 'planifier']);

        // =================== FIN SYSTÈME DE RAPPORTS ===================

        // Catégories
        Route::get('/categories/stats', [CategoryController::class, 'stats']);
        Route::get('/categories/options', [CategoryController::class, 'options']);
        Route::post('/categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus']);
        Route::get('/categories/{category}/sous-categories', [CategoryController::class, 'sousCategoriesOf']);
        Route::apiResource('categories', CategoryController::class);

        // =================== SYNCHRONISATION CATÉGORIES-PRODUITS ===================
        Route::prefix('sync')->name('sync.')->group(function () {
            Route::post('/', [SyncController::class, 'sync'])->name('sync');
            Route::get('/report', [SyncController::class, 'report'])->name('report');
            Route::get('/categories/{category}/visibility', [SyncController::class, 'categoryVisibility'])->name('category-visibility');
            Route::post('/categories/{category}/reset', [SyncController::class, 'resetCategory'])->name('reset-category');
        });
        // =================== FIN SYNCHRONISATION ===================

        // Produits
        Route::post('/produits/{produit}/toggle-status', [ProduitController::class, 'toggleStatus']);
        Route::post('/produits/{produit}/duplicate', [ProduitController::class, 'duplicate']);
        Route::delete('/produits/{produit}/images/{image}', [ProduitController::class, 'deleteImage']);
        Route::post('/produits/{produit}/images/order', [ProduitController::class, 'updateImagesOrder']);
        Route::apiResource('produits', ProduitController::class);

        // =================== COMMANDES - NOUVELLE IMPLÉMENTATION ===================
        
        // Routes auxiliaires pour les commandes (AVANT les routes avec paramètres)
        Route::get('/commandes/statistics', [CommandeController::class, 'getStatistics']);
        Route::get('/commandes/clients-with-mesures', [CommandeController::class, 'getClientsWithMesures']);
        Route::get('/commandes/produits', [CommandeController::class, 'getProduits']);
        Route::get('/commandes/en-retard', [CommandeController::class, 'getCommandesEnRetard']);
        Route::get('/commandes/urgentes', [CommandeController::class, 'getCommandesUrgentes']);
        Route::get('/commandes/quick-search', [CommandeController::class, 'quickSearch']);
        Route::get('/commandes/export', [CommandeController::class, 'export']);
        Route::get('/commandes/daily-report', [CommandeController::class, 'getDailyReport']);
        
        // Routes avec paramètres de commande spécifique
        Route::post('/commandes/{commande}/update-status', [CommandeController::class, 'updateStatus']);
        Route::post('/commandes/{commande}/duplicate', [CommandeController::class, 'duplicate']);
        Route::post('/commandes/{commande}/mark-paid', [CommandeController::class, 'markAsPaid']);
        Route::get('/commandes/{commande}/etiquette', [CommandeController::class, 'printLabel']);
        
        // Routes CRUD principales (à la fin)
        Route::apiResource('commandes', CommandeController::class);
 
        // =================== FIN COMMANDES ===================

        // Clients
        Route::get('/clients/stats', [ClientController::class, 'stats']);
        Route::get('/clients/vip', [ClientController::class, 'vipClients']);
        Route::get('/clients/inactive', [ClientController::class, 'inactiveClients']);
        Route::get('/clients/search', [ClientController::class, 'search']);
        Route::post('/clients/{client}/send-whatsapp', [ClientController::class, 'sendWhatsApp']);
        Route::post('/clients/send-novelty-notification', [ClientController::class, 'sendNoveltyNotification']);
        Route::apiResource('clients', ClientController::class);

        // Paiements
        Route::get('/paiements/stats', [PaiementController::class, 'stats']);
        Route::get('/paiements/payment-methods', [PaiementController::class, 'paymentMethods']);
        Route::post('/paiements/payment-methods/{method}/toggle', [PaiementController::class, 'togglePaymentMethod']);
        Route::post('/paiements/{paiement}/confirm', [PaiementController::class, 'confirm']);
        Route::post('/paiements/{paiement}/reject', [PaiementController::class, 'reject']);
        Route::post('/paiements/{paiement}/refund', [PaiementController::class, 'refund']);
        Route::get('/paiements/{paiement}/check-status', [PaiementController::class, 'checkStatus']);
        Route::post('/paiements/webhook/wave', [PaiementController::class, 'webhookWave']);
        Route::post('/paiements/webhook/orange-money', [PaiementController::class, 'webhookOrangeMoney']);
        Route::apiResource('paiements', PaiementController::class);

        // Promotions
        Route::get('/promotions/stats', [PromotionController::class, 'stats']);
        Route::get('/promotions/options', [PromotionController::class, 'options']);
        Route::post('/promotions/validate-code', [PromotionController::class, 'validateCode']);
        Route::post('/promotions/{promotion}/toggle-status', [PromotionController::class, 'toggleStatus']);
        Route::post('/promotions/{promotion}/duplicate', [PromotionController::class, 'duplicate']);
        Route::apiResource('promotions', PromotionController::class);

        // Paramètres de livraison
        Route::get('/shipping-settings', [\App\Http\Controllers\Api\Admin\ShippingSettingsController::class, 'index']);
        Route::put('/shipping-settings', [\App\Http\Controllers\Api\Admin\ShippingSettingsController::class, 'update']);
        Route::post('/shipping-settings/disable', [\App\Http\Controllers\Api\Admin\ShippingSettingsController::class, 'disable']);
        Route::post('/shipping-settings/enable', [\App\Http\Controllers\Api\Admin\ShippingSettingsController::class, 'enable']);

        // Zones de livraison
        Route::post('/delivery-zones/{deliveryZone}/toggle-status', [AdminDeliveryZoneController::class, 'toggleStatus']);
        Route::apiResource('delivery-zones', AdminDeliveryZoneController::class);

        // Avis Clients
        Route::get('/avis-clients/stats', [AvisClientController::class, 'stats']);
        Route::get('/avis-clients/options', [AvisClientController::class, 'options']);
        Route::get('/avis-clients/en-attente', [AvisClientController::class, 'enAttente']);
        Route::post('/avis-clients/{avis}/moderer', [AvisClientController::class, 'moderer']);
        Route::post('/avis-clients/{avis}/repondre', [AvisClientController::class, 'repondre']);
        Route::post('/avis-clients/{avis}/toggle-mise-en-avant', [AvisClientController::class, 'toggleMiseEnAvant']);
        Route::post('/avis-clients/{avis}/toggle-verifie', [AvisClientController::class, 'toggleVerifie']);
        Route::apiResource('avis-clients', AvisClientController::class)->only(['index', 'show', 'destroy']);

        // =================== PARAMÈTRES BOUTIQUE ===================
        Route::prefix('settings')->name('settings.')->group(function () {
            Route::get('/', [ShopSettingController::class, 'index'])->name('index');
            Route::put('/', [ShopSettingController::class, 'update'])->name('update');
            Route::post('/logo', [ShopSettingController::class, 'uploadLogo'])->name('logo');
            Route::post('/change-password', [ShopSettingController::class, 'changePassword'])->name('change-password');
        });
        // =================== FIN PARAMÈTRES BOUTIQUE ===================

        // Messages Groupés
        Route::prefix('messages')->group(function () {
            Route::get('/groups', [MessageGroupeController::class, 'getClientGroups']);
            Route::get('/clients', [MessageGroupeController::class, 'getGroupClients']);
            Route::post('/send', [MessageGroupeController::class, 'sendGroupMessage']);
        });

        
    });
    
});


Route::prefix('client')->group(function () use ($statelessPublic) {

    // =================== ROUTES PUBLIQUES CACHEABLES (sans session) ===========
    // Pas de StartSession ici -> pas de Set-Cookie -> cache nginx actif.
    Route::withoutMiddleware($statelessPublic)->group(function () {
        // PAGE D'ACCUEIL
        Route::get('/home', [HomeController::class, 'index']);
        Route::get('/featured-products', [HomeController::class, 'featuredProducts']);
        Route::get('/new-arrivals', [HomeController::class, 'newArrivals']);
        Route::get('/products-on-sale', [HomeController::class, 'productsOnSale']);
        Route::get('/categories-preview', [HomeController::class, 'categoriesPreview']);
        Route::get('/active-promotions', [HomeController::class, 'activePromotions']);
        Route::get('/shop-stats', [HomeController::class, 'shopStats']);
        Route::get('/testimonials', [HomeController::class, 'testimonials']);

        // NAVIGATION DYNAMIQUE
        Route::get('/navigation/menu', [NavigationController::class, 'getMainMenu']);
        Route::get('/navigation/categories/{slug}/preview', [NavigationController::class, 'getCategoryPreview']);
    });

    // =================== PRODUITS ===================
    Route::prefix('products')->withoutMiddleware($statelessPublic)->group(function () {
    Route::get('/', [ClientProductController::class, 'index']);
    Route::get('/trending', [ClientProductController::class, 'trending']);
    Route::get('/new-arrivals', [ClientProductController::class, 'newArrivals']);
    Route::get('/on-sale', [ClientProductController::class, 'onSale']);
    Route::get('/{slug}/page-data', [ClientProductController::class, 'getPageData']);
    Route::get('/{slug}/reviews', [ClientProductController::class, 'reviews']);

    Route::get('/{slug}', [ClientProductController::class, 'show']);
    Route::get('/{id}/images', [ClientProductController::class, 'getImages']);
    Route::get('/{id}/related', [ClientProductController::class, 'getRelated']);
    Route::post('/{id}/view', [ClientProductController::class, 'incrementViews']);
    Route::get('/{id}/whatsapp-data', [ClientProductController::class, 'getWhatsAppData']);
});
    
    // =================== CATÉGORIES ===================
   Route::prefix('categories')->withoutMiddleware($statelessPublic)->group(function () {
    Route::get('/', [ClientCategoryController::class, 'index']);
    Route::get('/{slug}', [ClientCategoryController::class, 'show']);
    Route::get('/{slug}/products', [ClientCategoryController::class, 'getProducts']);
});
    
    // =================== RECHERCHE ===================
    // SearchController utilise le guard sanctum (pas la session web) -> sessionless OK.
    Route::prefix('search')->withoutMiddleware($statelessPublic)->group(function () {
        Route::get('/', [SearchController::class, 'search']);
        Route::get('/suggestions', [SearchController::class, 'suggestions']);
        Route::get('/quick', [HomeController::class, 'quickSearch']); // Compatibilité avec l'existant
    });
    
    // =================== ÉVÉNEMENTS (business intelligence interne) ===================
    Route::withoutMiddleware($statelessPublic)
        ->post('/evenements', [\App\Http\Controllers\Api\Client\EvenementController::class, 'store'])
        ->middleware('throttle.api:60,1');

    // =================== PANIER (SESSION BASED) ===================
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/add', [CartController::class, 'add']);
        Route::put('/update/{itemId}', [CartController::class, 'update']);
        Route::delete('/remove/{itemId}', [CartController::class, 'remove']);
        Route::delete('/clear', [CartController::class, 'clear']);
        Route::get('/count', [CartController::class, 'getCount']);
        Route::get('/total', [CartController::class, 'getTotal']);
        Route::post('/whatsapp', [CartController::class, 'generateWhatsAppMessage']);
        Route::post('/apply-coupon', [CartController::class, 'applyCoupon']);
        Route::delete('/remove-coupon', [CartController::class, 'removeCoupon']);
    });
    
    // =================== FAVORIS (SESSION BASED) ===================
    Route::prefix('wishlist')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::post('/add', [WishlistController::class, 'add']);
        Route::delete('/remove/{productId}', [WishlistController::class, 'remove']);
        Route::delete('/clear', [WishlistController::class, 'clear']);
        Route::get('/count', [WishlistController::class, 'getCount']);
        Route::post('/move-to-cart/{productId}', [WishlistController::class, 'moveToCart']);
        Route::get('/check/{productId}', [WishlistController::class, 'checkProduct']);
    });
    
    // =================== AUTHENTIFICATION CLIENT ===================
    Route::prefix('auth')->group(function () {
        // Routes publiques
        Route::post('/register', [ClientAuthController::class, 'register'])->middleware('throttle.api:10,1')->name('client.auth.register');
        Route::post('/login', [ClientAuthController::class, 'login'])->middleware('throttle.api:5,1')->name('client.auth.login');
        Route::post('/guest-checkout', [ClientAuthController::class, 'guestCheckout'])->middleware('throttle.api:20,1')->name('client.auth.guest-checkout');
        
        // Routes protégées
        Route::middleware(['auth:sanctum'])->group(function () {
            Route::post('/logout', [ClientAuthController::class, 'logout'])->name('client.auth.logout');
            Route::get('/user', [ClientAuthController::class, 'profile'])->name('client.auth.user');
            Route::get('/profile', [ClientAuthController::class, 'profile'])->name('client.auth.profile');
            Route::put('/profile', [ClientAuthController::class, 'updateProfile'])->name('client.auth.update-profile');
            Route::get('/measurements', [ClientAuthController::class, 'getMeasurements'])->name('client.auth.get-measurements');
            Route::post('/measurements', [ClientAuthController::class, 'saveMeasurements'])->name('client.auth.save-measurements');
        });
    });

    // =================== RÉINITIALISATION MOT DE PASSE ===================
    Route::prefix('password')->group(function () {
        // Routes publiques
        Route::post('/forgot', [PasswordResetController::class, 'sendResetLink']);
        Route::post('/validate-token', [PasswordResetController::class, 'validateToken']);
        Route::post('/reset', [PasswordResetController::class, 'resetPassword']);
        
        // Route protégée pour changer le mot de passe
        Route::middleware(['auth:sanctum'])->group(function () {
            Route::post('/change', [PasswordResetController::class, 'changePassword']);
        });
    });

    // =================== COMPTE CLIENT (DASHBOARD) ===================
    Route::prefix('account')->middleware(['auth:sanctum'])->group(function () {
        Route::get('/orders', [\App\Http\Controllers\Api\Client\AccountController::class, 'getOrders']);
        Route::get('/orders/{orderId}', [\App\Http\Controllers\Api\Client\AccountController::class, 'getOrderDetails']);
        Route::get('/invoices', [\App\Http\Controllers\Api\Client\AccountController::class, 'getInvoices']);
        Route::get('/invoices/{invoiceId}/download', [\App\Http\Controllers\Api\Client\AccountController::class, 'downloadInvoice']);
        Route::get('/profile', [\App\Http\Controllers\Api\Client\AccountController::class, 'getProfile']);
    });

    Route::post('/reviews', [\App\Http\Controllers\Api\Client\AvisClientController::class, 'store'])
        ->middleware(['auth:sanctum', 'throttle.api:10,1']);

    // =================== PROMOTIONS (PUBLIC) ===================
    Route::post('/promotions/validate-code', [\App\Http\Controllers\Api\Client\CheckoutController::class, 'validateCoupon'])
        ->middleware('throttle.api:20,1');

    // =================== ZONES DE LIVRAISON ===================
    Route::withoutMiddleware($statelessPublic)->group(function () {
        Route::get('/delivery-zones', [\App\Http\Controllers\Api\Client\DeliveryZoneController::class, 'index']);
    });

    // =================== CHECKOUT & PAIEMENT ===================
    Route::prefix('checkout')->group(function () {
        Route::post('/create-order', [\App\Http\Controllers\Api\Client\CheckoutController::class, 'createOrder']);
        Route::post('/payment/{orderNumber}', [\App\Http\Controllers\Api\Client\CheckoutController::class, 'initiatePayment']);
        Route::get('/success', [\App\Http\Controllers\Api\Client\CheckoutController::class, 'success'])
            ->middleware('throttle.api:30,1');
        Route::get('/cancel', [\App\Http\Controllers\Api\Client\CheckoutController::class, 'cancel'])
            ->middleware('throttle.api:30,1');
    });

    // Route publique pour récupérer détails commande après paiement (protégée par ?t= access_token, voir CheckoutController::assertOrderAccess)
    Route::get('/commandes/{orderNumber}', [\App\Http\Controllers\Api\Client\CheckoutController::class, 'getOrderByNumber'])
        ->middleware('throttle.api:30,1');
    // =================== NABOOPAY ===================
    Route::prefix('naboopay')->group(function () {
        Route::get('/status/{orderId}', [\App\Http\Controllers\Api\Client\NabooPayController::class, 'status'])
            ->middleware('throttle.api:30,1');
    });

    Route::post('/webhook/naboopay', [\App\Http\Controllers\Api\Client\NabooPayController::class, 'webhook'])
        ->name('naboopay.webhook');
    // =================== CONFIGURATION SYSTÈME ===================
    Route::withoutMiddleware($statelessPublic)->get('/config', function() {
        return response()->json([
            'success' => true,
            'data' => [
                'company' => [
                    'name' => \App\Models\ShopSetting::getValue('boutique_nom', 'NDEYA SHOP'),
                    'logo' => \App\Models\ShopSetting::getValue('boutique_logo')
                        ? asset('storage/' . \App\Models\ShopSetting::getValue('boutique_logo'))
                        : null,
                    // Numéro WhatsApp géré depuis l'admin (Paramètres → WhatsApp). Si vide,
                    // on retombe sur le téléphone boutique, puis sur une valeur par défaut.
                    'whatsapp' => \App\Models\ShopSetting::getValue('social_whatsapp')
                        ?: (\App\Models\ShopSetting::getValue('boutique_telephone') ?: '+221784661412'),
                    'instagram' => \App\Models\ShopSetting::getValue('social_instagram') ?: config('app.instagram_url', 'https://instagram.com/ndeyashop'),
                    'facebook' => \App\Models\ShopSetting::getValue('social_facebook') ?: '',
                    'tiktok' => \App\Models\ShopSetting::getValue('social_tiktok') ?: config('app.tiktok_url', 'https://tiktok.com/@ndeyashop'),
                    'email' => \App\Models\ShopSetting::getValue('boutique_email') ?: config('app.contact_email', 'contact@ndeyashop.sn'),
                    'address' => \App\Models\ShopSetting::getValue('boutique_adresse') ?: 'Dakar, Sénégal',
                ],
                'analytics' => [
                    // Configuré depuis Admin → Paramètres → Analytics. Vide = tracking désactivé.
                    'ga_measurement_id' => \App\Models\ShopSetting::getValue('analytics_ga_id') ?: null,
                ],
                'currency' => 'F CFA',
                'shipping' => [
                    'free_threshold' => env('SHIPPING_FREE_THRESHOLD', 50000),
                    'default_fee' => env('SHIPPING_DEFAULT_COST', 2500)
                ],
                'features' => [
                    'guest_checkout' => true,
                    'whatsapp_support' => true,
                    'cart_session' => true,
                    'wishlist_session' => true,
                    'dynamic_navigation' => true,
                    'product_carousel' => true,
                    'reviews' => true,
                    'coupons' => true,
                    'auto_invoices' => true,
                    'whatsapp_notifications' => true
                ],
                'limits' => [
                    'cart_max_items' => 50,
                    'wishlist_max_items' => 100,
                    'session_timeout' => 7200
                ]
            ]
        ]);
    });
    
});
