import clientApi from '@/lib/clientAxios'

/** Offre « produit acheté → cadeau offert » telle qu'exposée à la boutique. */
export interface OffreCadeau {
  id: number
  produit_declencheur_id: number
  quantite_declencheur: number
  quantite_offerte: number
  couleur: string | null
  taille: string | null
  cadeau: {
    id: number
    nom: string
    slug: string | null
    image: string | null
    valeur: number
    type_variante?: 'vetement' | 'chaussure' | 'parfum' | 'aucun' | null
  }
}

export const offresCadeauxApi = {
  list: () =>
    clientApi.get<{ success: boolean; data: OffreCadeau[] }>('/api/client/offres-cadeaux'),
}
