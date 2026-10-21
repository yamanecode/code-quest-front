// Level titles (spec §5.2). The backend sends the title; this mirror feeds the help page.

export interface LevelBand {
  from: number
  to: number | null
  title: string
}

export const LEVEL_BANDS: readonly LevelBand[] = [
  { from: 1, to: 2, title: 'Aprendiz' },
  { from: 3, to: 4, title: 'Explorador(a)' },
  { from: 5, to: 7, title: 'Estrategista' },
  { from: 8, to: 10, title: 'Arquiteto(a) de soluções' },
  { from: 11, to: null, title: 'Mestre do pensamento' },
]

export function levelTitle(level: number): string {
  const band = LEVEL_BANDS.find((b) => level >= b.from && (b.to === null || level <= b.to))
  return (band ?? LEVEL_BANDS[0]!).title
}
