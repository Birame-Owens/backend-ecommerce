import api from '@/lib/axios'
import type {
  AdminReportAlerte,
  AdminReportAnalytics,
  AdminReportCatalog,
  AdminReportClients,
  AdminReportCommandes,
  AdminReportDashboard,
  AdminReportFinancier,
  AdminReportProduits,
  AdminReportVentes,
} from '@/types/admin'

export interface ReportPeriodParams {
  periode?: string
  date_debut?: string
  date_fin?: string
}

export const rapportsAdminApi = {
  catalog: () =>
    api.get<{ success: boolean; data: AdminReportCatalog }>('/api/admin/rapports'),

  dashboard: () =>
    api.get<{ success: boolean; data: AdminReportDashboard }>('/api/admin/rapports/dashboard'),

  alertes: () =>
    api.get<{ success: boolean; data: AdminReportAlerte[] }>('/api/admin/rapports/alertes'),

  tendances: (params?: { type?: string } & ReportPeriodParams) =>
    api.get<{ success: boolean; data: { evolution: Array<{ periode: string; chiffre_affaires: number; nombre_commandes: number }> } }>(
      '/api/admin/rapports/tendances',
      { params },
    ),

  ventes: (params?: ReportPeriodParams & { group_by?: 'day' | 'week' | 'month' | 'year' }) =>
    api.get<{ success: boolean; data: AdminReportVentes }>('/api/admin/rapports/ventes', { params }),

  produits: (params?: ReportPeriodParams & { limit?: number }) =>
    api.get<{ success: boolean; data: AdminReportProduits }>('/api/admin/rapports/produits', { params }),

  clients: (params?: ReportPeriodParams) =>
    api.get<{ success: boolean; data: AdminReportClients }>('/api/admin/rapports/clients', { params }),

  financier: (params?: ReportPeriodParams) =>
    api.get<{ success: boolean; data: AdminReportFinancier }>('/api/admin/rapports/financier', { params }),

  commandes: (params?: ReportPeriodParams & { statut_commande?: string }) =>
    api.get<{ success: boolean; data: AdminReportCommandes }>('/api/admin/rapports/commandes', { params }),

  analytics: (params?: ReportPeriodParams) =>
    api.get<{ success: boolean; data: AdminReportAnalytics }>('/api/admin/rapports/analytics', { params }),

  export: (payload: { type: string; format: 'excel' | 'csv' | 'pdf' } & ReportPeriodParams) =>
    api.post('/api/admin/rapports/export', payload, { responseType: 'blob' }),
}
