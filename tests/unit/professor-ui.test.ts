import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProfessorHome from '~/pages/professor/index.vue'
import MissionPage from '~/pages/professor/missoes/[id].vue'
import ClassroomPage from '~/pages/professor/turmas/[id].vue'
import AppButton from '~/components/ui/AppButton.vue'
import PeriodTabs from '~/components/game/PeriodTabs.vue'
import * as professorService from '~/services/professor'
import { ApiError } from '~/services/http'
import { useAuthStore } from '~/stores/auth'
import type { ProfClassroom, ProfMission } from '~/types/api'

vi.mock('~/services/professor', () => ({
  listClassrooms: vi.fn(),
  createClassroom: vi.fn(),
  getClassroom: vi.fn(),
  listMissions: vi.fn(),
  createMission: vi.fn(),
  getClassroomProgress: vi.fn(),
  getClassroomRanking: vi.fn(),
  getMission: vi.fn(),
  updateMission: vi.fn(),
  publishMission: vi.fn(),
  listChallenges: vi.fn(),
  closeClassroom: vi.fn(),
  reopenClassroom: vi.fn(),
  setMissionOrder: vi.fn(),
  removeMember: vi.fn(),
  renewJoinCode: vi.fn(),
}))

const classroom: ProfClassroom = { id: 4, name: 'Turma A', join_code: 'ABC123', weekly_goal: null, closed: false, goal: null }
const ROW = { username: 'ana', xp_in_class: 0, level: 1, solved_in_class: 0, missions_completed_in_class: 0, hints_used: 0, streak: 0 }
const mission = (id: number, position: number): ProfMission => ({
  id, classroom_id: 4, title: `Missão ${id}`, description: null, position, status: 'draft', challenges: [],
})

beforeEach(() => {
  localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role: 'professor', username: 'prof' }))
  useAuthStore().restore()
  for (const fn of Object.values(professorService)) vi.mocked(fn as () => unknown).mockReset()
})

describe('professor home', () => {
  it('T-FE-PROF-11 the list comes first and the new-turma form opens in a dialog', async () => {
    vi.mocked(professorService.listClassrooms).mockResolvedValue([classroom])
    const page = await mountSuspended(ProfessorHome, { route: '/professor' })
    await flushPromises()

    expect(page.find('[data-testid="create-classroom"]').exists()).toBe(false)
    expect(page.get('[data-testid="classroom-4"]').text()).toContain('Turma A')

    await page.get('[data-testid="new-classroom-open"]').trigger('click')
    expect(page.get('[data-testid="create-classroom"]').attributes('role')).toBe('dialog')

    await page.get('[data-testid="create-classroom-cancel"]').trigger('click')
    expect(page.find('[data-testid="create-classroom"]').exists()).toBe(false)
  })

  it('T-FE-PROF-11 creating a turma closes the dialog, lists it and points to the first mission', async () => {
    vi.mocked(professorService.listClassrooms).mockResolvedValue([])
    vi.mocked(professorService.createClassroom).mockResolvedValue({ ...classroom, id: 7, name: 'Turma Nova', join_code: 'XYZ789' })
    const page = await mountSuspended(ProfessorHome, { route: '/professor' })
    await flushPromises()

    await page.get('[data-testid="new-classroom-open"]').trigger('click')
    await page.get('[data-testid="new-classroom-name"]').setValue('Turma Nova')
    await page.get('[data-testid="create-classroom"]').trigger('submit')
    await flushPromises()

    expect(professorService.createClassroom).toHaveBeenCalledWith({ name: 'Turma Nova', weekly_goal: null })
    expect(page.find('[data-testid="create-classroom"]').exists()).toBe(false)
    expect(page.get('[data-testid="classroom-7"]').text()).toContain('Turma Nova')
    expect(page.get('[data-testid="created-notice"]').text()).toContain('XYZ789')
    expect(page.get('[data-testid="created-open"]').attributes('href')).toBe('/professor/turmas/7')
  })

  it('T-FE-PROF-CLOSE-03 the list marks closed turmas with the badge', async () => {
    vi.mocked(professorService.listClassrooms).mockResolvedValue([classroom, { ...classroom, id: 5, name: 'Turma B', closed: true }])
    const page = await mountSuspended(ProfessorHome, { route: '/professor' })
    await flushPromises()
    expect(page.find('[data-testid="classroom-4"] [data-testid="classroom-closed-badge"]').exists()).toBe(false)
    expect(page.get('[data-testid="classroom-5"] [data-testid="classroom-closed-badge"]').text()).toBe('Encerrada')
  })

  it('T-FE-PROF-11 an empty name keeps the dialog open with the message', async () => {
    vi.mocked(professorService.listClassrooms).mockResolvedValue([])
    const page = await mountSuspended(ProfessorHome, { route: '/professor' })
    await flushPromises()
    await page.get('[data-testid="new-classroom-open"]').trigger('click')
    await page.get('[data-testid="create-classroom"]').trigger('submit')
    expect(page.get('[data-testid="create-classroom-errors"]').text()).toBe('Dê um nome à turma.')
    expect(professorService.createClassroom).not.toHaveBeenCalled()
  })
})

