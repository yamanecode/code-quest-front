import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RankingPage from '~/pages/ranking.vue'
import PlayerPage from '~/pages/jogadores/[username].vue'
import * as studentService from '~/services/student'
import * as classroomService from '~/services/classrooms'
import { ApiError } from '~/services/http'
import { useAuthStore } from '~/stores/auth'
import { useRankingStore } from '~/stores/ranking'
import type { Ranking, RankingEntry } from '~/types/api'

vi.mock('~/services/student', () => ({
  getRanking: vi.fn(),
  getPlayer: vi.fn(),
}))

vi.mock('~/services/classrooms', () => ({
  listMyClassrooms: vi.fn(),
}))

function entry(position: number, username: string, xp: number, extra: Partial<RankingEntry> = {}): RankingEntry {
  return { position, username, xp, is_me: false, profile_public: false, ...extra }
}

const nearMe: Ranking = {
  scope: 'global',
  period: 'week',
  entries: [
    entry(3, 'bia', 40, { profile_public: true }),
    entry(4, 'caio', 35),
    entry(5, 'ana_22', 30, { is_me: true }),
    entry(5, 'duda', 30, { profile_public: true }),
    entry(6, 'enzo', 20),
  ],
}

async function open(ranking: Ranking = nearMe) {
  vi.mocked(studentService.getRanking).mockResolvedValue(ranking)
  const wrapper = await mountSuspended(RankingPage)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  // The store outlives each mount, so every test starts from the default choice.
  const ranking = useRankingStore()
  ranking.scope = 'global'
  ranking.period = 'week'
  vi.mocked(studentService.getRanking).mockReset()
  vi.mocked(studentService.getPlayer).mockReset()
  vi.mocked(classroomService.listMyClassrooms).mockReset().mockResolvedValue([
    { id: 4, name: 'Turma Demo', closed: false, goal: null },
  ])
})

