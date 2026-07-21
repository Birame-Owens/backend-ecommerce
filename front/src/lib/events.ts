import clientApi from '@/lib/clientAxios'

/**
 * Journalisation d'événements comportementaux vers notre propre backend
 * (same-origin), pour les statistiques internes de business intelligence.
 *
 * Contrairement à Google Analytics (bloqué par les bloqueurs de pub, les
 * navigateurs intégrés Instagram/WhatsApp, le Consent Mode…), cet appel part
 * vers notre API : rien ne le bloque. Best-effort : on n'attend jamais la
 * réponse et une erreur ne remonte jamais (le parcours d'achat ne doit
 * jamais être perturbé par un échec de statistiques).
 */
export type EventType =
  | 'ajout_panier'
  | 'retrait_panier'
  | 'modification_quantite'
  | 'vue_panier'
  | 'ajout_wishlist'
  | 'retrait_wishlist'
  | 'debut_checkout'
  | 'changement_variante'
  | 'partage_produit'
  | 'clic_whatsapp'

interface EventPayload {
  produit_id?: number | null
  categorie_id?: number | null
  metadata?: Record<string, unknown>
}

export function logEvent(type: EventType, payload: EventPayload = {}): void {
  clientApi.post('/api/client/evenements', { type, ...payload }).catch(() => {
    /* best-effort : jamais bloquant */
  })
}