describe('mission page', () => {
  it('T-FE-PROF-12 the publish result appears in the same block as the publish button', async () => {
    vi.mocked(professorService.getMission).mockResolvedValue(mission(9, 0))
    vi.mocked(professorService.listChallenges).mockResolvedValue([])
    vi.mocked(professorService.publishMission).mockRejectedValue(new ApiError(409, 'mission_empty', 'Publique pelo menos um desafio.'))
    const page = await mountSuspended(MissionPage, { route: '/professor/missoes/9' })
    await flushPromises()
    await page.get('[data-testid="mission-publish"]').trigger('click')
    await flushPromises()

    const block = page.get('[aria-labelledby="h-publication"]')
    expect(block.find('[data-testid="mission-publish"]').exists()).toBe(true)
    expect(block.get('[data-testid="mission-errors"]').text()).toContain('Publique pelo menos um desafio')
    expect(block.find('[data-testid="mission-needs-published"]').exists()).toBe(true)
  })

  it('T-FE-UI-01 delete is an outline button of the same size as the publish button, kept apart from it', async () => {
    vi.mocked(professorService.getMission).mockResolvedValue(mission(9, 0))
    vi.mocked(professorService.listChallenges).mockResolvedValue([])
    const page = await mountSuspended(MissionPage, { route: '/professor/missoes/9' })
    await flushPromises()

    const remove = page.get('[data-testid="mission-delete"]')
    const publish = page.get('[data-testid="mission-publish"]')
    const sizeOf = (classes: string[]) => classes.filter((c) => /^(min-h|px|py|text-lg|font)/.test(c)).sort()
    expect(sizeOf(remove.classes())).toEqual(sizeOf(publish.classes()))
    expect(remove.classes()).not.toContain('bg-go')
    expect(page.get('[aria-labelledby="h-publication"]').find('[data-testid="mission-delete"]').exists()).toBe(false)
  })
})

