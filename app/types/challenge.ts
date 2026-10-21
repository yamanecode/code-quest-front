// Challenge contents and answers (spec §4.1–§4.3).

export type ChallengeType = 'ordering' | 'grouping' | 'filtering' | 'pattern'

export const CHALLENGE_TYPES: readonly ChallengeType[] = ['ordering', 'grouping', 'filtering', 'pattern']

export interface Item {
  id: string
  text: string
}

// Student view: what the API sends to students, never with the solution.
// Item ids are shuffled and renamed per student (spec §4.2).

export interface OrderingContent {
  items: Item[]
}

export interface GroupingContent {
  groups: Item[]
  items: Item[]
}

export interface FilteringContent {
  question: string
  items: Item[]
}

export interface PatternContent {
  sequence: string[]
  options: Item[]
}

// Stored view: the professor's content, with the solution.

export interface OrderingStoredContent extends OrderingContent {
  solution: string[]
}

export interface GroupingStoredContent extends GroupingContent {
  solution: Record<string, string>
}

export interface FilteringStoredContent extends FilteringContent {
  solution: string[]
}

export interface PatternStoredContent extends PatternContent {
  solution: string
}

export type StudentContent = OrderingContent | GroupingContent | FilteringContent | PatternContent

export type StoredContent =
  | OrderingStoredContent
  | GroupingStoredContent
  | FilteringStoredContent
  | PatternStoredContent

// The content itself has no type tag, so the unions are discriminated by a
// sibling `type` field, as in the API payloads.

export type TypedStudentContent =
  | { type: 'ordering'; content: OrderingContent }
  | { type: 'grouping'; content: GroupingContent }
  | { type: 'filtering'; content: FilteringContent }
  | { type: 'pattern'; content: PatternContent }

export type TypedStoredContent =
  | { type: 'ordering'; content: OrderingStoredContent }
  | { type: 'grouping'; content: GroupingStoredContent }
  | { type: 'filtering'; content: FilteringStoredContent }
  | { type: 'pattern'; content: PatternStoredContent }

// Answer payloads, using the ids as shown to the student.

export interface OrderingAnswer {
  order: string[]
}

export interface GroupingAnswer {
  assignment: Record<string, string>
}

export interface FilteringAnswer {
  selected: string[]
}

export interface PatternAnswer {
  option: string
}

export type Answer = OrderingAnswer | GroupingAnswer | FilteringAnswer | PatternAnswer
