<?php
namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\Client\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    protected ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    public function index(): JsonResponse
    {
        try {
            $categories = Category::where('est_active', true)
                ->whereNull('parent_id')
                ->withCount('produits')
                ->orderBy('ordre_affichage')
                ->get()
                ->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'nom' => $category->nom,
                        'slug' => $category->slug,
                        'description' => $category->description,
                        'image' => $category->image ? asset('storage/' . $category->image) : null,
                        'produits_count' => $category->produits_count,
                        'url' => "/categories/{$category->slug}"
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des catégories'
            ], 500);
        }
    }

   public function show(string $slug): JsonResponse
{
    try {
        $category = Category::where('slug', $slug)
            ->where('est_active', true)
            ->first();

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Catégorie non trouvée'
            ], 404);
        }

        // Compter TOUS les produits visibles de cette catégorie
        $produitsCount = \App\Models\Produit::where('est_visible', true)
            ->where('categorie_id', $category->id)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $category->id,
                'nom' => $category->nom,
                'slug' => $category->slug,
                'description' => $category->description,
                'image' => $category->image ? asset('storage/' . $category->image) : null,
                'produits_count' => $produitsCount  // Le vrai compteur
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors du chargement de la catégorie'
        ], 500);
    }
}

    public function getProducts(string $slug, Request $request): JsonResponse
{
    try {
        $category = Category::where('slug', $slug)
            ->where('est_active', true)
            ->first();

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Catégorie non trouvée'
            ], 404);
        }

        $filters = $request->only([
            'search', 'min_price', 'max_price', 'on_sale', 
            'sort', 'direction', 'per_page'
        ]);
        $filters['category'] = $category->id;

        $result = $this->productService->getProducts($filters);

        \Log::info('📦 CategoryController - Résultat products:', [
            'category_id' => $category->id,
            'category_slug' => $slug,
            'filters' => $filters,
            'products_count' => count($result['products'] ?? []),
            'products_keys' => array_keys($result),
            'first_product' => $result['products'][0] ?? null
        ]);

        return response()->json([
            'success' => true,
            'data' => $result
        ]);

    } catch (\Exception $e) {
        \Log::error('Erreur getProducts:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors du chargement des produits'
        ], 500);
    }
}
}