describe('turma page', () => {
  async function open(missions: ProfMission[], attachTo?: HTMLElement, students: (typeof ROW)[] = []) {
    vi.mocked(professorService.getClassroom).mockResolvedValue(classroom)
    vi.mocked(professorService.getClassroomProgress).mockResolvedValue({ completed_all_pct: 0, students })
    vi.mocked(professorService.getClassroomRanking).mockResolvedValue({ scope: 'classroom', period: 'week', entries: [] })
    vi.mocked(professorService.listMissions).mockResolvedValue(missions)
    const page = await mountSuspended(ClassroomPage, { route: '/professor/turmas/4', attachTo })
    await flushPromises()
    return page
  }

  it('T-FE-PROF-13 a turma without missions offers the first step, which opens the new-mission dialog', async () => {
    const page = await open([])
    const next = page.get('[data-testid="missions-empty-create"]')
    expect(next.text()).toBe('Criar a primeira missão')
    expect(page.find('[data-testid="create-mission"]').exists()).toBe(false)
    await next.trigger('click')
    expect(page.get('[data-testid="create-mission"]').attributes('role')).toBe('dialog')
  })

  it('T-FE-PROF-15 the new-mission form is a dialog: it creates, closes, lists the mission and links to it', async () => {
    const page = await open([mission(1, 0)])
    vi.mocked(professorService.createMission).mockResolvedValue({ ...mission(5, 1), title: 'Frações' })

    expect(page.find('[data-testid="create-mission"]').exists()).toBe(false)
    await page.get('[data-testid="new-mission-open"]').trigger('click')
    await page.get('[data-testid="new-mission-title"]').setValue('Frações')
    await page.get('[data-testid="new-mission-description"]').setValue('  ')
    await page.get('[data-testid="create-mission"]').trigger('submit')
    await flushPromises()

    expect(professorService.createMission).toHaveBeenCalledWith(4, { title: 'Frações', description: null })
    expect(page.find('[data-testid="create-mission"]').exists()).toBe(false)
    expect(page.findAll('[data-testid="mission-title"]').map((a) => a.text())).toEqual(['Missão 1', 'Frações'])
    expect(page.get('[data-testid="mission-created-open"]').attributes('href')).toBe('/professor/missoes/5')
  })

  it('T-FE-PROF-15 an empty title keeps the dialog open with the message, and Cancelar closes it', async () => {
    const page = await open([])
    await page.get('[data-testid="new-mission-open"]').trigger('click')
    await page.get('[data-testid="create-mission"]').trigger('submit')
    expect(page.get('[data-testid="create-mission-errors"]').text()).toBe('Dê um título à missão.')
    expect(professorService.createMission).not.toHaveBeenCalled()

    await page.get('[data-testid="create-mission-cancel"]').trigger('click')
    expect(page.find('[data-testid="create-mission"]').exists()).toBe(false)
  })

  it('T-FE-PROF-MEMBER-02 the confirm button stays disabled until the typed username matches exactly', async () => {
    const page = await open([], undefined, [ROW])
    await page.get('[data-testid="member-remove-ana"]').trigger('click')
    const submit = () => page.get('[data-testid="remove-member-submit"]')
    expect(submit().attributes('disabled')).toBeDefined()

    await page.get('[data-testid="remove-member-name"]').setValue('An')
    expect(submit().attributes('disabled')).toBeDefined()
    await page.get('[data-testid="remove-member-name"]').setValue('ana ')
    expect(submit().attributes('disabled')).toBeDefined()
    await page.get('[data-testid="remove-member"]').trigger('submit')
    expect(professorService.removeMember).not.toHaveBeenCalled()

    await page.get('[data-testid="remove-member-name"]').setValue('ana')
    expect(submit().attributes('disabled')).toBeUndefined()
  })

  it('T-FE-PROF-MEMBER-03 after the removal the table is read again without that student', async () => {
    const page = await open([], undefined, [ROW])
    vi.mocked(professorService.getClassroomProgress).mockResolvedValue({ completed_all_pct: 0, students: [] })
    vi.mocked(professorService.removeMember).mockResolvedValue()

    await page.get('[data-testid="member-remove-ana"]').trigger('click')
    await page.get('[data-testid="remove-member-name"]').setValue('ana')
    await page.get('[data-testid="remove-member"]').trigger('submit')
    await flushPromises()

    expect(professorService.removeMember).toHaveBeenCalledWith(4, 'ana')
    expect(page.find('[data-testid="remove-member"]').exists()).toBe(false)
    expect(page.find('[data-testid="member-remove-ana"]').exists()).toBe(false)
  })

  it('T-FE-PROF-MEMBER-03 member_not_found shows the message and the table is read again', async () => {
    const page = await open([], undefined, [ROW])
    vi.mocked(professorService.getClassroomProgress).mockResolvedValue({ completed_all_pct: 0, students: [] })
    vi.mocked(professorService.removeMember).mockRejectedValue(new ApiError(404, 'member_not_found', 'Estudante não está na turma.'))

    await page.get('[data-testid="member-remove-ana"]').trigger('click')
    await page.get('[data-testid="remove-member-name"]').setValue('ana')
    await page.get('[data-testid="remove-member"]').trigger('submit')
    await flushPromises()

    expect(page.get('[data-testid="remove-member-errors"]').text()).toBe('Estudante não está na turma.')
    expect(page.find('[data-testid="member-remove-ana"]').exists()).toBe(false)
  })

  it('T-FE-PROF-CODE-02 the new code is requested only after the confirmation, then it is shown', async () => {
    const page = await open([])
    vi.mocked(professorService.renewJoinCode).mockResolvedValue({ ...classroom, join_code: 'NEW999' })

    await page.get('[data-testid="renew-code"]').trigger('click')
    expect(professorService.renewJoinCode).not.toHaveBeenCalled()
    expect(page.get('[data-testid="code-dialog"]').text()).toContain('O código atual deixa de funcionar')
    await page.get('[data-testid="code-dialog-cancel"]').trigger('click')
    expect(professorService.renewJoinCode).not.toHaveBeenCalled()

    await page.get('[data-testid="renew-code"]').trigger('click')
    await page.get('[data-testid="code-dialog-confirm"]').trigger('click')
    await flushPromises()
    expect(professorService.renewJoinCode).toHaveBeenCalledWith(4)
    expect(page.get('[data-testid="join-code"]').text()).toBe('NEW999')
    expect(page.find('[data-testid="code-dialog"]').exists()).toBe(false)
  })

  it('T-FE-PROF-CODE-02 a failed renewal keeps the dialog open with the message inside it', async () => {
    const page = await open([])
    vi.mocked(professorService.renewJoinCode).mockRejectedValue(new ApiError(404, 'classroom_not_found', 'Turma não encontrada.'))
    await page.get('[data-testid="renew-code"]').trigger('click')
    await page.get('[data-testid="code-dialog-confirm"]').trigger('click')
    await flushPromises()
    expect(page.get('[data-testid="code-dialog-error"]').text()).toContain('Turma não encontrada.')
    expect(page.get('[data-testid="join-code"]').text()).toBe('ABC123')
  })

  it('T-FE-PROF-CODE-03 the order advice sits in the "?" next to the code and changes when the turma is closed', async () => {
    const page = await open([])
    expect(page.find('[data-testid="renew-hint"]').exists()).toBe(false)
    await page.get('[data-testid="help-join-code"]').trigger('click')
    expect(page.get('[data-testid="help-join-code-panel"]').text()).toContain('Primeiro remova o estudante')

    vi.mocked(professorService.closeClassroom).mockResolvedValue({ ...classroom, closed: true })
    await page.get('[data-testid="classroom-close"]').trigger('click')
    await page.get('[data-testid="close-dialog-confirm"]').trigger('click')
    await flushPromises()
    expect(page.get('[data-testid="help-join-code-panel"]').text()).toContain('não funciona mais para novos alunos')
  })

  it('T-FE-PROF-MEMBER-04 the remove button is in the first column, next to the username, and the confirm is red', async () => {
    const page = await open([], undefined, [ROW])
    const row = page.get('[data-testid="progress-ana"]')
    expect(row.get('th').find('[data-testid="member-remove-ana"]').exists()).toBe(true)
    await row.get('[data-testid="member-remove-ana"]').trigger('click')
    expect(page.get('[data-testid="remove-member-submit"]').classes()).toContain('bg-error-bg')
  })

  it('T-FE-PROF-MEMBER-05 after a removal the ranking, the member count and the focus follow the new state', async () => {
    const attach = document.createElement('div')
    document.body.appendChild(attach)
    const page = await open([], attach, [ROW])
    vi.mocked(professorService.getClassroomProgress).mockResolvedValue({ completed_all_pct: 0, students: [] })
    vi.mocked(professorService.getClassroomRanking).mockResolvedValue({ scope: 'classroom', period: 'week', entries: [] })
    vi.mocked(professorService.removeMember).mockResolvedValue()

    const opener = page.get('[data-testid="member-remove-ana"]')
    ;(opener.element as HTMLElement).focus()
    await opener.trigger('click')
    await page.get('[data-testid="remove-member-name"]').setValue('ana')
    await page.get('[data-testid="remove-member"]').trigger('submit')
    await flushPromises()

    expect(professorService.getClassroom).toHaveBeenCalledTimes(2)
    expect(professorService.getClassroomRanking).toHaveBeenCalledTimes(2)
    expect(document.activeElement?.id).toBe('h-progress')
    attach.remove()
  })

  it('T-FE-PROF-13 the first-step button is gone once there are missions', async () => {
    const page = await open([mission(1, 0)])
    expect(page.find('[data-testid="missions-empty-create"]').exists()).toBe(false)
  })

  it('T-FE-PROF-14 the ranking period tabs reload the full ranking', async () => {
    const page = await open([])
    await page.get('[data-testid="ranking-tab-month"]').trigger('click')
    await flushPromises()
    expect(professorService.getClassroomRanking).toHaveBeenLastCalledWith(4, 'month')
    expect(page.get('[data-testid="ranking-tab-month"]').attributes('aria-selected')).toBe('true')
  })

  it('T-FE-PROF-CLOSE-02 closing asks first and calls the service only after the confirmation', async () => {
    const page = await open([])
    vi.mocked(professorService.closeClassroom).mockResolvedValue({ ...classroom, closed: true })

    await page.get('[data-testid="classroom-close"]').trigger('click')
    expect(professorService.closeClassroom).not.toHaveBeenCalled()
    expect(page.get('[data-testid="close-dialog"]').text()).toContain('Novos estudantes não poderão entrar com o código')

    await page.get('[data-testid="close-dialog-cancel"]').trigger('click')
    expect(page.find('[data-testid="close-dialog"]').exists()).toBe(false)
    expect(professorService.closeClassroom).not.toHaveBeenCalled()

    await page.get('[data-testid="classroom-close"]').trigger('click')
    await page.get('[data-testid="close-dialog-confirm"]').trigger('click')
    await flushPromises()
    expect(professorService.closeClassroom).toHaveBeenCalledWith(4)
    expect(page.find('[data-testid="close-dialog"]').exists()).toBe(false)
  })

  it('T-FE-PROF-CLOSE-03 an open turma shows Encerrar and the goal; a closed one shows the badge, Reabrir and no goal bar', async () => {
    const page = await open([])
    expect(page.find('[data-testid="classroom-closed-badge"]').exists()).toBe(false)
    expect(page.find('[data-testid="classroom-reopen"]').exists()).toBe(false)
    expect(page.find('[data-testid="classroom-goal-closed"]').exists()).toBe(false)

    vi.mocked(professorService.closeClassroom).mockResolvedValue({ ...classroom, closed: true })
    vi.mocked(professorService.reopenClassroom).mockResolvedValue({ ...classroom, closed: false })
    await page.get('[data-testid="classroom-close"]').trigger('click')
    await page.get('[data-testid="close-dialog-confirm"]').trigger('click')
    await flushPromises()

    expect(page.get('[data-testid="classroom-closed-badge"]').text()).toBe('Encerrada')
    expect(page.find('[data-testid="classroom-close"]').exists()).toBe(false)
    expect(page.get('[data-testid="classroom-goal-closed"]').text()).toBe('Turma encerrada')
    expect(page.find('[data-testid="classroom-goal"]').exists()).toBe(false)

    await page.get('[data-testid="classroom-reopen"]').trigger('click')
    await flushPromises()
    expect(professorService.reopenClassroom).toHaveBeenCalledWith(4)
    expect(page.find('[data-testid="classroom-closed-badge"]').exists()).toBe(false)
    expect(page.find('[data-testid="classroom-close"]').exists()).toBe(true)
  })

  it('T-FE-PROF-CLOSE-03 a failed close keeps the dialog open with the message inside it', async () => {
    const page = await open([])
    vi.mocked(professorService.closeClassroom).mockRejectedValue(new ApiError(404, 'classroom_not_found', 'Turma não encontrada.'))
    await page.get('[data-testid="classroom-close"]').trigger('click')
    await page.get('[data-testid="close-dialog-confirm"]').trigger('click')
    await flushPromises()
    expect(page.get('[data-testid="close-dialog-error"]').text()).toContain('Turma não encontrada.')
    expect(page.find('[data-testid="classroom-closed-badge"]').exists()).toBe(false)

    await page.get('[data-testid="close-dialog-cancel"]').trigger('click')
    await page.get('[data-testid="classroom-close"]').trigger('click')
    expect(page.find('[data-testid="close-dialog-error"]').exists()).toBe(false)
  })

})

