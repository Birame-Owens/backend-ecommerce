// U+202F narrow no-break space — produit par toLocaleString('fr-FR') en Node.js 18+
const FR_SPACE_RE = / | | /g

export function normalizeSpaces(text: string): string {
  return text.replace(FR_SPACE_RE, ' ')
}

/**
 * Matcher getByText : prix formaté EXACT (ex : "25 000 F").
 * Insensible au type d'espace utilisé par l'environnement.
 */
export function matchPrice(amount: number) {
  const expected = normalizeSpaces(amount.toLocaleString('fr-FR') + ' F')
  return (content: string) => normalizeSpaces(content) === expected
}

/**
 * Matcher getByText : prix avec signe négatif (ex : "-5 000 F").
 */
export function matchNegPrice(amount: number) {
  const expected = '-' + normalizeSpaces(amount.toLocaleString('fr-FR') + ' F')
  return (content: string) => normalizeSpaces(content) === expected
}

/**
 * Matcher getByText : l'élément peut contenir d'autre texte autour du prix.
 */
export function containsPrice(amount: number) {
  const expected = normalizeSpaces(amount.toLocaleString('fr-FR') + ' F')
  return (content: string) => normalizeSpaces(content).includes(expected)
}
