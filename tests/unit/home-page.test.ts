import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import HomePage from '~/pages/index.vue'
import * as studentService from '~/services/student'
import * as classroomService from '~/services/classrooms'
import { useAuthStore } from '~/stores/auth'
import { usePlayStore } from '~/stores/play'
import type { MissionDetail, Missions } from '~/types/api'

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
    { id: 4, name: 'Turma Demo', missions: [{ id: 21, title: 'Missão de exemplo', description: null, total: 4, solved: 2 }] },
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

  it('T-FE-HOME-02 a turma without missions shows the empty-state text', async () => {
    signIn('ana')
    const wrapper = await openHome()

    expect(wrapper.get('[data-testid="home-classroom-empty-5"]').text()).toBe('Seu professor ainda não publicou missões')
    expect(wrapper.find('[data-testid="home-classroom-empty-4"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="home-classroom-4"]').text()).toContain('Missão de exemplo')
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
