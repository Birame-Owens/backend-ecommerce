import { useEffect, useMemo, useState } from 'react'
import {
  Search, MessageSquare, Send, Image as ImageIcon, Paperclip,
  Bell, Users, PhoneCall,
} from 'lucide-react'
import { messagesAdminApi } from '@/api/admin/messages'
import type { AdminMessageClient, AdminMessageGroup, AdminMessageGroupStats } from '@/types/admin'

export default function MessagesPage() {
  const [groups, setGroups] = useState<AdminMessageGroup[]>([])
  const [stats, setStats] = useState<AdminMessageGroupStats | null>(null)
  const [clients, setClients] = useState<AdminMessageClient[]>([])
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [selectedClient, setSelectedClient] = useState<AdminMessageClient | null>(null)
  const [search, setSearch] = useState('')
  const [channel, setChannel] = useState<'email' | 'whatsapp' | 'both'>('email')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const loadGroups = async () => {
    const res = await messagesAdminApi.groups()
    setGroups(res.data.data.groups)
    setStats(res.data.data.stats)
  }

  const loadClients = async (groupId: string) => {
    const res = await messagesAdminApi.clients(groupId)
    setClients(res.data.data.clients)
  }

  useEffect(() => {
    loadGroups()
    loadClients('all')
  }, [])

  useEffect(() => {
    loadClients(selectedGroup)
  }, [selectedGroup])

  useEffect(() => {
    if (!clients.length) {
      setSelectedClient(null)
      return
    }
    if (selectedClient && clients.some((client) => client.id === selectedClient.id)) return
    setSelectedClient(clients[0])
  }, [clients])

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return clients
    return clients.filter((client) => {
      const fullName = `${client.nom} ${client.prenom}`.toLowerCase()
      return fullName.includes(term) || client.telephone.toLowerCase().includes(term)
    })
  }, [clients, search])

  const handleSend = async () => {
    if (!message.trim()) return
    if ((channel === 'email' || channel === 'both') && !subject.trim()) return
    setSending(true)
    try {
      await messagesAdminApi.send({
        group_id: selectedGroup,
        channel,
        subject: subject.trim() || undefined,
        message: message.trim(),
        client_ids: selectedClient ? [selectedClient.id] : undefined,
      })
      setMessage('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink">Messages & support client</h1>
        <p className="text-sm text-muted mt-1">Gerez les conversations et demandes de vos clients.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.5fr_0.8fr] gap-6">
        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-4 shadow-beige flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted uppercase tracking-widest">Conversations</p>
            <Users className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-muted" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client"
              className="flex-1 bg-beige-100 border border-beige-300 rounded-xl px-3 py-2 text-xs text-muted"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                  selectedGroup === group.id
                    ? 'bg-beige-500 text-white'
                    : 'bg-beige-100 text-muted'
                }`}
              >
                {group.name} ({group.count})
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`w-full text-left px-3 py-2 rounded-xl border ${
                  selectedClient?.id === client.id ? 'border-beige-500 bg-beige-100' : 'border-beige-300'
                }`}
              >
                <p className="text-sm font-semibold text-ink">{client.nom} {client.prenom}</p>
                <p className="text-[11px] text-muted">Inscrit le {new Date(client.created_at).toLocaleDateString('fr-FR')}</p>
              </button>
            ))}
            {filteredClients.length === 0 && (
              <div className="text-xs text-muted">Aucun client dans ce groupe.</div>
            )}
          </div>
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Discussion</p>
              <h3 className="text-lg font-serif font-semibold text-ink">{selectedClient ? `${selectedClient.nom} ${selectedClient.prenom}` : 'Aucun client'}</h3>
            </div>
            <MessageSquare className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>

          <div className="flex-1 bg-beige-100 border border-beige-300 rounded-2xl p-4 text-sm text-muted">
            {selectedClient
              ? 'Aucun historique de message disponible pour ce client.'
              : 'Selectionnez un client pour afficher la conversation.'}
          </div>

          <div className="mt-4 bg-beige-100 border border-beige-300 rounded-2xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'email' | 'whatsapp' | 'both')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-beige-50 border border-beige-300 text-muted"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="both">Email + WhatsApp</option>
              </select>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet (email uniquement)"
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-beige-50 border border-beige-300 text-muted"
              />
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ecrire votre message..."
              className="w-full min-h-[110px] bg-beige-50 border border-beige-300 rounded-xl p-3 text-sm text-ink"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted">
                <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
                <Paperclip className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="px-4 py-2 rounded-xl bg-beige-500 text-white text-xs font-semibold hover:bg-beige-400 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                Envoyer
              </button>
            </div>
          </div>
        </div>

        <div className="bg-beige-50 border border-beige-300 rounded-2xl p-5 shadow-beige">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-widest">Informations client</p>
              <h3 className="text-lg font-serif font-semibold text-ink">Profil</h3>
            </div>
            <PhoneCall className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
          </div>
          {selectedClient ? (
            <div className="space-y-3 text-sm text-muted">
              <p className="text-ink font-semibold">{selectedClient.nom} {selectedClient.prenom}</p>
              <p>{selectedClient.telephone}</p>
              <p>{selectedClient.email ?? 'Email non renseigne'}</p>
              <p>Inscrit le {new Date(selectedClient.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          ) : (
            <div className="text-xs text-muted">Aucun client selectionne.</div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted uppercase tracking-widest">Notifications</p>
              <Bell className="w-4 h-4 text-beige-500" strokeWidth={1.5} />
            </div>
            <div className="space-y-2 text-xs text-muted">
              <p>Clients total: {stats?.all ?? '—'}</p>
              <p>Clients VIP: {stats?.vip ?? '—'}</p>
              <p>Clients inactifs: {stats?.inactive ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
