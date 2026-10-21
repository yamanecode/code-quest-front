import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type DOMWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProfilePage from '~/pages/perfil.vue'
import * as studentService from '~/services/student'
import { ApiError } from '~/services/http'
import { useSettingsStore } from '~/stores/settings'
import type { Profile, ProfileBadge } from '~/types/api'

vi.mock('~/services/student', () => ({
  getMe: vi.fn(),
  updateSettings: vi.fn(),
}))

function badge(overrides: Partial<ProfileBadge>): ProfileBadge {
  return {
    code: 'first_solve',
    name: 'Primeiro desafio',
    description: '1 desafio resolvido',
    tier: 'bronze',
    emoji: '⭐',
    hidden: false,
    earned: false,
    earned_at: null,
    ...overrides,
  }
}

const profile: Profile = {
  username: 'ana_22',
  role: 'student',
  xp: 65,
  level: 2,
  title: 'Aprendiz',
  xp_to_next_level: 35,
  streak: 3,
  missions_completed: 1,
  solved_by_skill: { ordering: 4, grouping: 0, filtering: 2, pattern: 16 },
  first_try_solves: 5,
  profile_public: false,
  badges: [
    badge({ earned: true, earned_at: '2026-10-18T10:00:00-03:00' }),
    badge({ code: 'streak_3', name: 'Três dias seguidos', description: 'Sequência de 3 dias', emoji: '🔥', earned: true, earned_at: '2026-10-20T10:00:00-03:00' }),
    badge({ code: 'skill_ordering_7', name: 'Algoritmos II', description: '7 desafios de ordenação resolvidos', tier: 'silver', emoji: '🔢' }),
    badge({ code: 'skill_grouping_15', name: 'Decomposição III', description: '15 desafios de decomposição resolvidos', tier: 'gold', emoji: '🧩' }),
    badge({ code: 'daily_7', name: 'Compromisso diário', description: '7 desafios diários resolvidos no próprio dia', tier: 'silver', emoji: '📅' }),
    badge({ code: 'all_types_day', name: 'Insígnia secreta', description: '', tier: 'silver', emoji: '🌈', hidden: true }),
  ],
}

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

async function open(overrides: Partial<Profile> = {}) {
  vi.mocked(studentService.getMe).mockResolvedValue({ ...profile, ...overrides })
  const wrapper = await mountSuspended(ProfilePage)
  await flushPromises()
  return wrapper
}

const codesIn = (wrapper: Wrapper, group: string) =>
  wrapper.get(`[data-testid="badges-${group}"]`).findAll('[data-earned]').map((medal: DOMWrapper<Element>) => medal.attributes('data-testid'))

beforeEach(() => {
  vi.mocked(studentService.getMe).mockReset()
  vi.mocked(studentService.updateSettings).mockReset()
})

