<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Commande;
use App\Services\Admin\PaiementService;
use App\Http\Requests\Admin\PaiementRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaiementController extends Controller
{
    protected PaiementService $paiementService;

    public function __construct(PaiementService $paiementService)
    {
        $this->paiementService = $paiementService;
    }

    /**
     * Liste tous les paiements (admin voit tout)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search');
            $statut = $request->get('statut');
            $methode = $request->get('methode');
            $dateDebut = $request->get('date_debut');
            $dateFin = $request->get('date_fin');
            $sort = $request->get('sort', 'created_at');
            $direction = $request->get('direction', 'desc');

            $query = Paiement::with(['commande', 'client']);

            // Recherche
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('reference_paiement', 'ILIKE', "%{$search}%")
                      ->orWhere('transaction_id', 'ILIKE', "%{$search}%")
                      ->orWhereHas('commande', function ($commandeQuery) use ($search) {
                          $commandeQuery->where('numero_commande', 'ILIKE', "%{$search}%");
                      })
                      ->orWhereHas('client', function ($clientQuery) use ($search) {
                          $clientQuery->where('nom', 'ILIKE', "%{$search}%")
                                    ->orWhere('prenom', 'ILIKE', "%{$search}%")
                                    ->orWhere('telephone', 'ILIKE', "%{$search}%");
                      });
                });
            }

            // Filtrer par statut
            if ($statut) {
                $query->where('statut', $statut);
            }

            // Filtrer par méthode
            if ($methode) {
                $query->where('methode_paiement', $methode);
            }

            // Filtrer par période
            if ($dateDebut) {
                $query->whereDate('created_at', '>=', $dateDebut);
            }
            if ($dateFin) {
                $query->whereDate('created_at', '<=', $dateFin);
            }

            // Tri
            $allowedSorts = ['reference_paiement', 'montant', 'statut', 'methode_paiement', 'created_at', 'date_validation'];
            if (in_array($sort, $allowedSorts)) {
                $query->orderBy($sort, $direction);
            }

            $paiements = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'paiements' => $paiements->map(function ($paiement) {
                        return $this->formatPaiementResponse($paiement);
                    }),
                    'pagination' => [
                        'current_page' => $paiements->currentPage(),
                        'per_page' => $paiements->perPage(),
                        'total' => $paiements->total(),
                        'last_page' => $paiements->lastPage(),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des paiements', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des paiements'
            ], 500);
        }
    }

    /**
     * Créer un nouveau paiement manuel (admin uniquement)
     */
    public function store(PaiementRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            
            // Ajouter l'information de confirmation immédiate si demandée
            if ($request->has('confirmer_immediatement')) {
                $validated['confirmer_immediatement'] = $request->boolean('confirmer_immediatement');
            }

            $paiement = $this->paiementService->createPaiement($validated);

            return response()->json([
                'success' => true,
                'message' => 'Paiement manuel créé avec succès',
                'data' => [
                    'paiement' => $this->formatPaiementResponse($paiement, true)
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du paiement manuel', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du paiement'
            ], 500);
        }
    }

    /**
     * Afficher un paiement spécifique
     */
    public function show(Paiement $paiement): JsonResponse
    {
        try {
            $paiement->load([
                'commande.articles_commandes.produit',
                'client'
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'paiement' => $this->formatPaiementResponse($paiement, true)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du paiement', [
                'paiement_id' => $paiement->id,
                'error' => $e->getMessage(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du paiement'
            ], 500);
        }
    }

    /**
     * Confirmer un paiement
     */
    public function confirm(Request $request, Paiement $paiement): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code_autorisation' => 'nullable|string|max:100',
                'message' => 'nullable|string|max:500',
                'notes_admin' => 'nullable|string|max:2000'
            ]);

            if ($paiement->statut === 'valide') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce paiement est déjà confirmé'
                ], 400);
            }

            $success = $this->paiementService->confirmerPaiement($paiement, $validated);

            if ($success) {
                // Ajouter les notes admin si fournies
                if (!empty($validated['notes_admin'])) {
                    $paiement->update(['notes_admin' => $validated['notes_admin']]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Paiement confirmé avec succès',
                    'data' => [
                        'paiement' => $this->formatPaiementResponse($paiement->fresh())
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la confirmation du paiement'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Erreur lors de la confirmation du paiement', [
                'paiement_id' => $paiement->id,
                'error' => $e->getMessage(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la confirmation du paiement'
            ], 500);
        }
    }

    /**
     * Rejeter un paiement
     */
    public function reject(Request $request, Paiement $paiement): JsonResponse
    {
        try {
            $validated = $request->validate([
                'raison' => 'required|string|max:500'
            ]);

            if ($paiement->statut === 'valide') {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de rejeter un paiement déjà validé'
                ], 400);
            }

            $success = $this->paiementService->rejeterPaiement($paiement, $validated['raison']);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Paiement rejeté avec succès'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors du rejet du paiement'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Erreur lors du rejet du paiement', [
                'paiement_id' => $paiement->id,
                'error' => $e->getMessage(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet du paiement'
            ], 500);
        }
    }

    /**
     * Rembourser un paiement
     */
    public function refund(Request $request, Paiement $paiement): JsonResponse
    {
        try {
            $validated = $request->validate([
                'montant' => 'required|numeric|min:1',
                'motif' => 'required|string|max:500'
            ]);

            if ($paiement->statut !== 'valide') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les paiements validés peuvent être remboursés'
                ], 400);
            }

            $success = $this->paiementService->rembourserPaiement(
                $paiement,
                $validated['montant'],
                $validated['motif']
            );

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Remboursement effectué avec succès',
                    'data' => [
                        'paiement' => $this->formatPaiementResponse($paiement->fresh())
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors du remboursement'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Erreur lors du remboursement', [
                'paiement_id' => $paiement->id,
                'error' => $e->getMessage(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du remboursement'
            ], 500);
        }
    }

    /**
     * Vérifier le statut d'un paiement externe (consultation uniquement)
     */
    public function checkStatus(Paiement $paiement): JsonResponse
    {
        try {
            // Vérifier que c'est un paiement externe
            if (!in_array($paiement->methode_paiement, ['wave', 'orange_money', 'carte_bancaire'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'La vérification de statut n\'est disponible que pour les paiements électroniques'
                ], 400);
            }

            $nouveauStatut = $this->paiementService->verifierStatutPaiement($paiement);

            return response()->json([
                'success' => true,
                'data' => [
                    'statut' => $nouveauStatut,
                    'paiement' => $this->formatPaiementResponse($paiement->fresh())
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification du statut', [
                'paiement_id' => $paiement->id,
                'error' => $e->getMessage(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification du statut'
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des paiements
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = $this->paiementService->getStatistics();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques paiements', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }

    /**
     * Obtenir les méthodes de paiement disponibles (focalisé admin)
     */
    public function paymentMethods(): JsonResponse
    {
        try {
            $methods = [
                [
                    'value' => 'especes',
                    'label' => 'Espèces',
                    'icon' => 'banknote',
                    'description' => 'Paiement en espèces au magasin',
                    'fees' => 0,
                    'active' => true,
                    'manual' => true
                ],
                [
                    'value' => 'cheque',
                    'label' => 'Chèque',
                    'icon' => 'file-text',
                    'description' => 'Paiement par chèque',
                    'fees' => 0,
                    'active' => true,
                    'manual' => true
                ],
                [
                    'value' => 'virement',
                    'label' => 'Virement bancaire',
                    'icon' => 'building-2',
                    'description' => 'Virement sur compte bancaire',
                    'fees' => 0,
                    'active' => true,
                    'manual' => true
                ],
                [
                    'value' => 'carte_bancaire',
                    'label' => 'Carte bancaire (terminal)',
                    'icon' => 'credit-card',
                    'description' => 'Terminal de paiement en magasin',
                    'fees' => 2.5,
                    'active' => true,
                    'manual' => true
                ],
                // Les méthodes suivantes sont pour information (paiements clients)
                [
                    'value' => 'wave',
                    'label' => 'Wave (client)',
                    'icon' => 'smartphone',
                    'description' => 'Paiement mobile initié par le client',
                    'fees' => 1.0,
                    'active' => false, // Non créable par admin
                    'manual' => false
                ],
                [
                    'value' => 'orange_money',
                    'label' => 'Orange Money (client)',
                    'icon' => 'smartphone',
                    'description' => 'Paiement mobile initié par le client',
                    'fees' => 1.5,
                    'active' => false, // Non créable par admin
                    'manual' => false
                ]
            ];

            // Filtrer pour ne montrer que les méthodes actives dans le formulaire
            $methodsForForm = array_filter($methods, fn($method) => $method['manual']);

            return response()->json([
                'success' => true,
                'data' => $methodsForForm
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération méthodes paiement', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des méthodes de paiement'
            ], 500);
        }
    }

    // ========== MÉTHODES PRIVÉES ==========

    /**
     * Formater la réponse d'un paiement
     */
    private function formatPaiementResponse(Paiement $paiement, bool $detailed = false): array
    {
        $data = [
            'id' => $paiement->id,
            'reference_paiement' => $paiement->reference_paiement,
            'transaction_id' => $paiement->transaction_id,
            'montant' => $paiement->montant,
            'methode_paiement' => $paiement->methode_paiement,
            'methode_label' => $this->getMethodeLabel($paiement->methode_paiement),
            'statut' => $paiement->statut,
            'statut_label' => $this->getStatutLabel($paiement->statut),
            'est_acompte' => $paiement->est_acompte,
            'montant_restant' => $paiement->montant_restant,
            'montant_rembourse' => $paiement->montant_rembourse,
            'numero_telephone' => $paiement->numero_telephone,
            'date_initiation' => $paiement->date_initiation?->format('d/m/Y H:i'),
            'date_validation' => $paiement->date_validation?->format('d/m/Y H:i'),
            'date_echeance' => $paiement->date_echeance?->format('d/m/Y'),
            'message_retour' => $paiement->message_retour,
            'is_manual' => in_array($paiement->methode_paiement, ['especes', 'cheque', 'virement']),
            'commande' => $paiement->commande ? [
                'id' => $paiement->commande->id,
                'numero_commande' => $paiement->commande->numero_commande,
                'montant_total' => $paiement->commande->montant_total
            ] : null,
            'client' => $paiement->client ? [
                'id' => $paiement->client->id,
                'nom_complet' => $paiement->client->nom . ' ' . $paiement->client->prenom,
                'telephone' => $paiement->client->telephone,
                'email' => $paiement->client->email
            ] : null
        ];

        if ($detailed) {
            $data = array_merge($data, [
                'code_autorisation' => $paiement->code_autorisation,
                'notes_admin' => $paiement->notes_admin,
                'commentaire_client' => $paiement->commentaire_client,
                'date_remboursement' => $paiement->date_remboursement?->format('d/m/Y H:i'),
                'motif_remboursement' => $paiement->motif_remboursement,
                'donnees_api' => $paiement->donnees_api ? json_decode($paiement->donnees_api, true) : null
            ]);
        }

        return $data;
    }

    /**
     * Obtenir le libellé de la méthode
     */
    private function getMethodeLabel(string $methode): string
    {
        $labels = [
            'carte_bancaire' => 'Carte bancaire',
            'wave' => 'Wave',
            'orange_money' => 'Orange Money',
            'virement' => 'Virement',
            'especes' => 'Espèces',
            'cheque' => 'Chèque'
        ];

        return $labels[$methode] ?? $methode;
    }

    /**
     * Obtenir le libellé du statut
     */
    private function getStatutLabel(string $statut): string
    {
        $labels = [
            'en_attente' => 'En attente',
            'en_cours' => 'En cours',
            'valide' => 'Validé',
            'echec' => 'Échec',
            'rembourse' => 'Remboursé',
            'partiel_rembourse' => 'Partiellement remboursé',
            'annule' => 'Annulé'
        ];

        return $labels[$statut] ?? $statut;
    }
}