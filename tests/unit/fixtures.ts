import type { TitleStep } from '~/types/api'

// The five title bands as GET /api/me sends them (spec §5.2).
export const TITLE_STEPS: TitleStep[] = [
  { title: 'Iniciante', min_level: 1, max_level: 2 },
  { title: 'Aprendiz', min_level: 3, max_level: 4 },
  { title: 'Praticante', min_level: 5, max_level: 7 },
  { title: 'Especialista', min_level: 8, max_level: 10 },
  { title: 'Mestre', min_level: 11, max_level: null },
]
