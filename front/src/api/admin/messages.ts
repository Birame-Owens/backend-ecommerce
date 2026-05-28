import api from '@/lib/axios'
import type {
  AdminMessageClient,
  AdminMessageGroup,
  AdminMessageGroupStats,
} from '@/types/admin'

export const messagesAdminApi = {
  groups: () =>
    api.get<{ success: boolean; data: { groups: AdminMessageGroup[]; stats: AdminMessageGroupStats } }>('/api/admin/messages/groups'),

  clients: (groupId: string) =>
    api.get<{ success: boolean; data: { clients: AdminMessageClient[]; count: number } }>(
      '/api/admin/messages/clients',
      { params: { group_id: groupId } },
    ),

  send: (payload: {
    group_id: string
    channel: 'email' | 'whatsapp' | 'both'
    subject?: string
    message: string
    client_ids?: number[]
  }) =>
    api.post<{ success: boolean; message: string; data?: { recipients_count: number; channel: string } }>(
      '/api/admin/messages/send',
      payload,
    ),
}
