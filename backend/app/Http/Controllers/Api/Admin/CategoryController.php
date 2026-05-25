<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Http\Requests\Admin\CategoryRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Liste toutes les catégories
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');
            $sort = $request->get('sort', 'ordre_affichage');
            $direction = $request->get('direction', 'asc');

            $query = Category::withCount('produits');

            // Recherche
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'ILIKE', "%{$search}%")
                      ->orWhere('description', 'ILIKE', "%{$search}%");
                });
            }

            // Tri
            $allowedSorts = ['nom', 'ordre_affichage', 'created_at', 'produits_count'];
            if (in_array($sort, $allowedSorts)) {
                $query->orderBy($sort, $direction);
            }

            $categories = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => $categories->map(function ($category) {
                        return [
                            'id' => $category->id,
                            'nom' => $category->nom,
                            'slug' => $category->slug,
                            'description' => $category->description,
                            'image' => $category->image ? asset('storage/' . $category->image) : null,
                            'parent_id' => $category->parent_id,
                            'ordre_affichage' => $category->ordre_affichage,
                            'est_active' => $category->est_active,
                            'est_populaire' => $category->est_populaire,
                            'couleur_theme' => $category->couleur_theme,
                            'produits_count' => $category->produits_count,
                            'created_at' => $category->created_at->format('d/m/Y H:i'),
                            'updated_at' => $category->updated_at->format('d/m/Y H:i'),
                        ];
                    }),
                    'pagination' => [
                        'current_page' => $categories->currentPage(),
                        'per_page' => $categories->perPage(),
                        'total' => $categories->total(),
                        'last_page' => $categories->lastPage(),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des catégories', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des catégories'
            ], 500);
        }
    }

    /**
     * Créer une nouvelle catégorie
     */
    public function store(CategoryRequest $request): JsonResponse
    {
        try {
            $validatedData = $request->validated();
            
            // Génération du slug
            $validatedData['slug'] = Str::slug($validatedData['nom']);
            
            // Vérifier l'unicité du slug
            $originalSlug = $validatedData['slug'];
            $counter = 1;
            while (Category::where('slug', $validatedData['slug'])->exists()) {
                $validatedData['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }

            // Gestion de l'image
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('categories', 'public');
                $validatedData['image'] = $imagePath;
            }

            $category = Category::create($validatedData);

            Log::info('Nouvelle catégorie créée', [
                'category_id' => $category->id,
                'nom' => $category->nom,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie créée avec succès',
                'data' => [
                    'category' => [
                        'id' => $category->id,
                        'nom' => $category->nom,
                        'slug' => $category->slug,
                        'description' => $category->description,
                        'image' => $category->image ? asset('storage/' . $category->image) : null,
                        'parent_id' => $category->parent_id,
                        'ordre_affichage' => $category->ordre_affichage,
                        'est_active' => $category->est_active,
                        'est_populaire' => $category->est_populaire,
                        'couleur_theme' => $category->couleur_theme,
                        'created_at' => $category->created_at->format('d/m/Y H:i'),
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la catégorie', [
                'error' => $e->getMessage(),
                'data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la catégorie'
            ], 500);
        }
    }

    /**
     * Afficher une catégorie spécifique
     */
    public function show(Category $category): JsonResponse
    {
        try {
            $category->load([
                'produits' => function ($query) {
                    $query->where('est_visible', true);
                },
                'categories' => function ($query) {
                    $query->where('est_active', true);
                }
            ]);

            // Statistiques détaillées
            $produitsVisibles = $category->produits->where('est_visible', true)->count();
            $produitsTotalBD = $category->produits()->count();
            $produitsEnStock = $category->produits->where('stock_disponible', '>', 0)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'category' => [
                        'id' => $category->id,
                        'nom' => $category->nom,
                        'slug' => $category->slug,
                        'description' => $category->description,
                        'image' => $category->image ? asset('storage/' . $category->image) : null,
                        'parent_id' => $category->parent_id,
                        'ordre_affichage' => $category->ordre_affichage,
                        'est_active' => $category->est_active,
                        'est_populaire' => $category->est_populaire,
                        'couleur_theme' => $category->couleur_theme,
                        'meta_donnees' => $category->meta_donnees ? json_decode($category->meta_donnees) : null,
                        'statistics' => [
                            'produits_total' => $produitsTotalBD,
                            'produits_visibles' => $produitsVisibles,
                            'produits_en_stock' => $produitsEnStock,
                            'sous_categories' => $category->categories->count(),
                            'visibilite_cote_client' => [
                                'est_visible' => $category->est_active && $produitsVisibles > 0,
                                'raison' => $this->getVisibilityReason($category, $produitsVisibles)
                            ]
                        ],
                        'sous_categories' => $category->categories->map(function ($cat) {
                            return [
                                'id' => $cat->id,
                                'nom' => $cat->nom,
                                'slug' => $cat->slug,
                                'est_active' => $cat->est_active,
                            ];
                        }),
                        'produits_count' => $produitsVisibles,
                        'produits' => $category->produits->take(10)->map(function ($produit) {
                            return [
                                'id' => $produit->id,
                                'nom' => $produit->nom,
                                'slug' => $produit->slug,
                                'prix' => $produit->prix,
                                'image_principale' => $produit->image_principale ? asset('storage/' . $produit->image_principale) : null,
                                'stock_disponible' => $produit->stock_disponible,
                                'est_visible' => $produit->est_visible,
                            ];
                        }),
                        'created_at' => $category->created_at->format('d/m/Y H:i'),
                        'updated_at' => $category->updated_at->format('d/m/Y H:i'),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de la catégorie', [
                'category_id' => $category->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la catégorie'
            ], 500);
        }
    }

    /**
     * Mettre à jour une catégorie
     */
    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        try {
            $validatedData = $request->validated();
            
            // Mise à jour du slug si le nom change
            if (isset($validatedData['nom']) && $validatedData['nom'] !== $category->nom) {
                $newSlug = Str::slug($validatedData['nom']);
                
                // Vérifier l'unicité du slug (sauf pour cette catégorie)
                $originalSlug = $newSlug;
                $counter = 1;
                while (Category::where('slug', $newSlug)->where('id', '!=', $category->id)->exists()) {
                    $newSlug = $originalSlug . '-' . $counter;
                    $counter++;
                }
                
                $validatedData['slug'] = $newSlug;
            }

            // Gestion de l'image
            if ($request->hasFile('image')) {
                // Supprimer l'ancienne image
                if ($category->image && Storage::disk('public')->exists($category->image)) {
                    Storage::disk('public')->delete($category->image);
                }
                
                $imagePath = $request->file('image')->store('categories', 'public');
                $validatedData['image'] = $imagePath;
            }

            $category->update($validatedData);

            Log::info('Catégorie mise à jour', [
                'category_id' => $category->id,
                'nom' => $category->nom,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie mise à jour avec succès',
                'data' => [
                    'category' => [
                        'id' => $category->id,
                        'nom' => $category->nom,
                        'slug' => $category->slug,
                        'description' => $category->description,
                        'image' => $category->image ? asset('storage/' . $category->image) : null,
                        'parent_id' => $category->parent_id,
                        'ordre_affichage' => $category->ordre_affichage,
                        'est_active' => $category->est_active,
                        'est_populaire' => $category->est_populaire,
                        'couleur_theme' => $category->couleur_theme,
                        'updated_at' => $category->updated_at->format('d/m/Y H:i'),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de la catégorie', [
                'category_id' => $category->id,
                'error' => $e->getMessage(),
                'data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la catégorie'
            ], 500);
        }
    }

    /**
     * Supprimer une catégorie
     */
    public function destroy(Category $category): JsonResponse
    {
        try {
            // Vérifier s'il y a des produits associés
            $produitsCount = $category->produits()->count();
            
            if ($produitsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de supprimer cette catégorie car elle contient {$produitsCount} produit(s). Veuillez d'abord déplacer ou supprimer les produits."
                ], 400);
            }

            // Supprimer l'image si elle existe
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }

            $categoryName = $category->nom;
            $category->delete();

            Log::info('Catégorie supprimée', [
                'category_name' => $categoryName,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de la catégorie', [
                'category_id' => $category->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la catégorie'
            ], 500);
        }
    }

    /**
     * Liste des catégories pour les sélecteurs (dropdown)
     */
    public function options(): JsonResponse
    {
        try {
            $categories = Category::where('est_active', true)
                ->orderBy('ordre_affichage')
                ->get(['id', 'nom', 'parent_id']);

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des options de catégories', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des catégories'
            ], 500);
        }
    }

    /**
     * Activer/Désactiver une catégorie
     */
    public function toggleStatus(Category $category): JsonResponse
    {
        try {
            $category->update(['est_active' => !$category->est_active]);

            $status = $category->est_active ? 'activée' : 'désactivée';
            
            // Vérifier la visibilité côté client après changement
            $produitsVisibles = $category->produits()->where('est_visible', true)->count();
            $seraVisibleClient = $category->est_active && $produitsVisibles > 0;

            Log::info("Catégorie {$status}", [
                'category_id' => $category->id,
                'nom' => $category->nom,
                'sera_visible_client' => $seraVisibleClient,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => "Catégorie {$status} avec succès",
                'data' => [
                    'category' => [
                        'id' => $category->id,
                        'nom' => $category->nom,
                        'est_active' => $category->est_active,
                        'visibilite_client' => [
                            'sera_visible' => $seraVisibleClient,
                            'raison' => $this->getVisibilityReason($category, $produitsVisibles)
                        ]
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du changement de statut de la catégorie', [
                'category_id' => $category->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut'
            ], 500);
        }
    }

    /**
     * Retourne la raison pour laquelle une catégorie est/n'est pas visible côté client
     */
    private function getVisibilityReason(Category $category, int $produitsVisibles): string
    {
        if (!$category->est_active) {
            return 'Catégorie désactivée';
        }
        
        if ($produitsVisibles === 0) {
            return 'Aucun produit visible dans cette catégorie';
        }
        
        return 'Catégorie visible côté client';
    }
}