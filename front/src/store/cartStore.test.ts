import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore, cartSubtotal, cartTotal, cartCount } from './cartStore'

/* ────────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────────── */
function reset() {
  useCartStore.setState({ items: [], coupon: null })
}

function makeItem(overrides: Partial<Parameters<typeof useCartStore.getState>['0']['items'][0]> = {}) {
  return {
    id: 1,
    nom: 'T-shirt Noir',
    slug: 'tshirt-noir',
    prix: 15000,
    image: null,
    couleur: 'Noir',
    taille: 'M',
    type_variante: 'vetement' as const,
    qty: 1,
    stock_max: null,
    ...overrides,
  }
}

/* ────────────────────────────────────────────────────────────────────
   addItem
──────────────────────────────────────────────────────────────────── */
describe('cartStore — addItem', () => {
  beforeEach(reset)

  it('ajoute un article avec la bonne clé', () => {
    useCartStore.getState().addItem(makeItem())
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].key).toBe('1-Noir-M')
    expect(items[0].nom).toBe('T-shirt Noir')
    expect(items[0].qty).toBe(1)
  })

  it('incrémente la quantité pour la même variante', () => {
    useCartStore.getState().addItem(makeItem({ qty: 1 }))
    useCartStore.getState().addItem(makeItem({ qty: 2 }))
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].qty).toBe(3)
  })

  it('traite deux variantes différentes comme deux articles distincts', () => {
    useCartStore.getState().addItem(makeItem({ taille: 'S' }))
    useCartStore.getState().addItem(makeItem({ taille: 'L' }))
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('traite deux couleurs différentes comme deux articles distincts', () => {
    useCartStore.getState().addItem(makeItem({ couleur: 'Noir' }))
    useCartStore.getState().addItem(makeItem({ couleur: 'Blanc' }))
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('plafonne la quantité initiale à stock_max', () => {
    useCartStore.getState().addItem(makeItem({ qty: 10, stock_max: 3 }))
    expect(useCartStore.getState().items[0].qty).toBe(3)
  })

  it('plafonne la quantité cumulée à stock_max lors du réajout', () => {
    useCartStore.getState().addItem(makeItem({ qty: 2, stock_max: 3 }))
    useCartStore.getState().addItem(makeItem({ qty: 5, stock_max: 3 }))
    expect(useCartStore.getState().items[0].qty).toBe(3)
  })

  it('n\'a pas de plafond quand stock_max est null (stock illimité)', () => {
    useCartStore.getState().addItem(makeItem({ qty: 99, stock_max: null }))
    expect(useCartStore.getState().items[0].qty).toBe(99)
  })

  it('génère la clé correcte pour un article sans variante', () => {
    useCartStore.getState().addItem(makeItem({ couleur: null, taille: null, type_variante: 'aucun' }))
    expect(useCartStore.getState().items[0].key).toBe('1-nc-nc')
  })

  it('génère la clé correcte pour un parfum (senteur + contenance)', () => {
    useCartStore.getState().addItem(makeItem({
      id: 5, couleur: 'Rose', taille: '100ml', type_variante: 'parfum',
    }))
    expect(useCartStore.getState().items[0].key).toBe('5-Rose-100ml')
  })
})

/* ────────────────────────────────────────────────────────────────────
   removeItem
──────────────────────────────────────────────────────────────────── */
describe('cartStore — removeItem', () => {
  beforeEach(reset)

  it('supprime l\'article correspondant à la clé', () => {
    useCartStore.getState().addItem(makeItem({ taille: 'S' }))
    useCartStore.getState().addItem(makeItem({ taille: 'L' }))
    useCartStore.getState().removeItem('1-Noir-S')
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].key).toBe('1-Noir-L')
  })

  it('ne fait rien si la clé est inexistante', () => {
    useCartStore.getState().addItem(makeItem())
    useCartStore.getState().removeItem('inexistante')
    expect(useCartStore.getState().items).toHaveLength(1)
  })
})

