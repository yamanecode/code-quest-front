import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TurmasPage from '~/pages/turmas.vue'
import ClassGoalBar from '~/components/game/ClassGoalBar.vue'
import * as classroomService from '~/services/classrooms'
import { ApiError } from '~/services/http'
import type { MyClassroom } from '~/types/api'

vi.mock('~/services/classrooms', () => ({
  listMyClassrooms: vi.fn(),
  joinClassroom: vi.fn(),
  leaveClassroom: vi.fn(),
}))

const demo: MyClassroom = {
  id: 4,
  name: 'Turma Demo',
  goal: { target: 10, progress: 6, week_start: '2026-10-19', completed: false },
}

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

async function join(wrapper: Wrapper, code: string) {
  await wrapper.get('[data-testid="join-code"]').setValue(code)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  vi.mocked(classroomService.listMyClassrooms).mockReset().mockResolvedValue([])
  vi.mocked(classroomService.joinClassroom).mockReset()
  vi.mocked(classroomService.leaveClassroom).mockReset()
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('turmas page', () => {
  it('T-FE-CLASS-01 joining by code lists the turma with its goal', async () => {
    const wrapper = await mountSuspended(TurmasPage)
    await flushPromises()
    expect(wrapper.find('[data-testid="classrooms-empty"]').exists()).toBe(true)

    vi.mocked(classroomService.joinClassroom).mockResolvedValue({ id: 4, name: 'Turma Demo' })
    vi.mocked(classroomService.listMyClassrooms).mockResolvedValue([demo])
    await join(wrapper, ' demo01 ')

    expect(classroomService.joinClassroom).toHaveBeenCalledWith('DEMO01')
    expect(wrapper.get('[data-testid="classrooms-status"]').text()).toContain('Turma Demo')
    expect(wrapper.get('[data-testid="classroom-4"] [data-testid="classroom-name"]').text()).toBe('Turma Demo')
    expect(wrapper.get('[data-testid="classroom-4"] [data-testid="goal-percent"]').text()).toBe('60%')
  })

  it('T-FE-CLASS-01 an invalid code shows the API message', async () => {
    vi.mocked(classroomService.joinClassroom).mockRejectedValue(
      new ApiError(404, 'invalid_join_code', 'Código de turma inválido.'),
    )
    const wrapper = await mountSuspended(TurmasPage)
    await flushPromises()

    await join(wrapper, 'ZZZZZZ')

    expect(wrapper.get('[data-testid="join-error"]').text()).toBe('Código de turma inválido.')
    expect(wrapper.find('[data-testid="classroom-4"]').exists()).toBe(false)
  })

  it('leaving asks for confirmation first and then removes the turma', async () => {
    vi.mocked(classroomService.listMyClassrooms).mockResolvedValue([demo])
    vi.mocked(classroomService.leaveClassroom).mockResolvedValue()
    const wrapper = await mountSuspended(TurmasPage, { attachTo: document.body })
    await flushPromises()

    await wrapper.get('[data-testid="classroom-leave-4"]').trigger('click')
    await flushPromises()
    const dialog = wrapper.get('[data-testid="leave-dialog"]')
    expect(dialog.attributes('role')).toBe('alertdialog')
    expect(document.activeElement).toBe(wrapper.get('[data-testid="leave-dialog-cancel"]').element)

    await wrapper.get('[data-testid="leave-dialog-cancel"]').trigger('click')
    expect(classroomService.leaveClassroom).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="classroom-4"]').exists()).toBe(true)

    await wrapper.get('[data-testid="classroom-leave-4"]').trigger('click')
    await wrapper.get('[data-testid="leave-dialog-confirm"]').trigger('click')
    await flushPromises()

    expect(classroomService.leaveClassroom).toHaveBeenCalledWith(4)
    expect(wrapper.find('[data-testid="classroom-4"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="leave-dialog"]').exists()).toBe(false)
  })
})

describe('ClassGoalBar', () => {
  it('T-FE-CLASS-02 renders the four milestones and the percentage', async () => {
    const wrapper = await mountSuspended(ClassGoalBar, {
      props: { goal: { target: 8, progress: 5, week_start: '2026-10-19', completed: false }, name: 'Turma Demo', testid: 'goal-4' },
    })

    expect(wrapper.get('[data-testid="goal-percent"]').text()).toBe('63%')
    expect(wrapper.get('[data-testid="goal-count"]').text()).toBe('5 de 8 desafios')
    expect(wrapper.findAll('[data-testid^="goal-milestone-"]').map((m) => m.text())).toEqual([
      '✓ 25% alcançado',
      '✓ 50% alcançado',
      '75%',
      '100%',
    ])
    const bar = wrapper.get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('5')
    expect(bar.attributes('aria-valuemax')).toBe('8')
    expect(wrapper.find('[data-testid="goal-completed"]').exists()).toBe(false)
  })

  it('T-FE-CLASS-02 a completed goal is capped at 100% and says so', async () => {
    const wrapper = await mountSuspended(ClassGoalBar, {
      props: { goal: { target: 10, progress: 12, week_start: '2026-10-19', completed: true }, name: 'Turma Demo', testid: 'goal-4' },
    })

    expect(wrapper.get('[data-testid="goal-percent"]').text()).toBe('100%')
    expect(wrapper.find('[data-testid="goal-completed"]').exists()).toBe(true)
  })

  it('T-FE-CLASS-02 a null goal shows the no-goal message and no bar', async () => {
    const wrapper = await mountSuspended(ClassGoalBar, { props: { goal: null, name: 'Turma Demo', testid: 'goal-4' } })

    expect(wrapper.get('[data-testid="goal-none"]').text()).toBe('Sem meta esta semana: a turma não tem desafios novos.')
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
  })
})
