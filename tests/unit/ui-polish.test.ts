import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AnswerFeedback from '~/components/challenge/AnswerFeedback.vue'
import StatPanel from '~/components/game/StatPanel.vue'
import type { Profile } from '~/types/api'

const profile: Profile = {
  username: 'ana',
  role: 'student',
  xp: 131,
  level: 3,
  title: 'Explorador(a)',
  xp_to_next_level: 19,
  streak: 4,
  missions_completed: 1,
  solved_by_skill: { ordering: 5, grouping: 2, filtering: 0, pattern: 1 },
  first_try_solves: 3,
  profile_public: false,
  badges: [],
}

describe('stat panel and feedback polish', () => {
  it('T-FE-POLISH-01 the compact stat panel keeps level, title, XP bar and streak', async () => {
    const wrapper = await mountSuspended(StatPanel, { props: { profile, prefix: 'header', compact: true } })

    expect(wrapper.get('[data-testid="header-level"]').text()).toContain('3')
    expect(wrapper.get('[data-testid="header-title"]').text()).toContain('Explorador(a)')
    expect(wrapper.get('[data-testid="header-xp"]').text()).toContain('131 XP')
    expect(wrapper.get('[data-testid="header-xp"] [role="progressbar"]').attributes('aria-valuenow')).toBe('31')
    expect(wrapper.get('[data-testid="header-streak"]').text()).toContain('4')
  })

  it('T-FE-POLISH-02 the wrong answer shows the message, the hint and a retry button', async () => {
    const outcome = {
      is_correct: false,
      xp_earned: 0,
      xp: 0,
      level: 1,
      title: 'Aprendiz',
      level_up: false,
      new_badges: [],
      explanation: null,
      hint: 'Pense no que vem primeiro.',
      message: 'Quase lá!',
    }
    const wrapper = await mountSuspended(AnswerFeedback, { props: { outcome } })

    expect(wrapper.get('[data-testid="feedback-wrong"]').text()).toContain('Resposta incorreta')
    expect(wrapper.get('[data-testid="feedback-message"]').text()).toBe('Quase lá!')
    expect(wrapper.get('[data-testid="feedback-hint"]').text()).toContain('Pense no que vem primeiro.')

    await wrapper.get('[data-testid="feedback-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
