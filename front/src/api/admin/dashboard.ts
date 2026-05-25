import api from '@/lib/axios'
import type { DashboardData } from '@/types/admin'

export const dashboardApi = {
  getStats: () =>
    api.get<{ success: boolean; data: DashboardData }>('/api/admin/dashboard'),

  getQuickStats: () =>
    api.get<{ success: boolean; data: unknown }>('/api/admin/dashboard/quick-stats'),
}
