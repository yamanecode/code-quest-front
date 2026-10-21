// Badge display helpers (spec §5.1, §9.2). Badges are CSS + emoji, never image files.

import type { Profile, ProfileBadge, Tier } from '~/types/api'

export const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
}

export const SECRET_BADGE_NAME = 'Insígnia secreta'

export interface BadgeProgress {
  current: number
  target: number
}

type BadgeStats = Pick<Profile, 'xp' | 'level' | 'streak' | 'missions_completed' | 'first_try_solves' | 'solved_by_skill'>

// How far the student is from a badge, read from the profile numbers. Badge codes are
// fixed by spec §5.1; daily, class-goal and secret badges cannot be counted here.
export function badgeProgress(code: string, stats: BadgeStats): BadgeProgress | null {
  if (code === 'first_solve') {
    const solved = Object.values(stats.solved_by_skill).reduce((sum, n) => sum + n, 0)
    return { current: solved, target: 1 }
  }
  const skill = /^skill_(ordering|grouping|filtering|pattern)_(\d+)$/.exec(code)
  if (skill) {
    const type = skill[1] as keyof BadgeStats['solved_by_skill']
    return { current: stats.solved_by_skill[type], target: Number(skill[2]) }
  }
  const counted = /^(level|mission|streak|first_try)_(\d+)$/.exec(code)
  if (!counted) return null
  const current = {
    level: stats.level,
    mission: stats.missions_completed,
    streak: stats.streak,
    first_try: stats.first_try_solves,
  }[counted[1] as 'level' | 'mission' | 'streak' | 'first_try']
  return { current, target: Number(counted[2]) }
}

const XP_PER_LEVEL = 50
const XP_PER_CHALLENGE = 10 // a first-try solve (spec §5)
const CHALLENGES_PER_MISSION = 5 // rough size of a base trilha

// The set a badge belongs to: its tiers (I, II, III) share everything but the number.
function badgeSet(code: string): string {
  return code.replace(/_\d+$/, '')
}

// Rough number of things still to do for a badge, counted in challenges where possible
// so that a level, a mission or a skill tier can be compared. A streak day counts as one.
function stepsLeft(code: string, progress: BadgeProgress, stats: BadgeStats): number {
  const left = progress.target - progress.current
  if (code.startsWith('level_')) {
    const xpNeeded = (progress.target - 1) * XP_PER_LEVEL - stats.xp
    return Math.ceil(xpNeeded / XP_PER_CHALLENGE)
  }
  if (code.startsWith('mission_')) return left * CHALLENGES_PER_MISSION
  return left
}

// The locked, visible badges the student is closest to earning: only the next tier of
// each set, fewest steps first; on a tie, the one already further along goes first.
export function nextBadges(badges: ProfileBadge[], stats: BadgeStats, limit: number): ProfileBadge[] {
  const nextOfSet = new Map<string, { badge: ProfileBadge; steps: number; target: number; share: number }>()
  for (const badge of badges) {
    if (badge.earned || badge.hidden) continue
    const progress = badgeProgress(badge.code, stats)
    if (!progress || progress.current >= progress.target) continue
    const set = badgeSet(badge.code)
    const known = nextOfSet.get(set)
    if (!known || progress.target < known.target) {
      nextOfSet.set(set, {
        badge,
        steps: stepsLeft(badge.code, progress, stats),
        target: progress.target,
        share: progress.current / progress.target,
      })
    }
  }
  return [...nextOfSet.values()]
    .sort((a, b) => a.steps - b.steps || b.share - a.share)
    .slice(0, limit)
    .map((item) => item.badge)
}