describe('profile page', () => {
  it('T-FE-PROFILE-01 shows badges together with XP, level and title', async () => {
    const wrapper = await open()

    expect(wrapper.get('[data-testid="profile-username"]').text()).toContain('ana_22')
    expect(wrapper.get('[data-testid="profile-level"]').text()).toContain('2')
    expect(wrapper.get('[data-testid="profile-title"]').text()).toContain('Aprendiz')
    expect(wrapper.get('[data-testid="profile-xp"]').text()).toContain('65 XP')
    expect(wrapper.get('[data-testid="profile-xp"]').text()).toContain('faltam 35')
    expect(wrapper.get('[data-testid="profile-streak"]').text()).toContain('3')
    expect(wrapper.get('[data-testid="profile-first-try"]').text()).toContain('5')
    expect(wrapper.get('[data-testid="profile-missions"]').text()).toContain('1')
    expect(wrapper.get('[data-testid="profile-badge-count"]').text()).toContain('2 de 6')

    // Newest first, each with the day it was earned.
    expect(codesIn(wrapper, 'earned')).toEqual(['badge-streak_3', 'badge-first_solve'])
    expect(wrapper.get('[data-testid="badge-streak_3"] [data-testid="badge-earned-on"]').text()).toBe('Conquistada em 20/10')
  })

  it('T-FE-PROFILE-01 skill bars share one scale with marks at the badge milestones', async () => {
    const wrapper = await open()

    const ordering = wrapper.get('[data-testid="skill-progress-ordering"]')
    expect(ordering.text()).toContain('4 resolvidos')
    expect(ordering.text()).toContain('próxima insígnia aos 7')
    expect(ordering.get('[role="progressbar"]').attributes('aria-valuemax')).toBe('15')
    expect(ordering.get('[role="progressbar"]').attributes('aria-valuetext')).toBe('4 resolvidos, próxima insígnia aos 7')

    const pattern = wrapper.get('[data-testid="skill-progress-pattern"]')
    expect(pattern.text()).toContain('todas as insígnias')
    expect(pattern.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('15')
  })

  it('T-FE-PROFILE-02 a locked badge is greyed with its condition and a secret one hides it', async () => {
    const wrapper = await open()

    // The closest countable badge comes first, with how far it is.
    expect(codesIn(wrapper, 'next')).toEqual(['badge-skill_ordering_7', 'badge-skill_grouping_15'])
    const locked = wrapper.get('[data-testid="badge-skill_ordering_7"]')
    expect(locked.attributes('data-earned')).toBe('false')
    expect(locked.get('[data-testid="badge-disc"]').attributes('stroke-dasharray')).toBe('5 4')
    expect(locked.get('[data-testid="badge-condition"]').text()).toBe('Para conquistar: 7 desafios de ordenação resolvidos')
    expect(locked.get('[data-testid="badge-progress"]').text()).toBe('Progresso: 4 de 7')

    // The rest stays folded until asked for.
    const toggle = wrapper.get('[data-testid="badges-others-toggle"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBe('badges-others')
    // Folded with v-show, so aria-controls always points at a real element.
    expect(wrapper.get('#badges-others').attributes('style')).toContain('display: none')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('#badges-others').attributes('style') ?? '').not.toContain('display: none')
    expect(codesIn(wrapper, 'others')).toEqual(['badge-daily_7', 'badge-all_types_day'])

    const secret = wrapper.get('[data-testid="badge-all_types_day"]')
    expect(secret.get('[data-testid="badge-name"]').text()).toBe('Insígnia secreta')
    expect(secret.find('[data-testid="badge-condition"]').exists()).toBe(false)
    expect(secret.text()).not.toContain('🌈')
  })

  it('marks badges earned in the last week as new', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-26T12:00:00-03:00'))
    try {
      const wrapper = await open()

      // Earned on 20/10: 6 days ago. Earned on 18/10: 8 days ago.
      expect(wrapper.find('[data-testid="badge-streak_3"] [data-testid="badge-new"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="badge-first_solve"] [data-testid="badge-new"]').exists()).toBe(false)
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('a student without badges is pointed to a first challenge', async () => {
    const wrapper = await open({
      xp: 0,
      level: 1,
      badges: profile.badges.map((b) => ({ ...b, earned: false, earned_at: null })),
    })

    const first = wrapper.get('[data-testid="badges-first"]')
    expect(first.text()).toContain('Nenhuma insígnia ainda')
    expect(first.find('[data-testid="badge-first_solve"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="profile-start"]').attributes('href')).toBe('/')
    // One clear goal: no shelf, no list of other near badges, and the first badge is not repeated.
    expect(wrapper.find('[data-testid="badges-earned"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="badges-next"]').exists()).toBe(false)
    expect(wrapper.find('#badges-others [data-testid="badge-first_solve"]').exists()).toBe(false)
  })

  it('T-FE-PROFILE-03 the public toggle calls the settings endpoint', async () => {
    vi.mocked(studentService.updateSettings).mockResolvedValue({ profile_public: true })
    const wrapper = await open()
    const toggle = wrapper.get('[data-testid="profile-public-toggle"]')
    expect((toggle.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.find('[data-testid="profile-public-link"]').exists()).toBe(false)

    await toggle.setValue(true)
    await flushPromises()

    expect(studentService.updateSettings).toHaveBeenCalledWith({ profile_public: true })
    expect((toggle.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.get('[data-testid="profile-public-status"]').text()).toBe('Salvo.')
    expect(wrapper.get('[data-testid="profile-public-link"]').attributes('href')).toBe('/jogadores/ana_22')
  })

  it('T-FE-PROFILE-03 a failed toggle keeps the old value and shows the API message', async () => {
    vi.mocked(studentService.updateSettings).mockRejectedValue(
      new ApiError(500, 'internal_error', 'Ocorreu um erro inesperado. Tente de novo.'),
    )
    const wrapper = await open()
    const toggle = wrapper.get('[data-testid="profile-public-toggle"]')

    await toggle.setValue(true)
    await flushPromises()

    expect((toggle.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.get('[data-testid="profile-settings-error"]').text()).toBe(
      'Ocorreu um erro inesperado. Tente de novo. Seu perfil continua privado.',
    )
    expect(wrapper.get('[data-testid="profile-public-status"]').text()).toBe('')
  })

  it('the mute toggle updates the sound setting', async () => {
    const wrapper = await open()
    const settings = useSettingsStore()
    settings.setMuted(false)
    await flushPromises()

    await wrapper.get('[data-testid="mute-toggle"]').setValue(true)

    expect(settings.muted).toBe(true)
  })
})
