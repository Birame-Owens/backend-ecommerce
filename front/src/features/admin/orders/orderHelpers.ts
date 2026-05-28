export const statusOrder = [
  'en_attente',
  'confirmee',
  'en_preparation',
  'prete',
  'en_livraison',
  'livree',
]

export const statusLabels: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmee',
  en_preparation: 'En preparation',
  prete: 'Prete',
  en_livraison: 'En livraison',
  livree: 'Livree',
  annulee: 'Annulee',
}

export const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export const paymentMethods = [
  { value: 'especes', label: 'Especes' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'free_money', label: 'Free Money' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'carte', label: 'Carte' },
]

export const statusBadge = (statut: string) => {
  switch (statut) {
    case 'livree':
      return 'bg-sage/30 text-emerald-700'
    case 'en_livraison':
    case 'prete':
      return 'bg-sky-50 text-sky-600'
    case 'annulee':
      return 'bg-blush/30 text-rose-600'
    default:
      return 'bg-beige-200 text-ink'
  }
}

export const paymentBadge = (paid: boolean) =>
  paid ? 'bg-sage/30 text-emerald-700' : 'bg-amber-100 text-amber-700'

export const fmtMoney = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('fr-FR')
