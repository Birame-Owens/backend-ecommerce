<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Services\Admin\ClientService;
use App\Http\Requests\Admin\ClientRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ClientController extends Controller
{
    protected ClientService $clientService;

    public function __construct(ClientService $clientService)
    {
        $this->clientService = $clientService;
    }

    /**
     * Liste tous les clients
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search');
            $typeClient = $request->get('type_client');
            $ville = $request->get('ville');
            $accepteWhatsapp = $request->get('accepte_whatsapp');
            $sort = $request->get('sort', 'created_at');
            $direction = $request->get('direction', 'desc');

            $query = Client::with(['commandes' => function ($q) {
                $q->latest()->limit(3);
            }]);

            // Recherche
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'ILIKE', "%{$search}%")
                      ->orWhere('prenom', 'ILIKE', "%{$search}%")
                      ->orWhere('telephone', 'ILIKE', "%{$search}%")
                      ->orWhere('email', 'ILIKE', "%{$search}%");
                });
            }

            // Filtrer par type de client
            if ($typeClient) {
                $query->where('type_client', $typeClient);
            }

            // Filtrer par ville
            if ($ville) {
                $query->where('ville', $ville);
            }

            // Filtrer par acceptation WhatsApp
            if ($accepteWhatsapp !== null) {
                $query->where('accepte_whatsapp', $accepteWhatsapp === 'true');
            }

            // Tri
            $allowedSorts = ['nom', 'prenom', 'telephone', 'ville', 'type_client', 'score_fidelite', 'total_depense', 'created_at', 'derniere_visite'];
            if (in_array($sort, $allowedSorts)) {
                $query->orderBy($sort, $direction);
            }

            $clients = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'clients' => $clients->map(function ($client) {
                        return $this->formatClientResponse($client);
                    }),
                    'pagination' => [
                        'current_page' => $clients->currentPage(),
                        'per_page' => $clients->perPage(),
                        'total' => $clients->total(),
                        'last_page' => $clients->lastPage(),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des clients', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients'
            ], 500);
        }
    }

    /**
     * Créer un nouveau client
     */
    public function store(ClientRequest $request): JsonResponse
    {
        try {
            $client = $this->clientService->createClient($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Client créé avec succès',
                'data' => [
                    'client' => $this->formatClientResponse($client, true)
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du client', [
                'error' => $e->getMessage(),
                'data' => $request->validated()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du client'
            ], 500);
        }
    }

    /**
     * Afficher un client spécifique
     */
    public function show(Client $client): JsonResponse
    {
        try {
            $client->load([
                'commandes.articles_commandes.produit',
                'commandes.paiements',
                'messages_whatsapps' => function ($q) {
                    $q->latest()->limit(10);
                },
                'avis_clients.produit'
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'client' => $this->formatClientResponse($client, true)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du client', [
                'client_id' => $client->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du client'
            ], 500);
        }
    }

    /**
     * Mettre à jour un client
     */
    public function update(ClientRequest $request, Client $client): JsonResponse
    {
        try {
            $updatedClient = $this->clientService->updateClient($client, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Client mis à jour avec succès',
                'data' => [
                    'client' => $this->formatClientResponse($updatedClient, true)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour du client', [
                'client_id' => $client->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du client'
            ], 500);
        }
    }

    /**
     * Supprimer un client
     */
    public function destroy(Client $client): JsonResponse
    {
        try {
            // Vérifier si le client a des commandes
            if ($client->commandes()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer un client qui a des commandes'
                ], 400);
            }

            $client->delete();

            Log::info('Client supprimé', [
                'client_id' => $client->id,
                'nom' => $client->nom . ' ' . $client->prenom,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Client supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression du client', [
                'client_id' => $client->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du client'
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des clients
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = $this->clientService->getStatistics();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques clients', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }

    /**
     * Envoyer un message WhatsApp à un client
     */
    public function sendWhatsApp(Request $request, Client $client): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:1000',
                'type' => 'nullable|string|in:notification,promotion,service'
            ]);

            if (!$client->accepte_whatsapp) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce client n\'accepte pas les messages WhatsApp'
                ], 400);
            }

            $success = $this->clientService->sendWhatsAppMessage(
                $client,
                $validated['message'],
                $validated['type'] ?? 'notification'
            );

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Message WhatsApp envoyé avec succès'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'envoi du message WhatsApp'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Erreur envoi WhatsApp individuel', [
                'client_id' => $client->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi du message'
            ], 500);
        }
    }

    /**
     * Envoyer une notification de nouveauté à plusieurs clients
     */
    public function sendNoveltyNotification(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:1000',
                'client_ids' => 'nullable|array',
                'client_ids.*' => 'integer|exists:clients,id',
                'filters' => 'nullable|array',
                'filters.type_client' => 'nullable|array',
                'filters.type_client.*' => 'string|in:nouveau,regulier,fidele,vip',
                'filters.ville' => 'nullable|array',
                'filters.ville.*' => 'string',
                'filters.score_fidelite_min' => 'nullable|integer|min:0'
            ]);

            $results = $this->clientService->sendNoveltyNotification(
                $validated['message'],
                $validated['client_ids'] ?? [],
                $validated['filters'] ?? []
            );

            return response()->json([
                'success' => true,
                'message' => 'Notification envoyée',
                'data' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi notification nouveauté', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi de la notification'
            ], 500);
        }
    }

    /**
     * Obtenir les clients VIP
     */
    public function vipClients(): JsonResponse
    {
        try {
            $clients = $this->clientService->getClientsVIP();

            return response()->json([
                'success' => true,
                'data' => [
                    'clients' => $clients->map(function ($client) {
                        return $this->formatClientResponse($client);
                    })
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération clients VIP', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients VIP'
            ], 500);
        }
    }

    /**
     * Obtenir les clients inactifs
     */
    public function inactiveClients(): JsonResponse
    {
        try {
            $clients = $this->clientService->getClientsInactifs();

            return response()->json([
                'success' => true,
                'data' => [
                    'clients' => $clients->map(function ($client) {
                        return $this->formatClientResponse($client);
                    })
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération clients inactifs', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des clients inactifs'
            ], 500);
        }
    }

    /**
     * Rechercher des clients
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'type_client' => 'nullable|string|in:nouveau,regulier,fidele,vip',
                'ville' => 'nullable|string|max:100',
                'accepte_whatsapp' => 'nullable|boolean'
            ]);

            $clients = $this->clientService->searchClients($validated);

            return response()->json([
                'success' => true,
                'data' => [
                    'clients' => $clients->map(function ($client) {
                        return $this->formatClientResponse($client);
                    })
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur recherche clients', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche'
            ], 500);
        }
    }

    // ========== MÉTHODES PRIVÉES ==========

    /**
     * Formater la réponse d'un client
     */
    private function formatClientResponse(Client $client, bool $detailed = false): array
    {
        $data = [
            'id' => $client->id,
            'nom' => $client->nom,
            'prenom' => $client->prenom,
            'nom_complet' => $client->nom . ' ' . $client->prenom,
            'telephone' => $client->telephone,
            'email' => $client->email,
            'genre' => $client->genre,
            'ville' => $client->ville,
            'quartier' => $client->quartier,
            'type_client' => $client->type_client,
            'type_client_label' => $this->getTypeClientLabel($client->type_client),
            'score_fidelite' => $client->score_fidelite,
            'nombre_commandes' => $client->nombre_commandes,
            'total_depense' => $client->total_depense,
            'panier_moyen' => $client->panier_moyen,
            'priorite' => $client->priorite,
            'accepte_whatsapp' => $client->accepte_whatsapp,
            'accepte_email' => $client->accepte_email,
            'accepte_promotions' => $client->accepte_promotions,
            'derniere_commande' => $client->derniere_commande?->format('d/m/Y'),
            'derniere_visite' => $client->derniere_visite?->format('d/m/Y H:i'),
            'date_creation' => $client->created_at->format('d/m/Y'),
            'whatsapp_url' => $this->generateWhatsAppUrl($client->telephone),
            'age' => $client->date_naissance ? $client->date_naissance->age : null,
            'est_vip' => $client->type_client === 'vip' || $client->score_fidelite >= 1000,
            'est_inactif' => $client->derniere_visite ? $client->derniere_visite->diffInDays(now()) > 90 : true
        ];

        if ($detailed) {
            $data = array_merge($data, [
                'date_naissance' => $client->date_naissance?->format('d/m/Y'),
                'adresse_principale' => $client->adresse_principale,
                'indications_livraison' => $client->indications_livraison,
                'taille_habituelle' => $client->taille_habituelle,
                'couleurs_preferees' => $client->couleurs_preferees,
                'styles_preferes' => $client->styles_preferes,
                'budget_moyen' => $client->budget_moyen,
                'accepte_sms' => $client->accepte_sms,
                'canaux_preferes' => $client->canaux_preferes,
                'notes_privees' => $client->notes_privees,
                'commandes_recentes' => $client->commandes->map(function ($commande) {
                    return [
                        'id' => $commande->id,
                        'numero_commande' => $commande->numero_commande,
                        'montant_total' => $commande->montant_total,
                        'statut' => $commande->statut,
                        'date_commande' => $commande->created_at->format('d/m/Y')
                    ];
                }),
                'messages_whatsapp' => $client->messages_whatsapps->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'message' => $message->message,
                        'type' => $message->type,
                        'statut' => $message->statut,
                        'date_envoi' => $message->date_envoi->format('d/m/Y H:i')
                    ];
                }),
                'avis' => $client->avis_clients->map(function ($avis) {
                    return [
                        'id' => $avis->id,
                        'note_globale' => $avis->note_globale,
                        'commentaire' => $avis->commentaire,
                        'produit' => $avis->produit->nom ?? null,
                        'date' => $avis->created_at->format('d/m/Y')
                    ];
                })
            ]);
        }

        return $data;
    }

    /**
     * Obtenir le libellé du type de client
     */
    private function getTypeClientLabel(string $type): string
    {
        $labels = [
            'nouveau' => 'Nouveau',
            'regulier' => 'Régulier',
            'fidele' => 'Fidèle',
            'vip' => 'VIP'
        ];

        return $labels[$type] ?? $type;
    }

    /**
     * Générer l'URL WhatsApp
     */
    private function generateWhatsAppUrl(string $telephone): string
    {
        // Nettoyer le numéro
        $phone = preg_replace('/[^0-9]/', '', $telephone);
        
        // Ajouter l'indicatif du Sénégal si nécessaire
        if (strlen($phone) === 9 && substr($phone, 0, 1) === '7') {
            $phone = '221' . $phone;
        } elseif (strlen($phone) === 10 && substr($phone, 0, 2) === '07') {
            $phone = '221' . substr($phone, 1);
        }

        return "https://wa.me/{$phone}";
    }
}