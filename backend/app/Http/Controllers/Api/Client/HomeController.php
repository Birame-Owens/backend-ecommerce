<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\HomeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class HomeController extends Controller
{
    protected HomeService $homeService;

    public function __construct(HomeService $homeService)
    {
        $this->homeService = $homeService;
    }

    /**
     * Page d'accueil - Données principales
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Cache pour optimiser les performances (10 minutes)
            $cacheKey = 'client_home_data';
            
            $data = Cache::remember($cacheKey, 600, function () {
                return $this->homeService->getHomeData();
            });

            return response()->json([
                'success' => true,
                'message' => 'Données d\'accueil récupérées avec succès',
                'data' => $data,
                'meta' => [
                    'timestamp' => now()->toISOString(),
                    'cache_expires_in' => 600
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur page d\'accueil client', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de la page d\'accueil',
                'error_code' => 'HOME_LOAD_ERROR'
            ], 500);
        }
    }

    /**
     * Produits en vedette
     */
    public function featuredProducts(Request $request): JsonResponse
    {
        try {
            $limit = (int) $request->get('limit', 8);

            $data = Cache::remember("home:featured_products:{$limit}", 300, function () use ($limit) {
                $produits = $this->homeService->getFeaturedProducts($limit);
                return ['produits' => $produits, 'total' => count($produits)];
            });

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            Log::error('Erreur produits en vedette', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors du chargement des produits en vedette'], 500);
        }
    }

    /**
     * Nouveautés
     */
    public function newArrivals(Request $request): JsonResponse
    {
        try {
            $limit = (int) $request->get('limit', 8);

            $data = Cache::remember("home:new_arrivals:{$limit}", 300, function () use ($limit) {
                $produits = $this->homeService->getNewArrivals($limit);
                return ['produits' => $produits, 'total' => count($produits)];
            });

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            Log::error('Erreur nouveautés', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors du chargement des nouveautés'], 500);
        }
    }

    /**
     * Produits en promotion
     */
    public function productsOnSale(Request $request): JsonResponse
    {
        try {
            $limit = (int) $request->get('limit', 8);

            $data = Cache::remember("home:products_on_sale:{$limit}", 300, function () use ($limit) {
                $produits = $this->homeService->getProductsOnSale($limit);
                return [
                    'produits'     => $produits,
                    'total'        => count($produits),
                    'savings_info' => $this->homeService->calculateTotalSavings($produits)
                ];
            });

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            Log::error('Erreur produits en promo', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors du chargement des produits en promotion'], 500);
        }
    }

    /**
     * Aperçu des catégories pour la navigation
     */
    public function categoriesPreview(): JsonResponse
    {
        try {
            $categories = Cache::remember('home:categories_preview', 600, function () {
                return $this->homeService->getCategoriesPreview();
            });

            return response()->json(['success' => true, 'data' => ['categories' => $categories]]);

        } catch (\Exception $e) {
            Log::error('Erreur aperçu catégories', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors du chargement des catégories'], 500);
        }
    }

    /**
     * Promotions actives pour les bannières
     */
    public function activePromotions(): JsonResponse
    {
        try {
            $data = Cache::remember('home:active_promotions', 300, function () {
                return [
                    'promotions'     => $this->homeService->getActivePromotions(),
                    'has_flash_sale' => $this->homeService->hasFlashSale(),
                    'product_promos' => $this->homeService->getProductPromoStats(),
                ];
            });

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            Log::error('Erreur promotions actives', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors du chargement des promotions'], 500);
        }
    }

    /**
     * Statistiques pour la boutique (affichage public)
     */
    public function shopStats(): JsonResponse
    {
        try {
            $stats = Cache::remember('home:shop_stats', 3600, function () {
                return $this->homeService->getPublicShopStats();
            });

            return response()->json(['success' => true, 'data' => $stats]);

        } catch (\Exception $e) {
            Log::error('Erreur stats boutique', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors du chargement des statistiques'], 500);
        }
    }

    /**
     * Témoignages et avis clients
     */
    public function testimonials(Request $request): JsonResponse
    {
        try {
            $limit = (int) $request->get('limit', 6);

            $data = Cache::remember("home:testimonials:{$limit}", 1800, function () use ($limit) {
                return [
                    'testimonials'   => $this->homeService->getFeaturedTestimonials($limit),
                    'average_rating' => $this->homeService->getAverageRating()
                ];
            });

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            Log::error('Erreur témoignages', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors du chargement des témoignages'], 500);
        }
    }

    /**
     * Newsletter signup
     */
    public function subscribeNewsletter(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|max:255',
                'nom' => 'nullable|string|max:100',
                'prenom' => 'nullable|string|max:100'
            ]);

            $result = $this->homeService->subscribeToNewsletter($validated);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Erreur inscription newsletter', [
                'error' => $e->getMessage(),
                'email' => $request->get('email')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription à la newsletter'
            ], 500);
        }
    }

    /**
     * Recherche rapide pour la barre de recherche
     */
    public function quickSearch(Request $request): JsonResponse
    {
        try {
            $query = $request->get('q');
            
            if (strlen($query) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'produits' => [],
                        'categories' => [],
                        'suggestions' => []
                    ]
                ]);
            }

            $results = $this->homeService->quickSearch($query);

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur recherche rapide', [
                'error' => $e->getMessage(),
                'query' => $request->get('q')
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche'
            ], 500);
        }
    }
}
