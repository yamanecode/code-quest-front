import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import HomePage from '~/pages/inicio.vue'
import * as studentService from '~/services/student'
import * as classroomService from '~/services/classrooms'
import { useAuthStore } from '~/stores/auth'
import { usePlayStore } from '~/stores/play'
import type { MissionDetail, Missions, Profile } from '~/types/api'
import { useProfileStore } from '~/stores/profile'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

vi.mock('~/services/student', () => ({
  getMissions: vi.fn(),
  getDailyChallenge: vi.fn(),
  getMission: vi.fn(),
}))
vi.mock('~/services/classrooms', () => ({ listMyClassrooms: vi.fn() }))

const missions: Missions = {
  base: [
    { id: 11, title: 'Trilha dos algoritmos', description: 'Passos em ordem.', total: 3, solved: 1 },
    { id: 12, title: 'Trilha da decomposição', description: null, total: 3, solved: 0 },
  ],
  classrooms: [
    { id: 4, name: 'Turma Demo', missions: [{ id: 21, title: 'Trilha de exemplo', description: null, total: 4, solved: 2 }] },
    { id: 5, name: 'Turma Nova', missions: [] },
  ],
}

const firstTrilha: MissionDetail = {
  id: 11,
  title: 'Trilha dos algoritmos',
  description: 'Passos em ordem.',
  challenges: [
    { id: 101, title: 'Fazer café', type: 'ordering', skill: 'Pensamento algorítmico', solved: true },
    { id: 102, title: 'Escovar os dentes', type: 'ordering', skill: 'Pensamento algorítmico', solved: false },
    { id: 103, title: 'Plantar uma muda', type: 'ordering', skill: 'Pensamento algorítmico', solved: false },
  ],
}

function signIn(username: string) {
  const auth = useAuthStore()
  auth.logout()
  localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role: 'student', username }))
  auth.restore()
}

async function openHome() {
  const wrapper = await mountSuspended(HomePage)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  localStorage.clear()
  usePlayStore().missions = null
  usePlayStore().missionSkills = {}
  vi.mocked(studentService.getMissions).mockReset().mockResolvedValue(missions)
  vi.mocked(studentService.getDailyChallenge).mockReset().mockResolvedValue({
    challenge: { id: 102, title: 'Escovar os dentes', type: 'ordering', skill: 'Pensamento algorítmico', solved: false },
    all_solved: false,
  })
  vi.mocked(studentService.getMission).mockReset().mockResolvedValue(firstTrilha)
  vi.mocked(classroomService.listMyClassrooms).mockReset().mockResolvedValue([
    { id: 4, name: 'Turma Demo', goal: { target: 10, progress: 4, week_start: '2026-10-19', completed: false } },
    { id: 5, name: 'Turma Nova', goal: null },
  ])
  navigateToMock.mockReset()
})

