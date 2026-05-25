<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Données principales du dashboard
     */
    public function index(Request $request): JsonResponse
    {
        try {
            Log::info('Chargement du dashboard', ['user_id' => auth()->id()]);

            // Cache pour optimiser les performances (5 minutes)
            $cacheKey = 'dashboard_main_' . auth()->id();
            
            $data = Cache::remember($cacheKey, 300, function () {
                return $this->dashboardService->getDashboardStats();
            });

            // Ajouter timestamp pour le frontend
            $data['timestamp'] = now()->toISOString();
            $data['cache_expires_at'] = now()->addMinutes(5)->toISOString();

            return response()->json([
                'success' => true,
                'message' => 'Dashboard chargé avec succès',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dashboard principal', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement du dashboard',
                'error_code' => 'DASHBOARD_LOAD_ERROR'
            ], 500);
        }
    }

    /**
     * Statistiques rapides (utilisées pour les updates en temps réel)
     */
    public function quickStats(Request $request): JsonResponse
    {
        try {
            $cacheKey = 'dashboard_quick_' . auth()->id();
            
            $stats = Cache::remember($cacheKey, 60, function () {
                return $this->dashboardService->getQuickStats();
            });

            return response()->json([
                'success' => true,
                'data' => $stats,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur stats rapides', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques rapides'
            ], 500);
        }
    }

    /**
     * Données pour les graphiques
     */
    public function chartsData(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', '30');
            
            $data = [
                'sales_evolution' => $this->dashboardService->getSalesChartData(),
                'top_products' => $this->dashboardService->getPopularProducts(8),
                'categories_performance' => $this->dashboardService->getTopCategories(),
                'orders_by_status' => $this->getOrdersByStatus(),
                'revenue_comparison' => $this->getRevenueComparison(),
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'period' => $period
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur données graphiques', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des graphiques'
            ], 500);
        }
    }

    /**
     * Alertes et notifications
     */
    public function alerts(Request $request): JsonResponse
    {
        try {
            $alerts = [
                'stock_alerts' => [
                    'low_stock' => $this->dashboardService->getLowStockProducts(10),
                    'out_of_stock' => $this->getOutOfStockProducts(),
                    'critical_count' => $this->dashboardService->getCriticalStockCount()
                ],
                'order_alerts' => [
                    'pending_orders' => $this->getPendingOrdersCount(),
                    'overdue_orders' => $this->getOverdueOrdersCount(),
                    'production_delays' => $this->getProductionDelays()
                ],
                'business_alerts' => [
                    'new_reviews' => $this->getPendingReviewsCount(),
                    'payment_issues' => $this->getPaymentIssuesCount(),
                    'inventory_value' => $this->getInventoryValue()
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $alerts
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur alertes', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des alertes'
            ], 500);
        }
    }

    /**
     * Actualiser le cache du dashboard
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            // Vider tous les caches liés au dashboard
            $cacheKeys = [
                'dashboard_main_' . $userId,
                'dashboard_quick_' . $userId,
                'dashboard_charts_' . $userId,
                'dashboard_alerts_' . $userId
            ];
            
            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            // Recharger les données
            $data = $this->dashboardService->getDashboardStats();
            $data['timestamp'] = now()->toISOString();

            Log::info('Dashboard actualisé', ['user_id' => $userId]);

            return response()->json([
                'success' => true,
                'message' => 'Dashboard actualisé avec succès',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur actualisation dashboard', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'actualisation'
            ], 500);
        }
    }

    /**
     * Activités récentes détaillées
     */
    public function recentActivities(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 20);
            $type = $request->get('type', 'all'); // all, orders, clients, products, payments

            $activities = $this->dashboardService->getRecentActivities($limit);

            // Filtrer par type si spécifié
            if ($type !== 'all') {
                $activities = array_filter($activities, function($activity) use ($type) {
                    return $activity['type'] === $type;
                });
                $activities = array_values($activities);
            }

            return response()->json([
                'success' => true,
                'data' => $activities,
                'total' => count($activities)
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur activités récentes', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des activités'
            ], 500);
        }
    }

    /**
     * Métriques de performance
     */
    public function performanceMetrics(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'month'); // week, month, quarter, year
            
            $metrics = $this->dashboardService->getPerformanceMetrics();
            
            // Ajouter des métriques spécifiques à la période
            $metrics['period_data'] = $this->getPerformanceByPeriod($period);

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'period' => $period
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur métriques performance', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des métriques'
            ], 500);
        }
    }

    /**
     * Résumé exécutif pour la direction
     */
    public function executiveSummary(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'month');
            
            $summary = [
                'key_metrics' => [
                    'total_revenue' => $this->getTotalRevenue($period),
                    'revenue_growth' => $this->getRevenueGrowth($period),
                    'customer_acquisition' => $this->getCustomerAcquisition($period),
                    'order_fulfillment_rate' => $this->getOrderFulfillmentRate($period),
                    'inventory_turnover' => $this->getInventoryTurnover($period)
                ],
                'top_performers' => [
                    'best_selling_products' => $this->dashboardService->getPopularProducts(5),
                    'top_categories' => $this->dashboardService->getTopCategories(5),
                    'vip_customers' => $this->getTopCustomers(5)
                ],
                'areas_of_concern' => [
                    'low_stock_items' => count($this->dashboardService->getLowStockProducts()),
                    'overdue_orders' => $this->getOverdueOrdersCount(),
                    'customer_complaints' => $this->getCustomerComplaints(),
                    'return_rate' => $this->getReturnRate($period)
                ],
                'recommendations' => $this->generateRecommendations()
            ];

            return response()->json([
                'success' => true,
                'data' => $summary,
                'period' => $period,
                'generated_at' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur résumé exécutif', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du résumé'
            ], 500);
        }
    }

    // ========== MÉTHODES PRIVÉES POUR LES CALCULS ==========

    private function getOrdersByStatus(): array
    {
        return \DB::table('commandes')
            ->select('statut', \DB::raw('COUNT(*) as count'))
            ->groupBy('statut')
            ->pluck('count', 'statut')
            ->toArray();
    }

    private function getRevenueComparison(): array
    {
        $thisMonth = \DB::table('paiements')
            ->where('statut', 'valide')
            ->whereMonth('created_at', now()->month)
            ->sum('montant');

        $lastMonth = \DB::table('paiements')
            ->where('statut', 'valide')
            ->whereMonth('created_at', now()->subMonth()->month)
            ->sum('montant');

        return [
            'current' => (float) $thisMonth,
            'previous' => (float) $lastMonth,
            'growth' => $lastMonth > 0 ? (($thisMonth - $lastMonth) / $lastMonth) * 100 : 0
        ];
    }

    private function getOutOfStockProducts(): array
    {
        return \DB::table('produits as p')
            ->leftJoin('stocks as s', function($join) {
                $join->on('p.id', '=', 's.produit_id')
                     ->whereRaw('s.id = (SELECT MAX(id) FROM stocks WHERE produit_id = p.id)');
            })
            ->select('p.nom', 'p.prix_vente', \DB::raw('COALESCE(s.quantite_apres, 0) as stock'))
            ->whereRaw('COALESCE(s.quantite_apres, 0) = 0')
            ->limit(10)
            ->get()
            ->toArray();
    }

    private function getPendingOrdersCount(): int
    {
        return \App\Models\Commande::where('statut', 'en_attente')->count();
    }

    private function getOverdueOrdersCount(): int
    {
        return \App\Models\Commande::where('statut', 'en_production')
            ->where('date_fin_prevue', '<', now())
            ->count();
    }

    private function getProductionDelays(): array
    {
        return \DB::table('commandes')
            ->select('numero_commande', 'date_fin_prevue', 'statut')
            ->where('statut', 'en_production')
            ->where('date_fin_prevue', '<', now())
            ->limit(5)
            ->get()
            ->toArray();
    }

    private function getPendingReviewsCount(): int
    {
        return \App\Models\AvisClient::where('statut', 'en_attente')->count();
    }

    private function getPaymentIssuesCount(): int
    {
        return \App\Models\Paiement::where('statut', 'echoue')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();
    }

    private function getInventoryValue(): float
    {
        return (float) \DB::table('produits as p')
            ->leftJoin('stocks as s', function($join) {
                $join->on('p.id', '=', 's.produit_id')
                     ->whereRaw('s.id = (SELECT MAX(id) FROM stocks WHERE produit_id = p.id)');
            })
            ->select(\DB::raw('SUM(COALESCE(s.quantite_apres, 0) * p.prix_achat) as total'))
            ->value('total') ?? 0;
    }

    private function getTotalRevenue(string $period): float
    {
        $query = \DB::table('paiements')->where('statut', 'valide');
        
        switch ($period) {
            case 'week':
                $query->where('created_at', '>=', now()->startOfWeek());
                break;
            case 'month':
                $query->where('created_at', '>=', now()->startOfMonth());
                break;
            case 'quarter':
                $query->where('created_at', '>=', now()->startOfQuarter());
                break;
            case 'year':
                $query->where('created_at', '>=', now()->startOfYear());
                break;
        }

        return (float) $query->sum('montant');
    }

    private function getRevenueGrowth(string $period): float
    {
        // Logique similaire pour calculer la croissance
        // ... implémentation selon vos besoins
        return 0.0;
    }

    private function getCustomerAcquisition(string $period): int
    {
        $query = \App\Models\Client::query();
        
        switch ($period) {
            case 'week':
                $query->where('created_at', '>=', now()->startOfWeek());
                break;
            case 'month':
                $query->where('created_at', '>=', now()->startOfMonth());
                break;
        }

        return $query->count();
    }

    private function getOrderFulfillmentRate(string $period): float
    {
        $total = \App\Models\Commande::where('created_at', '>=', now()->startOfMonth())->count();
        $completed = \App\Models\Commande::where('created_at', '>=', now()->startOfMonth())
            ->where('statut', 'livree')->count();

        return $total > 0 ? ($completed / $total) * 100 : 0;
    }

    private function getInventoryTurnover(string $period): float
    {
        // Calcul du taux de rotation des stocks
        return 0.0;
    }

    private function getTopCustomers(int $limit): array
    {
        return \DB::table('clients as c')
            ->join('commandes as co', 'c.id', '=', 'co.client_id')
            ->select('c.nom', 'c.prenom', \DB::raw('SUM(co.montant_total) as total_achats'), \DB::raw('COUNT(co.id) as nb_commandes'))
            ->where('co.statut', '!=', 'annulee')
            ->groupBy('c.id', 'c.nom', 'c.prenom')
            ->orderBy('total_achats', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    private function getCustomerComplaints(): int
    {
        return \App\Models\AvisClient::where('note_globale', '<=', 2)
            ->where('created_at', '>=', now()->subMonth())
            ->count();
    }

    private function getReturnRate(string $period): float
    {
        // Calcul du taux de retour
        return 0.0;
    }

    private function generateRecommendations(): array
    {
        $recommendations = [];

        // Recommandation stock faible
        $lowStockCount = count($this->dashboardService->getLowStockProducts());
        if ($lowStockCount > 0) {
            $recommendations[] = [
                'type' => 'stock',
                'priority' => 'high',
                'title' => 'Réapprovisionner les produits en stock faible',
                'description' => "{$lowStockCount} produits ont un stock critique",
                'action' => 'Consulter la liste des produits en stock faible'
            ];
        }

        // Recommandation commandes en retard
        $overdueOrders = $this->getOverdueOrdersCount();
        if ($overdueOrders > 0) {
            $recommendations[] = [
                'type' => 'production',
                'priority' => 'high',
                'title' => 'Traiter les commandes en retard',
                'description' => "{$overdueOrders} commandes dépassent leur date prévue",
                'action' => 'Réviser la planification de production'
            ];
        }

        return $recommendations;
    }

    private function getPerformanceByPeriod(string $period): array
    {
        // Retourner des données de performance selon la période
        return [
            'sales_trend' => [],
            'customer_satisfaction' => 0,
            'operational_efficiency' => 0
        ];
    }
}