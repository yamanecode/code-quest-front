// DTOs of the backend API (spec §8.4). Nullable fields are always present.

import type { Answer, ChallengeType, TypedStoredContent, TypedStudentContent } from './challenge'

export type Role = 'student' | 'professor'
export type Tier = 'bronze' | 'silver' | 'gold'
export type Status = 'draft' | 'published'
export type Origin = 'professor' | 'ai' | 'base'
export type RankingScope = 'global' | 'classroom'
export type RankingPeriod = 'week' | 'month'

// Errors

export interface ApiErrorBody {
  detail: string
  message: string
  retry_after?: number
  errors?: string[]
}

// Auth

export interface Credentials {
  username: string
  password: string
}

export interface RegisterResponse {
  id: number
  username: string
  role: Role
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  role: Role
}

// Student

export interface Goal {
  target: number
  progress: number
  week_start: string
  completed: boolean
}

export interface MyClassroom {
  id: number
  name: string
  closed: boolean
  goal: Goal | null
}

export interface ClassroomRef {
  id: number
  name: string
}

export interface JoinClassroomRequest {
  join_code: string
}

export interface MissionSummary {
  id: number
  title: string
  description: string | null
  total: number
  solved: number
}

export interface ClassroomMissions {
  id: number
  name: string
  missions: MissionSummary[]
}

export interface Missions {
  base: MissionSummary[]
  classrooms: ClassroomMissions[]
}

export interface ChallengeSummary {
  id: number
  title: string
  type: ChallengeType
  skill: string
  solved: boolean
}

export interface MissionDetail {
  id: number
  title: string
  description: string | null
  challenges: ChallengeSummary[]
}

interface ChallengeForStudentBase {
  id: number
  title: string
  statement: string
  skill: string
  solved: boolean
  hints_left: number
  cooldown_seconds_left: number
}

export type ChallengeForStudent = ChallengeForStudentBase & TypedStudentContent

export interface SubmissionRequest {
  answer: Answer
}

export interface NewBadge {
  code: string
  name: string
  description: string
  tier: Tier
  emoji: string
}

export interface SubmissionResult {
  is_correct: boolean
  xp_earned: number
  xp: number
  level: number
  title: string
  level_up: boolean
  new_badges: NewBadge[]
  explanation: string | null
  hint: string | null
}

export interface HintResult {
  hint: string
  level: number
  hints_left: number
  cooldown_seconds: number
}

export interface Daily {
  challenge: ChallengeSummary | null
  all_solved: boolean
}

export interface ProfileBadge extends NewBadge {
  hidden: boolean
  earned: boolean
  earned_at: string | null
}

export interface Profile {
  username: string
  role: string
  xp: number
  level: number
  title: string
  xp_to_next_level: number
  streak: number
  missions_completed: number
  solved_by_skill: Record<ChallengeType, number>
  first_try_solves: number
  profile_public: boolean
  badges: ProfileBadge[]
}

export interface Settings {
  profile_public: boolean
}

export interface RankingEntry {
  position: number
  username: string
  xp: number
  is_me: boolean
  profile_public: boolean
}

export interface Ranking {
  scope: RankingScope
  period: RankingPeriod
  entries: RankingEntry[]
}

export interface RankingQuery {
  scope: RankingScope
  period: RankingPeriod
  classroom_id?: number
}

export interface PublicBadge {
  code: string
  name: string
  tier: Tier
  emoji: string
}

export interface PublicProfile {
  username: string
  level: number
  title: string
  badges: PublicBadge[]
}

// Professor

export interface ProfClassroom {
  id: number
  name: string
  join_code: string
  weekly_goal: number | null
  closed: boolean
  goal: Goal | null
}

// PUT replaces the turma, so both fields are always sent.
export interface ClassroomInput {
  name: string
  weekly_goal: number | null
}

export interface ChallengeRef {
  id: number
  title: string
  type: ChallengeType
  status: Status
}

export interface ProfMission {
  id: number
  classroom_id: number
  title: string
  description: string | null
  position: number
  status: Status
  challenges: ChallengeRef[]
}

export interface MissionCreateInput {
  title: string
  description?: string | null
  position?: number
}

// PUT replaces the mission, so every field is always sent.
export interface MissionInput {
  title: string
  description: string | null
  position: number
}

export interface MissionChallengesInput {
  challenge_ids: number[]
}

export interface SolveStats {
  attempted: number
  solved: number
}

interface ProfChallengeBase {
  id: number
  title: string
  statement: string
  skill: string
  explanation: string | null
  status: Status
  origin: Origin
  locked: boolean
  solve_stats: SolveStats
}

export type ProfChallenge = ProfChallengeBase & TypedStoredContent

export type ChallengeInput = {
  title: string
  statement: string
  explanation: string | null
} & TypedStoredContent

export interface Review {
  rule_violations: string[]
  suggestions: string
}

export interface DraftRequest {
  type: ChallengeType
  topic: string
  mission_id?: number
}

export interface StudentProgress {
  username: string
  xp_in_class: number
  level: number
  solved_in_class: number
  missions_completed_in_class: number
  hints_used: number
  streak: number
}

export interface Progress {
  completed_all_pct: number
  students: StudentProgress[]
}
