import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ChallengePage from '~/pages/desafios/[id].vue'
import * as studentService from '~/services/student'
import type { ChallengeForStudent, SubmissionResult } from '~/types/api'
import type { ChallengeType } from '~/types/challenge'

mockNuxtImport('navigateTo', () => vi.fn())

vi.mock('~/services/student', () => ({
  getChallenge: vi.fn(),
  submitAnswer: vi.fn(),
  requestHint: vi.fn(),
  getMission: vi.fn(),
  getMe: vi.fn(),
}))

const items = [
  { id: 'a', text: 'Abrir a torneira' },
  { id: 'b', text: 'Encher o copo' },
  { id: 'c', text: 'Fechar a torneira' },
  { id: 'd', text: 'Beber a água' },
]

const byType: Record<ChallengeType, Pick<ChallengeForStudent, 'content' | 'skill'>> = {
  ordering: { skill: 'Pensamento algorítmico', content: { items } },
  grouping: {
    skill: 'Decomposição',
    content: { groups: [{ id: 'g1', text: 'Antes' }, { id: 'g2', text: 'Depois' }], items },
  },
  filtering: { skill: 'Abstração', content: { question: 'O que é preciso para beber água?', items } },
  pattern: {
    skill: 'Reconhecimento de padrões',
    content: {
      sequence: ['2', '4', '8'],
      options: [{ id: 'a', text: '10' }, { id: 'b', text: '16' }, { id: 'c', text: '12' }, { id: 'd', text: '9' }],
    },
  },
} as never

const wrong: SubmissionResult = {
  is_correct: false, xp_earned: 0, xp: 50, level: 2, title: 'Aprendiz', level_up: false,
  new_badges: [], explanation: null, hint: 'Pense no que vem primeiro. Qual seria?',
}

function challengeOf(type: ChallengeType): ChallengeForStudent {
  return {
    id: 7, title: 'Desafio', statement: 'Uma situação do dia a dia para você resolver agora.', type,
    ...byType[type], solved: false, hints_left: 5, cooldown_seconds_left: 0,
  } as ChallengeForStudent
}

function accessibleName(el: Element, root: Element): string {
  const label = el.getAttribute('aria-label')?.trim()
  if (label) return label
  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy) {
    const text = labelledBy.split(/\s+/).map((id) => root.querySelector(`#${id}`)?.textContent ?? '').join(' ').trim()
    if (text) return text
  }
  if (el.id) {
    const text = root.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()
    if (text) return text
  }
  return (el.closest('label')?.textContent ?? el.textContent ?? '').trim()
}

function expectControlsNamed(root: Element) {
  const controls = root.querySelectorAll('button, select, input, a[href]')
  expect(controls.length).toBeGreaterThan(0)
  for (const el of controls) {
    expect(accessibleName(el, root), `no accessible name: ${el.outerHTML.slice(0, 120)}`).not.toBe('')
    expect(el.getAttribute('data-testid'), `no data-testid: ${el.outerHTML.slice(0, 120)}`).toBeTruthy()
  }
}

async function open(type: ChallengeType) {
  vi.mocked(studentService.getChallenge).mockResolvedValue(challengeOf(type))
  const wrapper = await mountSuspended(ChallengePage, { route: '/desafios/7' })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.mocked(studentService.getMe).mockReset().mockResolvedValue(undefined as never)
  vi.mocked(studentService.submitAnswer).mockReset().mockResolvedValue(wrong)
})

describe('challenge page accessibility', () => {
  it('T-FE-A11Y-01 the feedback region is aria-live and receives the outcome', async () => {
    const wrapper = await open('pattern')
    const region = wrapper.get('[data-testid="feedback-region"]')
    expect(region.attributes('aria-live')).toBe('polite')

    await wrapper.get('[data-testid="pattern-option-b"]').setValue(true)
    await wrapper.get('[data-testid="challenge-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="feedback-region"]').attributes('aria-live')).toBe('polite')
    expect(wrapper.get('[data-testid="feedback-region"]').text()).not.toBe('')
  })

  it.each(['ordering', 'grouping', 'filtering', 'pattern'] as const)(
    'T-FE-A11Y-02 every control of the %s challenge has an accessible name and a test id',
    async (type) => {
      const wrapper = await open(type)
      expectControlsNamed(wrapper.element)
    },
  )
})