describe('ranking page', () => {
  it('T-FE-RANK-01 renders me ± 2 and highlights me', async () => {
    const wrapper = await open()

    const rows = wrapper.findAll('[data-testid^="ranking-entry-"]')
    expect(rows.map((row) => row.attributes('data-testid'))).toEqual([
      'ranking-entry-bia',
      'ranking-entry-caio',
      'ranking-entry-ana_22',
      'ranking-entry-duda',
      'ranking-entry-enzo',
    ])

    const me = wrapper.get('[data-testid="ranking-entry-ana_22"]')
    expect(me.attributes('aria-current')).toBe('true')
    expect(me.text()).toContain('Você')
    expect(me.text()).toContain('5º')
    expect(me.text()).toContain('30 XP')
    expect(wrapper.get('[data-testid="ranking-entry-caio"]').attributes('aria-current')).toBeUndefined()
  })

  it('T-FE-RANK-01 only names with a public profile are links', async () => {
    const wrapper = await open()

    const bia = wrapper.get('[data-testid="ranking-entry-bia"] [data-testid="ranking-name"]')
    expect(bia.element.tagName).toBe('A')
    expect(bia.attributes('href')).toBe('/jogadores/bia')

    const caio = wrapper.get('[data-testid="ranking-entry-caio"] [data-testid="ranking-name"]')
    expect(caio.element.tagName).not.toBe('A')
  })

  it('T-FE-RANK-02 scope and period choose the right request', async () => {
    const wrapper = await open()
    expect(studentService.getRanking).toHaveBeenLastCalledWith({ scope: 'global', period: 'week' })

    expect(wrapper.findAll('[data-testid="ranking-scope"] option').map((o) => o.text())).toEqual(['Geral', 'Turma Demo'])
    await wrapper.get('[data-testid="ranking-scope"]').setValue('4')
    await flushPromises()
    expect(studentService.getRanking).toHaveBeenLastCalledWith({ scope: 'classroom', period: 'week', classroom_id: 4 })

    await wrapper.get('[data-testid="ranking-tab-month"]').trigger('click')
    await flushPromises()
    expect(studentService.getRanking).toHaveBeenLastCalledWith({ scope: 'classroom', period: 'month', classroom_id: 4 })
    expect(wrapper.get('[data-testid="ranking-tab-month"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-testid="ranking-tab-week"]').attributes('aria-selected')).toBe('false')
  })

  it('T-FE-RANK-01 the panel leads with my own XP, and ties are said in words', async () => {
    const wrapper = await open()

    const hero = wrapper.get('[data-testid="ranking-hero"]')
    expect(hero.text()).toContain('30 XP')
    expect(wrapper.get('[data-testid="ranking-summary"]').text()).toBe('nesta semana · você está em 5º (empate)')
    expect(wrapper.find('[data-testid="ranking-entry-ana_22"] [data-testid="ranking-tie"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="ranking-entry-caio"] [data-testid="ranking-tie"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="ranking-announcement"]').text()).toBe('Semanal, geral: você está em 5º, com 30 XP.')
    expect(wrapper.get('thead').text()).toContain('XP da semana')
    expect(wrapper.get('[data-testid="ranking-play"]').attributes('href')).toBe('/inicio')
  })

  it('T-FE-RANK-01 the podium is gold, silver and bronze, and a tie shares the colour', async () => {
    const top: Ranking = {
      scope: 'global',
      period: 'week',
      entries: [
        entry(1, 'bia', 45),
        entry(2, 'caio', 32),
        entry(2, 'duda', 32),
        entry(3, 'ana_22', 20, { is_me: true }),
        entry(4, 'enzo', 12),
      ],
    }
    const wrapper = await open(top)
    const colorOf = (name: string) => wrapper.get(`[data-testid="ranking-entry-${name}"] [data-testid="ranking-position"]`).classes()

    expect(colorOf('bia')).toContain('text-podium-1')
    expect(colorOf('caio')).toContain('text-podium-2')
    expect(colorOf('duda')).toContain('text-podium-2')
    expect(colorOf('ana_22')).toContain('text-podium-3')
    expect(colorOf('enzo')).toContain('text-ink')
  })

  it('T-FE-RANK-01 at 0 XP the hint is about my next step, never about a classmate', async () => {
    const last: Ranking = {
      scope: 'global',
      period: 'week',
      entries: [entry(17, 'bia', 25), entry(18, 'caio', 10), entry(19, 'ana_22', 0, { is_me: true })],
    }
    const wrapper = await open(last)

    expect(wrapper.get('[data-testid="ranking-tip"]').text()).toBe('Um desafio acertado de primeira vale 10 XP.')
    expect(wrapper.get('[data-testid="ranking-hero"]').text()).not.toContain('bia')
    expect(wrapper.get('[data-testid="ranking-hero"]').text()).not.toContain('caio')
  })

  it('T-FE-RANK-02 labels keep describing the shown ranking until the new one arrives', async () => {
    const wrapper = await open()
    const periodTitle = wrapper.get('[data-testid="ranking-period"]').text()
    expect(periodTitle).toMatch(/^Semana de/)

    let answer: (ranking: Ranking) => void = () => {}
    vi.mocked(studentService.getRanking).mockReturnValue(new Promise((resolve) => (answer = resolve)))
    await wrapper.get('[data-testid="ranking-tab-month"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="ranking-period"]').text()).toBe(periodTitle)
    expect(wrapper.get('thead').text()).toContain('XP da semana')
    expect(wrapper.get('[data-testid="ranking-body"]').classes()).toContain('opacity-50')

    answer({ ...nearMe, period: 'month' })
    await flushPromises()

    expect(wrapper.get('[data-testid="ranking-period"]').text()).not.toMatch(/^Semana de/)
    expect(wrapper.get('thead').text()).toContain('XP do mês')
    expect(wrapper.get('[data-testid="ranking-body"]').classes()).not.toContain('opacity-50')
  })

  it('T-FE-RANK-02 End and Home move between the period tabs', async () => {
    const wrapper = await open()

    await wrapper.get('[data-testid="ranking-tab-week"]').trigger('keydown', { key: 'End' })
    await flushPromises()
    expect(studentService.getRanking).toHaveBeenLastCalledWith({ scope: 'global', period: 'month' })

    await wrapper.get('[data-testid="ranking-tab-month"]').trigger('keydown', { key: 'Home' })
    await flushPromises()
    expect(studentService.getRanking).toHaveBeenLastCalledWith({ scope: 'global', period: 'week' })
  })

  it('T-FE-RANK-03 an all-zero window shows the empty-period message', async () => {
    const empty: Ranking = {
      scope: 'global',
      period: 'week',
      entries: [entry(1, 'ana_22', 0, { is_me: true }), entry(1, 'bia', 0)],
    }
    const wrapper = await open(empty)

    expect(wrapper.get('[data-testid="ranking-empty"]').text()).toBe(
      'Nenhum XP neste período ainda. Resolva um desafio para entrar no ranking.',
    )
    // The spec message is the only message: no XP hero, no "1º empate" for everyone.
    expect(wrapper.find('[data-testid="ranking-hero"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="ranking-tie"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="ranking-entry-bia"]').text()).toContain('—')
    expect(wrapper.find('[data-testid="ranking-play"]').exists()).toBe(true)
  })

  it('T-FE-RANK-03 a window with XP has no empty-period message', async () => {
    const wrapper = await open()

    expect(wrapper.find('[data-testid="ranking-empty"]').exists()).toBe(false)
  })

  it('shows the API message when the ranking fails', async () => {
    vi.mocked(studentService.getRanking).mockRejectedValue(
      new ApiError(404, 'classroom_not_found', 'Turma não encontrada.'),
    )
    const wrapper = await mountSuspended(RankingPage)
    await flushPromises()

    expect(wrapper.get('[data-testid="ranking-error"]').text()).toContain('Turma não encontrada.')
  })
})

