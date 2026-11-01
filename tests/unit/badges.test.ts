import { describe, expect, it } from 'vitest'
import type { Profile, ProfileBadge } from '~/types/api'
import { badgeFamily, badgeProgress, nextBadges } from '~/utils/badges'
import { formatDayMonth } from '~/utils/format'

type Stats = Pick<Profile, 'xp' | 'level' | 'missions_completed' | 'first_try_solves' | 'solved_by_skill'>

const stats: Stats = {
  xp: 112,
  level: 4,
  missions_completed: 1,
  first_try_solves: 4,
  solved_by_skill: { ordering: 5, grouping: 0, filtering: 1, pattern: 8 },
}

function locked(code: string, hidden = false): ProfileBadge {
  return { code, name: code, description: '', tier: 'silver', emoji: '⭐', hidden, requires_class: false, earned: false, earned_at: null }
}

describe('badge progress', () => {
  it('reads the progress of each countable badge from the profile', () => {
    expect(badgeProgress('first_solve', stats)).toEqual({ current: 14, target: 1 })
    expect(badgeProgress('skill_ordering_7', stats)).toEqual({ current: 5, target: 7 })
    expect(badgeProgress('skill_grouping_3', stats)).toEqual({ current: 0, target: 3 })
    expect(badgeProgress('level_6', stats)).toEqual({ current: 4, target: 6 })
    expect(badgeProgress('mission_5', stats)).toEqual({ current: 1, target: 5 })
    expect(badgeProgress('first_try_5', stats)).toEqual({ current: 4, target: 5 })
  })

  it('has no progress for badges the profile cannot count', () => {
    expect(badgeProgress('class_goal_1', stats)).toBeNull()
    expect(badgeProgress('all_types_day', stats)).toBeNull()
    expect(badgeProgress('persistent', stats)).toBeNull()
    expect(badgeProgress('explorer_base', stats)).toBeNull()
  })

  it('picks the locked badges with the fewest steps left, never secret ones', () => {
    const badges = [
      locked('skill_grouping_3'), // 3 challenges
      locked('level_6'), // 38 XP: 4 challenges
      locked('class_goal_1'), // not countable
      locked('first_try_5'), // 1 challenge
      locked('skill_ordering_7'), // 2 challenges
      locked('persistent', true),
      { ...locked('mission_1'), earned: true },
    ]

    expect(nextBadges(badges, stats, 3).map((badge) => badge.code)).toEqual(['first_try_5', 'skill_ordering_7', 'skill_grouping_3'])
  })

  it('shows a new student the first challenge badge and only the next tier of each set', () => {
    const fresh: Stats = {
      xp: 0,
      level: 1,
      missions_completed: 0,
      first_try_solves: 0,
      solved_by_skill: { ordering: 0, grouping: 0, filtering: 0, pattern: 0 },
    }
    const badges = ['level_3', 'level_6', 'level_11', 'skill_ordering_3', 'skill_ordering_7', 'mission_1', 'first_solve']
      .map((code) => locked(code))

    const picked = nextBadges(badges, fresh, 8).map((badge) => badge.code)

    expect(picked[0]).toBe('first_solve')
    expect(picked).toContain('level_3')
    expect(picked).not.toContain('level_6')
    expect(picked).not.toContain('level_11')
    expect(picked).not.toContain('skill_ordering_7')
  })
})

describe('badgeFamily', () => {
  it('T-FE-BADGE-02 maps every badge code of spec §5.1 to the symbol of its family', () => {
    expect(badgeFamily('first_solve')).toBe('first_solve')
    expect(badgeFamily('skill_ordering_15')).toBe('ordering')
    expect(badgeFamily('skill_grouping_3')).toBe('grouping')
    expect(badgeFamily('skill_filtering_7')).toBe('filtering')
    expect(badgeFamily('skill_pattern_3')).toBe('pattern')
    expect(badgeFamily('level_11')).toBe('level')
    expect(badgeFamily('mission_5')).toBe('mission')
    expect(badgeFamily('first_try_30')).toBe('first_try')
    expect(badgeFamily('class_goal_1')).toBe('class_goal')
    expect(badgeFamily('all_types_day')).toBe('all_types_day')
    expect(badgeFamily('persistent')).toBe('persistent')
    expect(badgeFamily('explorer_base')).toBe('explorer_base')
    // A code added later still gets a symbol.
    expect(badgeFamily('something_new')).toBe('first_solve')
  })
})

describe('formatDayMonth', () => {
  it('shows the day and month in São Paulo time', () => {
    expect(formatDayMonth('2026-10-20T10:00:00-03:00')).toBe('20/10')
    // 01:30 UTC on the 21st is still the 20th in São Paulo.
    expect(formatDayMonth('2026-10-21T01:30:00Z')).toBe('20/10')
  })
})