describe('student home', () => {
  it('shows the purpose line, the daily challenge, the base trilhas and each turma with its goal', async () => {
    signIn('ana')
    const wrapper = await openHome()

    expect(wrapper.get('[data-testid="home-purpose"]').text()).toContain('treine as 4 habilidades')
    expect(wrapper.get('[data-testid="daily-link"]').attributes('href')).toBe('/desafios/102')
    expect(wrapper.get('[data-testid="home-base"]').text()).toContain('Trilha dos algoritmos')
    expect(wrapper.get('[data-testid="mission-11"] [data-testid="mission-progress"]').text()).toBe('1 de 3 resolvidos')
    expect(wrapper.get('[data-testid="home-goal-4"] [data-testid="goal-percent"]').text()).toBe('40%')
    expect(wrapper.find('[data-testid="home-goal-5"] [data-testid="goal-none"]').exists()).toBe(true)
  })

  it('shows the all-solved message when there is no daily challenge left', async () => {
    signIn('ana')
    vi.mocked(studentService.getDailyChallenge).mockResolvedValue({ challenge: null, all_solved: true })
    const wrapper = await openHome()

    expect(wrapper.get('[data-testid="daily-all-solved"]').text()).toBe('Você resolveu todos os desafios disponíveis!')
  })

  it('T-FE-HOME-01 the welcome card is shown once per username', async () => {
    signIn('ana')
    let wrapper = await openHome()
    expect(wrapper.find('[data-testid="welcome-card"]').exists()).toBe(true)

    await wrapper.get('[data-testid="welcome-close"]').trigger('click')
    expect(wrapper.find('[data-testid="welcome-card"]').exists()).toBe(false)
    expect(localStorage.getItem('cq-welcome-ana')).toBe('dismissed')

    wrapper = await openHome()
    expect(wrapper.find('[data-testid="welcome-card"]').exists()).toBe(false)

    signIn('bia')
    wrapper = await openHome()
    expect(wrapper.find('[data-testid="welcome-card"]').exists()).toBe(true)
  })

  it('T-FE-HOME-01 "Começar" opens the first unsolved challenge of the first base trilha and closes the card', async () => {
    signIn('caio')
    const wrapper = await openHome()

    await wrapper.get('[data-testid="welcome-start"]').trigger('click')
    await flushPromises()

    expect(studentService.getMission).toHaveBeenCalledWith(11)
    expect(navigateToMock).toHaveBeenCalledWith('/desafios/102?missao=11')
    expect(localStorage.getItem('cq-welcome-caio')).toBe('dismissed')
  })

  it('T-FE-HOME-04 trail cards take the colours of the skills their challenges use', async () => {
    const mixed: MissionDetail = {
      id: 21,
      title: 'Trilha de exemplo',
      description: null,
      challenges: [
        { id: 201, title: 'A', type: 'pattern', skill: 'Reconhecimento de padrões', solved: false },
        { id: 202, title: 'B', type: 'ordering', skill: 'Pensamento algorítmico', solved: true },
        { id: 203, title: 'C', type: 'ordering', skill: 'Pensamento algorítmico', solved: false },
      ],
    }
    vi.mocked(studentService.getMission).mockImplementation(async (id: number) =>
      id === 21 ? mixed : { ...firstTrilha, id })
    signIn('ana')
    const wrapper = await openHome()

    // One skill: a single band in that skill's colour, and no skill list.
    const single = wrapper.get('[data-testid="mission-11"]')
    expect(single.findAll('[data-testid="mission-band"] > *').map((s) => s.attributes('data-skill'))).toEqual(['ordering'])
    expect(single.find('[data-testid="mission-skills"]').exists()).toBe(false)

    // Several skills: one band segment per skill, in the fixed skill order, and the skills named.
    const many = wrapper.get('[data-testid="mission-21"]')
    expect(many.findAll('[data-testid="mission-band"] > *').map((s) => s.attributes('data-skill'))).toEqual(['ordering', 'pattern'])
    expect(many.get('[data-testid="mission-skills"]').text()).toContain('Algoritmos')
    expect(many.get('[data-testid="mission-skills"]').text()).toContain('Padrões')
  })

  it('T-FE-HOME-05 shows the latest earned badges as stickers and the closest one to earn', async () => {
    const badge = (code: string, name: string, earnedAt: string | null): Profile['badges'][number] => ({
      code, name, description: `Condição de ${name}`, tier: 'bronze', emoji: '⭐', hidden: false, earned: earnedAt !== null, earned_at: earnedAt,
    })
    useProfileStore().profile = {
      username: 'ana', role: 'student', xp: 30, level: 1, title: 'Aprendiz', xp_to_next_level: 20, streak: 2,
      missions_completed: 0, solved_by_skill: { ordering: 2, grouping: 0, filtering: 0, pattern: 0 }, first_try_solves: 1,
      profile_public: false,
      badges: [
        badge('first_solve', 'Primeiro desafio', '2026-10-18T10:00:00-03:00'),
        badge('streak_3', 'Três dias seguidos', null),
        badge('skill_ordering_3', 'Algoritmos I', null),
        badge('first_try_5', 'Precisão', null),
      ],
    }
    signIn('ana')
    const wrapper = await openHome()

    const strip = wrapper.get('[data-testid="home-badges"]')
    expect(strip.get('[data-testid="badge-first_solve"]').attributes('data-earned')).toBe('true')
    // Algoritmos I (1 challenge away) and Três dias seguidos (1 day away) come before Precisão (4 away).
    expect(strip.find('[data-testid="badge-skill_ordering_3"]').exists()).toBe(true)
    expect(strip.find('[data-testid="badge-first_try_5"]').exists()).toBe(false)
    expect(strip.get('[data-testid="home-badges-all"]').attributes('href')).toBe('/perfil')
    useProfileStore().clear()
  })

  it('T-FE-HOME-02 a turma without missions shows the empty-state text', async () => {
    signIn('ana')
    const wrapper = await openHome()

    expect(wrapper.get('[data-testid="home-classroom-empty-5"]').text()).toBe('Seu professor ainda não publicou missões')
    expect(wrapper.find('[data-testid="home-classroom-empty-4"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="home-classroom-4"]').text()).toContain('Trilha de exemplo')
  })

  it('a published mission with no challenge shows a note instead of a progress bar', async () => {
    signIn('ana')
    vi.mocked(studentService.getMissions).mockResolvedValue({
      base: [{ id: 13, title: 'Trilha vazia', description: null, total: 0, solved: 0 }],
      classrooms: [],
    })
    const wrapper = await openHome()

    const card = wrapper.get('[data-testid="mission-13"]')
    expect(card.get('[data-testid="mission-empty"]').text()).toBe('Nenhum desafio disponível ainda.')
    expect(card.find('[role="progressbar"]').exists()).toBe(false)
  })
})
