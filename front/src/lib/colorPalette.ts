export const COLOR_PALETTE = [
  { name: 'Noir',        hex: '#1A1A1A' },
  { name: 'Blanc',       hex: '#FAFAFA' },
  { name: 'Crème',       hex: '#F5F0E8' },
  { name: 'Beige',       hex: '#D4B896' },
  { name: 'Camel',       hex: '#C19A6B' },
  { name: 'Marron',      hex: '#795548' },
  { name: 'Chocolat',    hex: '#4E342E' },
  { name: 'Taupe',       hex: '#8D7B68' },
  { name: 'Gris clair',  hex: '#D4D4D4' },
  { name: 'Gris',        hex: '#9E9E9E' },
  { name: 'Gris foncé',  hex: '#616161' },
  { name: 'Anthracite',  hex: '#424242' },
  { name: 'Rouge',       hex: '#E53935' },
  { name: 'Bordeaux',    hex: '#8B1A1A' },
  { name: 'Rose',        hex: '#F48FB1' },
  { name: 'Rose poudré', hex: '#FFCCD5' },
  { name: 'Corail',      hex: '#FF7043' },
  { name: 'Saumon',      hex: '#FFAB91' },
  { name: 'Orange',      hex: '#FB8C00' },
  { name: 'Jaune',       hex: '#FDD835' },
  { name: 'Vert',        hex: '#43A047' },
  { name: 'Vert sauge',  hex: '#8FBC8F' },
  { name: 'Kaki',        hex: '#6B7C45' },
  { name: 'Émeraude',    hex: '#00897B' },
  { name: 'Turquoise',   hex: '#00ACC1' },
  { name: 'Bleu ciel',   hex: '#64B5F6' },
  { name: 'Bleu',        hex: '#1E88E5' },
  { name: 'Marine',      hex: '#1A237E' },
  { name: 'Indigo',      hex: '#3949AB' },
  { name: 'Violet',      hex: '#7B1FA2' },
  { name: 'Lavande',     hex: '#CE93D8' },
  { name: 'Or',          hex: '#D4AF37' },
  { name: 'Argent',      hex: '#C0C0C0' },
  { name: 'Bronze',      hex: '#CD7F32' },
]

export function colorHex(name: string): string | null {
  return COLOR_PALETTE.find((c) => c.name === name)?.hex ?? null
}

/** Couleurs claires qui ont besoin d'un contour pour être visibles sur fond blanc */
const LIGHT_HEXES = new Set(['#FAFAFA','#F5F0E8','#D4B896','#D4D4D4','#FFCCD5','#FFAB91','#FDD835','#CE93D8','#D4AF37','#C0C0C0'])

export function needsBorder(hex: string): boolean {
  return LIGHT_HEXES.has(hex.toUpperCase()) || LIGHT_HEXES.has(hex)
}
