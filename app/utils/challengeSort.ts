import type { ProfChallenge } from '~/types/api'
import { SKILLS } from '~/utils/skills'

// `recent` is the creation order (higher id first when ascending); the others are the table columns.
export type ChallengeSortKey = 'recent' | 'title' | 'type' | 'status'

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })

const STATUS_LABEL = { published: 'Publicado', draft: 'Rascunho' }

function compare(a: ProfChallenge, b: ProfChallenge, key: ChallengeSortKey): number {
  if (key === 'recent') return b.id - a.id
  if (key === 'title') return collator.compare(a.title, b.title)
  if (key === 'type') return collator.compare(SKILLS[a.type].label, SKILLS[b.type].label)
  return collator.compare(STATUS_LABEL[a.status], STATUS_LABEL[b.status])
}

// Returns a sorted copy. Ties fall back to the title, then to the newest first.
export function sortChallenges(list: ProfChallenge[], key: ChallengeSortKey, dir: 'asc' | 'desc'): ProfChallenge[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...list].sort(
    (a, b) => sign * compare(a, b, key) || collator.compare(a.title, b.title) || b.id - a.id,
  )
}
