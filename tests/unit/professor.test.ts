import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ChallengesPage from '~/pages/professor/desafios/index.vue'
import NewChallengePage from '~/pages/professor/desafios/novo.vue'
import MissionPage from '~/pages/professor/missoes/[id].vue'
import GoalEditor from '~/components/professor/GoalEditor.vue'
import * as professorService from '~/services/professor'
import { ApiError } from '~/services/http'
import { useAuthStore } from '~/stores/auth'
import type { ProfChallenge, ProfClassroom, ProfMission } from '~/types/api'

vi.mock('~/services/professor', () => ({
  listChallenges: vi.fn(),
  getChallenge: vi.fn(),
  createChallenge: vi.fn(),
  updateChallenge: vi.fn(),
  deleteChallenge: vi.fn(),
  duplicateChallenge: vi.fn(),
  publishChallenge: vi.fn(),
  unpublishChallenge: vi.fn(),
  reviewChallenge: vi.fn(),
  generateDraft: vi.fn(),
  updateClassroom: vi.fn(),
  getMission: vi.fn(),
  updateMission: vi.fn(),
  publishMission: vi.fn(),
  setMissionChallenges: vi.fn(),
}))

const draft: ProfChallenge = {
  id: 31,
  title: 'Ciclo da água',
  statement: 'Coloque as etapas do ciclo da água na ordem certa.',
  skill: 'Pensamento algorítmico',
  explanation: null,
  status: 'draft',
  origin: 'ai',
  locked: false,
  solve_stats: { attempted: 0, solved: 0 },
  type: 'ordering',
  content: {
    items: [
      { id: 'a', text: 'Evaporação' },
      { id: 'b', text: 'Condensação' },
      { id: 'c', text: 'Chuva' },
    ],
    solution: ['a', 'b', 'c'],
  },
}

const classroom: ProfClassroom = { id: 4, name: 'Turma A', join_code: 'ABC123', weekly_goal: null, goal: null }

const mission: ProfMission = {
  id: 9,
  classroom_id: 4,
  title: 'Missão 1',
  description: null,
  position: 2,
  status: 'draft',
  challenges: [],
}

beforeEach(() => {
  localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role: 'professor', username: 'prof' }))
  useAuthStore().restore()
  for (const fn of Object.values(professorService)) vi.mocked(fn as () => unknown).mockReset()
})

describe('professor pages', () => {
  it('T-FE-PROF-01 an AI draft lands as a draft, not published, in the list', async () => {
    vi.mocked(professorService.generateDraft).mockResolvedValue(draft)
    vi.mocked(professorService.getChallenge).mockResolvedValue(draft)
    vi.mocked(professorService.listChallenges).mockResolvedValue([draft])

    const page = await mountSuspended(NewChallengePage)
    await page.get('[data-testid="draft-type"]').setValue('ordering')
    await page.get('[data-testid="draft-topic"]').setValue('ciclo da água')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(professorService.generateDraft).toHaveBeenCalledWith({ type: 'ordering', topic: 'ciclo da água' })
    expect(professorService.publishChallenge).not.toHaveBeenCalled()

    const list = await mountSuspended(ChallengesPage)
    await flushPromises()
    const row = list.get('[data-testid="challenge-31"]')
    expect(row.get('[data-testid="challenge-status"]').text()).toBe('Rascunho')
    expect(row.get('[data-testid="challenge-stats"]').text()).toBe('0 de 0 acertaram')
  })

  it('T-FE-PROF-01 an invalid AI draft lists the errors under the form', async () => {
    vi.mocked(professorService.generateDraft).mockRejectedValue(
      new ApiError(422, 'invalid_draft', 'A IA não gerou um desafio válido.', null, ['O enunciado é curto demais.']),
    )
    const page = await mountSuspended(NewChallengePage)
    await page.get('[data-testid="draft-topic"]').setValue('tema')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(page.get('[data-testid="form-errors"]').text()).toContain('O enunciado é curto demais.')
  })

  it('T-FE-PROF-02 goal edit sends name and weekly_goal (a number, or null when empty)', async () => {
    vi.mocked(professorService.updateClassroom).mockImplementation(async (_id, input) => ({
      ...classroom,
      ...input,
    }))
    const wrapper = await mountSuspended(GoalEditor, { props: { classroom } })

    await wrapper.get('[data-testid="classroom-name-input"]').setValue('Turma B')
    await wrapper.get('[data-testid="weekly-goal-input"]').setValue('20')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(professorService.updateClassroom).toHaveBeenLastCalledWith(4, { name: 'Turma B', weekly_goal: 20 })

    await wrapper.get('[data-testid="weekly-goal-input"]').setValue('')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(professorService.updateClassroom).toHaveBeenLastCalledWith(4, { name: 'Turma B', weekly_goal: null })

    await wrapper.get('[data-testid="weekly-goal-input"]').setValue('abc')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(professorService.updateClassroom).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="goal-errors"]').text()).toContain('número inteiro')
  })

  it('T-FE-PROF-03 mission edit sends title, description and position', async () => {
    vi.mocked(professorService.getMission).mockResolvedValue(mission)
    vi.mocked(professorService.listChallenges).mockResolvedValue([])
    vi.mocked(professorService.updateMission).mockImplementation(async (_id, input) => ({ ...mission, ...input }))

    const page = await mountSuspended(MissionPage, { route: '/professor/missoes/9' })
    await flushPromises()
    await page.get('[data-testid="mission-title-input"]').setValue('Missão renomeada')
    await page.get('[data-testid="mission-position-input"]').setValue('0')
    await page.get('[data-testid="mission-form"]').trigger('submit')
    await flushPromises()

    expect(professorService.updateMission).toHaveBeenCalledWith(9, {
      title: 'Missão renomeada',
      description: null,
      position: 0,
    })
  })

  it('T-FE-PROF-03 publishing an empty mission shows the API message', async () => {
    vi.mocked(professorService.getMission).mockResolvedValue(mission)
    vi.mocked(professorService.listChallenges).mockResolvedValue([])
    vi.mocked(professorService.publishMission).mockRejectedValue(
      new ApiError(409, 'mission_empty', 'Publique pelo menos um desafio na missão antes de publicá-la.'),
    )
    const page = await mountSuspended(MissionPage, { route: '/professor/missoes/9' })
    await flushPromises()
    await page.get('[data-testid="mission-publish"]').trigger('click')
    await flushPromises()
    expect(page.get('[data-testid="mission-errors"]').text()).toContain('Publique pelo menos um desafio')
  })
})