describe('shared controls', () => {
  it('T-FE-UI-01 every button variant has the same size classes, only the colours differ', async () => {
    const size = async (variant: 'primary' | 'secondary' | 'danger') => {
      const wrapper = await mountSuspended(AppButton, { props: { variant }, slots: { default: 'Ok' } })
      return wrapper.classes().filter((c) => /^(min-h|px|py|text-lg|font|border-2)/.test(c)).sort()
    }
    const primary = await size('primary')
    expect(await size('secondary')).toEqual(primary)
    expect(await size('danger')).toEqual(primary)
  })

  it('T-FE-UI-01 AppButton with `to` renders a link and without it a button of the given type', async () => {
    const link = await mountSuspended(AppButton, { props: { to: '/inicio' }, slots: { default: 'Ir' } })
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('/inicio')
    const button = await mountSuspended(AppButton, { props: { type: 'submit' }, slots: { default: 'Enviar' } })
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('type')).toBe('submit')
  })

  it('T-FE-UI-02 period tabs follow the WAI-ARIA tabs pattern and emit the chosen period', async () => {
    const wrapper = await mountSuspended(PeriodTabs, { props: { modelValue: 'week', panelId: 'panel' } })
    expect(wrapper.get('[data-testid="ranking-tab-week"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[data-testid="ranking-tab-month"]').attributes('tabindex')).toBe('-1')
    expect(wrapper.get('[data-testid="ranking-tab-week"]').attributes('aria-controls')).toBe('panel')

    await wrapper.get('[data-testid="ranking-tab-week"]').trigger('keydown', { key: 'End' })
    await wrapper.get('[data-testid="ranking-tab-week"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['month'], ['week']])
  })
})
