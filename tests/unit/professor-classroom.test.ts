import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ClassroomPage from '~/pages/professor/turmas/[id].vue'
import SkillMix from '~/components/professor/SkillMix.vue'
import * as professorService from '~/services/professor'
import { useAuthStore } from '~/stores/auth'
import type { ProfClassroom, ProfMission } from '~/types/api'

vi.mock('~/services/professor', () => ({
  getClassroom: vi.fn(),
  listMissions: vi.fn(),
  getClassroomProgress: vi.fn(),
  getClassroomRanking: vi.fn(),
  setMissionOrder: vi.fn(),
  updateClassroom: vi.fn(),
}))

const classroom: ProfClassroom = { id: 4, name: 'Turma A', join_code: 'ABC123', weekly_goal: null, closed: false, goal: null }

function mission(id: number, position: number, challenges: ProfMission['challenges'] = []): ProfMission {
  return { id, classroom_id: 4, title: `Missão ${id}`, description: null, position, status: 'draft', challenges }
}

const published = (id: number, type: ProfMission['challenges'][number]['type']) => ({ id, title: `D${id}`, type, status: 'published' as const })

beforeEach(() => {
  localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role: 'professor', username: 'prof' }))
  useAuthStore().restore()
  for (const fn of Object.values(professorService)) vi.mocked(fn as () => unknown).mockReset()
  vi.mocked(professorService.getClassroom).mockResolvedValue(classroom)
  vi.mocked(professorService.getClassroomProgress).mockResolvedValue({ completed_all_pct: 0, students: [] })
  vi.mocked(professorService.getClassroomRanking).mockResolvedValue({ scope: 'classroom', period: 'week', entries: [] })
})

async function open(missions: ProfMission[]) {
  vi.mocked(professorService.listMissions).mockResolvedValue(missions)
  const page = await mountSuspended(ClassroomPage, { route: '/professor/turmas/4' })
  await flushPromises()
  return page
}

describe('professor turma page', () => {
  it('T-FE-PROF-ORDER-01 moving a mission down makes one call with the full id list and shows the response', async () => {
    vi.mocked(professorService.setMissionOrder).mockResolvedValue([mission(2, 0), mission(1, 1), mission(3, 2)])
    const page = await open([mission(1, 0), mission(2, 1), mission(3, 2)])

    await page.get('[data-testid="mission-down-1"]').trigger('click')
    await flushPromises()

    expect(page.findAll('[data-testid="mission-title"]').map((a) => a.text())).toEqual(['Missão 2', 'Missão 1', 'Missão 3'])
    expect(professorService.setMissionOrder).toHaveBeenCalledTimes(1)
    expect(professorService.setMissionOrder).toHaveBeenCalledWith(4, [2, 1, 3])
  })

  it('T-FE-PROF-07 the first mission cannot go up and the last cannot go down', async () => {
    const page = await open([mission(1, 0), mission(2, 1)])
    expect(page.get('[data-testid="mission-up-1"]').attributes('disabled')).toBeDefined()
    expect(page.get('[data-testid="mission-down-2"]').attributes('disabled')).toBeDefined()
  })

  it('T-FE-PROF-ORDER-01 a failed move keeps the old order and shows the message', async () => {
    vi.mocked(professorService.setMissionOrder).mockRejectedValue(new Error('Falhou.'))
    const page = await open([mission(1, 0), mission(2, 1)])
    await page.get('[data-testid="mission-down-1"]').trigger('click')
    await flushPromises()
    expect(page.findAll('[data-testid="mission-title"]').map((a) => a.text())).toEqual(['Missão 1', 'Missão 2'])
    expect(page.get('[data-testid="mission-move-error"]').text()).toBe('Falhou.')
    expect(professorService.setMissionOrder).toHaveBeenCalledTimes(1)
  })

  it('T-FE-PROF-08 each mission shows how its challenges spread over the skills', async () => {
    const page = await open([mission(1, 0, [published(1, 'ordering'), published(2, 'ordering'), published(3, 'pattern')]), mission(2, 1)])
    const mix = page.get('[data-testid="mission-1"] [data-testid="skill-mix"]')
    expect(mix.findAll('[data-skill]').map((s) => s.attributes('data-skill'))).toEqual(['ordering', 'pattern'])
    expect(mix.text()).toContain('Algoritmos 2')
    expect(mix.text()).toContain('Padrões 1')
    expect(page.get('[data-testid="mission-2"] [data-testid="skill-mix-empty"]').text()).toBe('Sem desafios ainda.')
  })

  it('T-FE-PROF-09 the turma shows its code with a copy button', async () => {
    const page = await open([])
    expect(page.get('[data-testid="join-code"]').text()).toBe('ABC123')
    expect(page.find('[data-testid="copy-code-4"]').exists()).toBe(true)
  })

  it('T-FE-PROF-10 the goal card explains the purpose and how an empty goal is calculated', async () => {
    vi.mocked(professorService.getClassroomProgress).mockResolvedValue({
      completed_all_pct: 0,
      students: Array.from({ length: 4 }, (_, i) => ({ username: `a${i}`, xp_in_class: 0, level: 1, solved_in_class: 0, missions_completed_in_class: 0, hints_used: 0, streak: 0 })),
    })
    const page = await open([])
    const how = page.get('[data-testid="goal-how"]').text()
    expect(how).toContain('5 desafios por aluno, no mínimo 10')
    expect(how).toContain('com 4 alunos: 20')
    expect(page.get('[data-testid="goal-editor"]').text()).toContain('Vazio = meta automática.')
  })
})

describe('skill mix', () => {
  it('T-FE-PROF-08 the bar widths follow the counts', async () => {
    const wrapper = await mountSuspended(SkillMix, { props: { challenges: [{ type: 'grouping' }, { type: 'grouping' }, { type: 'filtering' }] } })
    const grow = wrapper.findAll('[data-skill]').map((s) => (s.element as HTMLElement).style.flexGrow)
    expect(grow).toEqual(['2', '1'])
  })
})
