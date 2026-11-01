// Levels and titles (spec §5, §5.2). The backend sends level, title and the bands; this mirror
// feeds the help page and the landing, which have no profile to read them from.

export const XP_PER_LEVEL = 30

export interface LevelBand {
  from: number
  to: number | null
  title: string
}

export const LEVEL_BANDS: readonly LevelBand[] = [
  { from: 1, to: 2, title: 'Iniciante' },
  { from: 3, to: 4, title: 'Aprendiz' },
  { from: 5, to: 7, title: 'Praticante' },
  { from: 8, to: 10, title: 'Especialista' },
  { from: 11, to: null, title: 'Mestre' },
]

export function levelTitle(level: number): string {
  const band = LEVEL_BANDS.find((b) => level >= b.from && (b.to === null || level <= b.to))
  return (band ?? LEVEL_BANDS[0]!).title
}

// A title is always shown with its level number (spec §5.2).
export function levelLabel(level: number, title: string): string {
  return `Nível ${level} · ${title}`
}

// "1 a 2", "11 em diante".
export function bandRange(from: number, to: number | null): string {
  return to === null ? `${from} em diante` : `${from} a ${to}`
}
