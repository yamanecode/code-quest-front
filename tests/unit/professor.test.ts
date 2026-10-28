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

const classroom: ProfClassroom = { id: 4, name: 'Turma A', join_code: 'ABC123', weekly_goal: null, closed: false, goal: null }

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
    // a draft has no solve stats to show
    expect(row.find('[data-testid="challenge-stats"]').exists()).toBe(false)
  })

  it('T-FE-PROF-04 the list shows stats only for published challenges and sorts by column', async () => {
    const published: ProfChallenge = { ...draft, id: 40, title: 'Bolo', status: 'published', origin: 'professor', solve_stats: { attempted: 5, solved: 3 } }
    const other: ProfChallenge = { ...draft, id: 41, title: 'Água', type: 'ordering', status: 'draft' }
    vi.mocked(professorService.listChallenges).mockResolvedValue([published, other])

    const list = await mountSuspended(ChallengesPage)
    await flushPromises()
    const titles = () => list.findAll('[data-testid="challenge-title"]').map((a) => a.text())

    expect(list.get('[data-testid="challenge-40"] [data-testid="challenge-stats"]').text()).toBe('3 de 5 acertaram')
    expect(list.find('[data-testid="challenge-41"] [data-testid="challenge-stats"]').exists()).toBe(false)
    expect(titles()).toEqual(['Água', 'Bolo']) // most recent first

    await list.get('[data-testid="sort-title"]').trigger('click')
    expect(titles()).toEqual(['Água', 'Bolo'])
    await list.get('[data-testid="sort-title"]').trigger('click')
    expect(titles()).toEqual(['Bolo', 'Água'])

    await list.get('[data-testid="sort-status"]').trigger('click')
    expect(titles()).toEqual(['Bolo', 'Água']) // Publicado before Rascunho
    expect(list.get('[data-testid="challenges-count"]').text()).toBe('2 de 2 desafios')
  })

  it('T-FE-PROF-01 an invalid AI draft lists the errors under the form', async () => {
    vi.mocked(professorService.generateDraft).mockRejectedValue(
      new ApiError(422, 'invalid_draft', 'A IA não gerou um desafio válido.', null, ['O enunciado é curto demais.']),
    )
    const page = await mountSuspended(NewChallengePage)
    await page.get('[data-testid="draft-topic"]').setValue('tema')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(page.get('[data-testid="draft-errors"]').text()).toContain('O enunciado é curto demais.')
    expect(page.find('[data-testid="form-errors"]').exists()).toBe(false)
  })

  it('T-FE-PROF-01 an empty topic shows the message inside the draft box', async () => {
    const page = await mountSuspended(NewChallengePage)
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(professorService.generateDraft).not.toHaveBeenCalled()
    expect(page.get('form [data-testid="draft-errors"]').text()).toBe('Escreva o tema do rascunho.')
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

  it('T-FE-PROF-03 mission edit sends title, description and the position it already has', async () => {
    vi.mocked(professorService.getMission).mockResolvedValue(mission)
    vi.mocked(professorService.listChallenges).mockResolvedValue([])
    vi.mocked(professorService.updateMission).mockImplementation(async (_id, input) => ({ ...mission, ...input }))

    const page = await mountSuspended(MissionPage, { route: '/professor/missoes/9' })
    await flushPromises()
    await page.get('[data-testid="mission-title-input"]').setValue('Missão renomeada')
    await page.get('[data-testid="mission-form"]').trigger('submit')
    await flushPromises()

    expect(professorService.updateMission).toHaveBeenCalledWith(9, {
      title: 'Missão renomeada',
      description: null,
      position: 2,
    })
    expect(page.find('[data-testid="mission-position-input"]').exists()).toBe(false)
    expect(page.find('[data-testid="mission-draft"]').exists()).toBe(false)
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

  it('T-FE-PROF-06 the mission modal lists only published challenges outside the mission and adds several at once', async () => {
    const pub = (id: number, title: string, type: ProfChallenge['type'] = 'ordering'): ProfChallenge => ({ ...draft, id, title, status: 'published', type } as ProfChallenge)
    const inside = pub(50, 'Já está')
    const withOne: ProfMission = { ...mission, challenges: [{ id: 50, title: 'Já está', type: 'ordering', status: 'published' }] }
    vi.mocked(professorService.getMission).mockResolvedValue(withOne)
    vi.mocked(professorService.listChallenges).mockResolvedValue([inside, pub(51, 'Zebra'), pub(52, 'Abelha'), { ...draft, id: 53 }])
    vi.mocked(professorService.setMissionChallenges).mockResolvedValue(withOne)

    const page = await mountSuspended(MissionPage, { route: '/professor/missoes/9' })
    await flushPromises()
    await page.get('[data-testid="mission-add-open"]').trigger('click')
    await flushPromises()

    const dialog = page.get('[data-testid="add-challenges-dialog"]')
    expect(dialog.find('[data-testid="add-row-50"]').exists()).toBe(false) // already in the mission
    expect(dialog.find('[data-testid="add-row-53"]').exists()).toBe(false) // a draft
    await dialog.get('[data-testid="add-sort-title"]').trigger('click') // A to Z
    await dialog.get('[data-testid="add-check-51"]').setValue(true)
    await dialog.get('[data-testid="add-check-52"]').setValue(true)
    expect(dialog.get('[data-testid="add-count"]').text()).toBe('2 selecionados')
    await dialog.get('[data-testid="add-confirm"]').trigger('click')
    await flushPromises()

    expect(professorService.setMissionChallenges).toHaveBeenCalledWith(9, [50, 52, 51])
  })

  it('T-FE-PROF-06 creating from a mission adds the new challenge to it', async () => {
    vi.mocked(professorService.createChallenge).mockResolvedValue({ ...draft, id: 60 })
    vi.mocked(professorService.getMission).mockResolvedValue(mission)
    vi.mocked(professorService.setMissionChallenges).mockResolvedValue(mission)
    const page = await mountSuspended(NewChallengePage, { route: '/professor/desafios/novo?missao=9' })
    expect(page.get('[data-testid="back-mission"]').attributes('href')).toBe('/professor/missoes/9')
    await page.get('[data-testid="field-title"]').setValue('Ciclo da água')
    await page.get('[data-testid="save"]').trigger('click')
    await flushPromises()
    expect(professorService.setMissionChallenges).toHaveBeenCalledWith(9, [60])
  })
})
