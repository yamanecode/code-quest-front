import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type DOMWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MissionPage from '~/pages/missoes/[id].vue'
import * as studentService from '~/services/student'
import { useAuthStore } from '~/stores/auth'
import type { MissionDetail } from '~/types/api'

vi.mock('~/services/student', () => ({ getMission: vi.fn() }))

const mission: MissionDetail = {
  id: 11,
  title: 'Desafios mistos',
  description: 'Um desafio de cada habilidade.',
  challenges: [
    { id: 101, title: 'Fazer café', type: 'ordering', skill: 'Pensamento algorítmico', solved: true },
    { id: 102, title: 'Qual é o próximo?', type: 'pattern', skill: 'Reconhecimento de padrões', solved: false },
    { id: 103, title: 'Escovar os dentes', type: 'ordering', skill: 'Pensamento algorítmico', solved: false },
  ],
}

async function open() {
  vi.mocked(studentService.getMission).mockResolvedValue(mission)
  const wrapper = await mountSuspended(MissionPage, { route: '/missoes/11' })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role: 'student', username: 'ana' }))
  useAuthStore().restore()
  vi.mocked(studentService.getMission).mockReset()
})

describe('mission page', () => {
  it('T-FE-MISSION-01 a header card shows the title, description, skills and progress', async () => {
    const wrapper = await open()

    const head = wrapper.get('[data-testid="mission-head"]')
    expect(head.get('h1').text()).toBe('Desafios mistos')
    expect(head.text()).toContain('Um desafio de cada habilidade.')
    expect(head.findAll('[data-testid="mission-band"] > *').map((s: DOMWrapper<Element>) => s.attributes('data-skill'))).toEqual(['ordering', 'pattern'])
    expect(head.get('[data-testid="mission-progress"]').text()).toBe('1 de 3 resolvidos')
  })

  it('T-FE-MISSION-02 challenges are rooms in order, all open, with a suggestion on the first unsolved', async () => {
    const wrapper = await open()

    const rooms = wrapper.findAll('[data-testid^="mission-challenge-"][href]')
    expect(rooms.map((room: DOMWrapper<Element>) => room.attributes('href'))).toEqual([
      '/desafios/101?missao=11',
      '/desafios/102?missao=11',
      '/desafios/103?missao=11',
    ])
    expect(wrapper.find('[data-testid="mission-challenge-solved-101"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mission-challenge-solved-102"]').exists()).toBe(false)

    // Free order (spec §5): a suggestion, never a lock.
    const suggested = wrapper.findAll('[data-testid="mission-suggestion"]')
    expect(suggested).toHaveLength(1)
    expect(wrapper.get('[data-testid="mission-challenge-102"]').text()).toContain('continue por aqui')
    expect(wrapper.text()).not.toMatch(/bloquead/i)

    expect(wrapper.get('[data-testid="mission-finish"]').text()).toContain('3')
  })
})
