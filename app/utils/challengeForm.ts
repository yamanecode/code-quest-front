// Form model of the professor's challenge editor and its conversion to and from the API shapes.
// Ids are kept as loaded so editing a texts-only change never alters the structure (spec §4.5).

import type { ChallengeInput, ProfChallenge } from '~/types/api'
import type { ChallengeType, Item } from '~/types/challenge'

export interface FormState {
  type: ChallengeType
  title: string
  statement: string
  explanation: string
  question: string // filtering
  items: Item[] // ordering (in solution order), grouping, filtering
  groups: Item[] // grouping
  assignment: Record<string, string> // grouping: item id -> group id ('' while unassigned)
  relevant: string[] // filtering: ids of the relevant items
  sequence: string[] // pattern: the shown terms
  options: Item[] // pattern
  correct: string // pattern: id of the correct option
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

// First letter not used by any item, so ids stay stable when others are removed.
export function nextItemId(items: Item[]): string {
  const used = new Set(items.map((item) => item.id))
  return [...LETTERS].find((letter) => !used.has(letter)) ?? `x${items.length + 1}`
}

export function nextGroupId(groups: Item[]): string {
  const used = new Set(groups.map((group) => group.id))
  let n = 1
  while (used.has(`g${n}`)) n++
  return `g${n}`
}

function blankItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: LETTERS[i]!, text: '' }))
}

export function emptyForm(type: ChallengeType): FormState {
  const form: FormState = {
    type,
    title: '',
    statement: '',
    explanation: '',
    question: '',
    items: [],
    groups: [],
    assignment: {},
    relevant: [],
    sequence: [],
    options: [],
    correct: '',
  }
  if (type === 'ordering') form.items = blankItems(3)
  if (type === 'grouping') {
    form.groups = [{ id: 'g1', text: '' }, { id: 'g2', text: '' }]
    form.items = blankItems(4)
    form.assignment = Object.fromEntries(form.items.map((item) => [item.id, '']))
  }
  if (type === 'filtering') form.items = blankItems(4)
  if (type === 'pattern') {
    form.sequence = ['', '', '']
    form.options = blankItems(4)
  }
  return form
}

export function formFromChallenge(challenge: ProfChallenge): FormState {
  const form = emptyForm(challenge.type)
  form.title = challenge.title
  form.statement = challenge.statement
  form.explanation = challenge.explanation ?? ''
  form.items = []
  form.groups = []
  form.assignment = {}
  form.sequence = []
  form.options = []
  switch (challenge.type) {
    case 'ordering': {
      const { items, solution } = challenge.content
      form.items = solution.flatMap((id) => items.filter((item) => item.id === id))
      break
    }
    case 'grouping':
      form.items = challenge.content.items.map((item) => ({ ...item }))
      form.groups = challenge.content.groups.map((group) => ({ ...group }))
      form.assignment = { ...challenge.content.solution }
      break
    case 'filtering':
      form.question = challenge.content.question
      form.items = challenge.content.items.map((item) => ({ ...item }))
      form.relevant = [...challenge.content.solution]
      break
    case 'pattern':
      form.sequence = [...challenge.content.sequence]
      form.options = challenge.content.options.map((option) => ({ ...option }))
      form.correct = challenge.content.solution
      break
  }
  return form
}

const trimmed = (items: Item[]): Item[] => items.map((item) => ({ id: item.id, text: item.text.trim() }))

export function toInput(form: FormState): ChallengeInput {
  const common = {
    title: form.title.trim(),
    statement: form.statement.trim(),
    explanation: form.explanation.trim() || null,
  }
  const items = trimmed(form.items)
  switch (form.type) {
    case 'ordering':
      return { ...common, type: 'ordering', content: { items, solution: items.map((item) => item.id) } }
    case 'grouping': {
      const groupIds = new Set(form.groups.map((group) => group.id))
      const solution: Record<string, string> = {}
      for (const item of items) {
        const group = form.assignment[item.id]
        if (group && groupIds.has(group)) solution[item.id] = group
      }
      return { ...common, type: 'grouping', content: { groups: trimmed(form.groups), items, solution } }
    }
    case 'filtering':
      return {
        ...common,
        type: 'filtering',
        content: {
          question: form.question.trim(),
          items,
          solution: items.filter((item) => form.relevant.includes(item.id)).map((item) => item.id),
        },
      }
    case 'pattern':
      return {
        ...common,
        type: 'pattern',
        content: {
          sequence: form.sequence.map((term) => term.trim()),
          options: trimmed(form.options),
          solution: form.correct,
        },
      }
  }
}