/* ────────────────────────────────────────────────────────────────────
   updateQty
──────────────────────────────────────────────────────────────────── */
describe('cartStore — updateQty', () => {
  beforeEach(reset)

  it('augmente la quantité avec un delta positif', () => {
    useCartStore.getState().addItem(makeItem({ qty: 1 }))
    useCartStore.getState().updateQty('1-Noir-M', 2)
    expect(useCartStore.getState().items[0].qty).toBe(3)
  })

  it('diminue la quantité avec un delta négatif', () => {
    useCartStore.getState().addItem(makeItem({ qty: 3 }))
    useCartStore.getState().updateQty('1-Noir-M', -1)
    expect(useCartStore.getState().items[0].qty).toBe(2)
  })

  it('supprime l\'article quand qty tombe à 0', () => {
    useCartStore.getState().addItem(makeItem({ qty: 1 }))
    useCartStore.getState().updateQty('1-Noir-M', -1)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('supprime l\'article quand qty devient négative', () => {
    useCartStore.getState().addItem(makeItem({ qty: 1 }))
    useCartStore.getState().updateQty('1-Noir-M', -5)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('respecte stock_max lors de l\'augmentation', () => {
    useCartStore.getState().addItem(makeItem({ qty: 2, stock_max: 3 }))
    useCartStore.getState().updateQty('1-Noir-M', 5)
    expect(useCartStore.getState().items[0].qty).toBe(3)
  })
})

/* ────────────────────────────────────────────────────────────────────
   clearCart
──────────────────────────────────────────────────────────────────── */
describe('cartStore — clearCart', () => {
  beforeEach(reset)

  it('vide tous les articles', () => {
    useCartStore.getState().addItem(makeItem())
    useCartStore.getState().addItem(makeItem({ id: 2, taille: 'L' }))
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('supprime aussi le coupon appliqué', () => {
    useCartStore.getState().applyCoupon({ code: 'PROMO10', nom: 'Promo', discount: 2000 })
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().coupon).toBeNull()
  })
})

/* ────────────────────────────────────────────────────────────────────
   Coupon
──────────────────────────────────────────────────────────────────── */
describe('cartStore — coupon', () => {
  beforeEach(reset)

  it('applique un coupon', () => {
    const coupon = { code: 'ETE25', nom: 'Été 25%', discount: 5000 }
    useCartStore.getState().applyCoupon(coupon)
    expect(useCartStore.getState().coupon).toEqual(coupon)
  })

  it('supprime le coupon', () => {
    useCartStore.getState().applyCoupon({ code: 'ETE25', nom: 'Été', discount: 5000 })
    useCartStore.getState().removeCoupon()
    expect(useCartStore.getState().coupon).toBeNull()
  })

  it('écrase un coupon existant par un nouveau', () => {
    useCartStore.getState().applyCoupon({ code: 'A', nom: 'A', discount: 1000 })
    useCartStore.getState().applyCoupon({ code: 'B', nom: 'B', discount: 2000 })
    expect(useCartStore.getState().coupon?.code).toBe('B')
  })
})

/* ────────────────────────────────────────────────────────────────────
   Fonctions utilitaires
──────────────────────────────────────────────────────────────────── */
describe('cartSubtotal', () => {
  it('retourne 0 pour un panier vide', () => {
    expect(cartSubtotal([])).toBe(0)
  })

  it('calcule le sous-total correctement', () => {
    const items = [
      { ...makeItem(), key: 'a', prix: 10000, qty: 2 },
      { ...makeItem(), key: 'b', prix: 5000, qty: 3 },
    ]
    expect(cartSubtotal(items)).toBe(35000)
  })
})

describe('cartTotal', () => {
  it('retourne le sous-total sans coupon', () => {
    const items = [{ ...makeItem(), key: 'a', prix: 20000, qty: 1 }]
    expect(cartTotal(items)).toBe(20000)
  })

  it('applique la réduction du coupon', () => {
    const items = [{ ...makeItem(), key: 'a', prix: 20000, qty: 1 }]
    const coupon = { code: 'X', nom: 'X', discount: 3000 }
    expect(cartTotal(items, coupon)).toBe(17000)
  })

  it('ne descend pas sous 0 même avec une réduction excessive', () => {
    const items = [{ ...makeItem(), key: 'a', prix: 1000, qty: 1 }]
    const coupon = { code: 'X', nom: 'X', discount: 99999 }
    expect(cartTotal(items, coupon)).toBe(0)
  })
})

describe('cartCount', () => {
  it('retourne 0 pour un panier vide', () => {
    expect(cartCount([])).toBe(0)
  })

  it('somme les quantités de tous les articles', () => {
    const items = [
      { ...makeItem(), key: 'a', qty: 3 },
      { ...makeItem(), key: 'b', qty: 2 },
    ]
    expect(cartCount(items)).toBe(5)
  })
})