describe('public player page', () => {
  // The route guard only lets a logged-in student open /jogadores/*.
  beforeEach(() => {
    localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role: 'student', username: 'ana_22' }))
    useAuthStore().restore()
  })

  afterEach(() => {
    useAuthStore().logout()
  })

  it('shows username, level, title and earned badges', async () => {
    vi.mocked(studentService.getPlayer).mockResolvedValue({
      username: 'bia',
      level: 4,
      title: 'Explorador(a)',
      badges: [{ code: 'first_solve', name: 'Primeiro desafio', tier: 'bronze', emoji: '⭐' }],
    })
    const wrapper = await mountSuspended(PlayerPage, { route: '/jogadores/bia' })
    await flushPromises()

    expect(studentService.getPlayer).toHaveBeenCalledWith('bia')
    expect(wrapper.get('[data-testid="player-username"]').text()).toBe('bia')
    expect(wrapper.get('[data-testid="player-level"]').text()).toContain('4')
    expect(wrapper.get('[data-testid="player-title"]').text()).toContain('Explorador(a)')
    expect(wrapper.get('[data-testid="badge-first_solve"]').attributes('data-earned')).toBe('true')
  })

  it('T-FE-RANK-PRIVATE shows that the profile is private when the API answers player_not_found', async () => {
    vi.mocked(studentService.getPlayer).mockRejectedValue(
      new ApiError(404, 'player_not_found', 'Perfil não encontrado.'),
    )
    const wrapper = await mountSuspended(PlayerPage, { route: '/jogadores/caio' })
    await flushPromises()

    expect(wrapper.get('[data-testid="player-error"]').text()).toContain('Este perfil é privado.')
    expect(wrapper.find('[data-testid="player-username"]').exists()).toBe(false)
  })
})
