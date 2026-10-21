// Skill of each challenge type (spec §4). The skill is shown on every challenge.

import type { ChallengeType } from '~/types/challenge'

export interface Skill {
  label: string
  description: string
}

export const SKILLS: Record<ChallengeType, Skill> = {
  ordering: {
    label: 'Pensamento algorítmico',
    description: 'Organizar a solução como uma sequência de passos em que a ordem importa.',
  },
  grouping: {
    label: 'Decomposição',
    description: 'Dividir um problema grande em partes menores, mais fáceis de resolver.',
  },
  filtering: {
    label: 'Abstração',
    description: 'Separar o que é essencial para o problema do que é detalhe.',
  },
  pattern: {
    label: 'Reconhecimento de padrões',
    description: 'Encontrar a regra que se repete e usá-la para prever o próximo passo.',
  },
}

export function skillLabel(type: ChallengeType): string {
  return SKILLS[type].label
}

export function skillDescription(type: ChallengeType): string {
  return SKILLS[type].description
}
