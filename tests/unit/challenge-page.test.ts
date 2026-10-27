import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ChallengePage from '~/pages/desafios/[id].vue'
import * as studentService from '~/services/student'
import { ApiError } from '~/services/http'
import { useSettingsStore } from '~/stores/settings'
import type { ChallengeForStudent, MissionDetail, SubmissionResult } from '~/types/api'
import { playTone } from '~/utils/sound'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

vi.mock('~/services/student', () => ({
  getChallenge: vi.fn(),
  submitAnswer: vi.fn(),
  requestHint: vi.fn(),
  getMission: vi.fn(),
  getMe: vi.fn(),
}))

// The real tone helper runs, so a muted answer is checked down to the Web Audio calls.
vi.mock('~/utils/sound', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/utils/sound')>()
  return { playTone: vi.fn(original.playTone) }
})

const { createOscillator } = vi.hoisted(() => ({ createOscillator: vi.fn() }))

function stubAudio() {
  const node = () => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  })
  createOscillator.mockReset().mockImplementation(node)
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function (this: Record<string, unknown>) {
      this.currentTime = 0
      this.destination = {}
      this.createOscillator = createOscillator
      this.createGain = vi.fn(node)
    }),
  )
}

const challenge: ChallengeForStudent = {
  id: 7,
  title: 'Próximo número',
  statement: 'Descubra a regra da sequência e escolha o próximo número.',
  type: 'pattern',
  skill: 'Reconhecimento de padrões',
  content: {
    sequence: ['2', '4', '8', '16'],
    options: [
      { id: 'a', text: '18' },
      { id: 'b', text: '32' },
      { id: 'c', text: '24' },
      { id: 'd', text: '20' },
    ],
  },
  solved: false,
  hints_left: 5,
  cooldown_seconds_left: 0,
}

const correct: SubmissionResult = {
  is_correct: true,
  xp_earned: 10,
  xp: 60,
  level: 2,
  title: 'Aprendiz',
  level_up: false,
  new_badges: [],
  explanation: 'Cada termo é o dobro do anterior.',
  hint: null,
}

const wrong: SubmissionResult = {
  ...correct,
  is_correct: false,
  xp_earned: 0,
  xp: 50,
  explanation: null,
  hint: 'Compare cada número com o anterior. O que acontece?',
}

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

async function open(route = '/desafios/7', overrides: Partial<ChallengeForStudent> = {}) {
  vi.mocked(studentService.getChallenge).mockResolvedValue({ ...challenge, ...overrides } as ChallengeForStudent)
  const wrapper = await mountSuspended(ChallengePage, { route })
  await flushPromises()
  return wrapper
}

async function answer(wrapper: Wrapper, result: SubmissionResult) {
  vi.mocked(studentService.submitAnswer).mockResolvedValue(result)
  await wrapper.get('[data-testid="pattern-option-b"]').setValue(true)
  await wrapper.get('[data-testid="challenge-submit"]').trigger('click')
  await flushPromises()
}

const hintButton = (wrapper: Wrapper) => wrapper.get('[data-testid="challenge-hint"]')

beforeEach(() => {
  vi.mocked(studentService.getChallenge).mockReset()
  vi.mocked(studentService.submitAnswer).mockReset()
  vi.mocked(studentService.requestHint).mockReset()
  vi.mocked(studentService.getMission).mockReset()
  vi.mocked(studentService.getMe).mockReset().mockResolvedValue(undefined as never)
  vi.mocked(playTone).mockClear()
  navigateToMock.mockReset()
  localStorage.clear()
  useSettingsStore().setMuted(false)
  stubAudio()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('challenge page', () => {
  it('shows the skill with its help, the statement and no free-text input', async () => {
    const wrapper = await open()

    expect(wrapper.get('[data-testid="skill-pattern"]').text()).toContain('Reconhecimento de padrões')
    expect(wrapper.find('[data-testid="help-skill-pattern"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="challenge-statement"]').text()).toBe(challenge.statement)
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.find('input:not([type="checkbox"]):not([type="radio"])').exists()).toBe(false)
    expect(wrapper.get('[data-testid="challenge-submit"]').attributes('disabled')).toBeDefined()
  })

  it('T-FE-PLAY-01 the hint button shows the hints left and is disabled at 0', async () => {
    const wrapper = await open('/desafios/7', { hints_left: 0 })

    expect(hintButton(wrapper).text()).toBe('Dica (0 restantes)')
    expect(hintButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('T-FE-PLAY-01 a hint is shown and the button counts down the cooldown', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    vi.mocked(studentService.requestHint).mockResolvedValue({
      hint: 'Dica nível 1: pense no que acontece de um número para o outro. Qual seria?',
      level: 1,
      hints_left: 4,
      cooldown_seconds: 3,
    })
    const wrapper = await open()
    expect(hintButton(wrapper).text()).toBe('Dica (5 restantes)')

    await hintButton(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="hint-1"]').text()).toContain('Dica nível 1')
    expect(hintButton(wrapper).text()).toBe('Dica em 3 s')
    expect(hintButton(wrapper).attributes('disabled')).toBeDefined()

    vi.advanceTimersByTime(1000)
    await flushPromises()
    expect(hintButton(wrapper).text()).toBe('Dica em 2 s')

    vi.advanceTimersByTime(2000)
    await flushPromises()
    expect(hintButton(wrapper).text()).toBe('Dica (4 restantes)')
    expect(hintButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('T-FE-PLAY-01 a cooldown left on load and a 429 retry_after both start the countdown', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const wrapper = await open('/desafios/7', { cooldown_seconds_left: 2 })
    expect(hintButton(wrapper).text()).toBe('Dica em 2 s')
    vi.advanceTimersByTime(2000)
    await flushPromises()
    expect(hintButton(wrapper).attributes('disabled')).toBeUndefined()

    vi.mocked(studentService.requestHint).mockRejectedValue(
      new ApiError(429, 'hint_cooldown', 'Espere um pouco antes de pedir outra dica.', 9),
    )
    await hintButton(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="hint-error"]').text()).toBe('Espere um pouco antes de pedir outra dica.')
    expect(hintButton(wrapper).text()).toBe('Dica em 9 s')
    expect(hintButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('T-FE-PLAY-02 a correct answer shows the message, XP and explanation', async () => {
    const wrapper = await open()

    await answer(wrapper, correct)

    expect(studentService.submitAnswer).toHaveBeenCalledWith(7, { option: 'b' })
    expect(wrapper.find('[data-testid="feedback-correct"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="feedback-message"]').text().length).toBeGreaterThan(0)
    expect(wrapper.get('[data-testid="feedback-xp"]').text()).toContain('+10 XP')
    expect(wrapper.get('[data-testid="feedback-explanation"]').text()).toContain('Cada termo é o dobro do anterior.')
    expect(wrapper.get('[data-testid="feedback-region"]').attributes('aria-live')).toBe('polite')
    expect(wrapper.find('[data-testid="challenge-next"]').exists()).toBe(true)
    expect(hintButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('T-FE-PLAY-02 a wrong answer shows the hint and "Tentar novamente", never an explanation', async () => {
    const wrapper = await open()

    await answer(wrapper, wrong)

    expect(wrapper.find('[data-testid="feedback-wrong"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="feedback-explanation"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="feedback-hint"]').text()).toContain('Compare cada número')
    expect(wrapper.find('[data-testid="challenge-next"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="pattern-option-a"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="feedback-retry"]').trigger('click')

    expect(wrapper.find('[data-testid="feedback-wrong"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="pattern-option-a"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="challenge-submit"]').attributes('disabled')).toBeUndefined()
  })

  it('T-FE-PLAY-02 a correct answer shows level-up and new badges with level and title', async () => {
    const wrapper = await open()

    await answer(wrapper, {
      ...correct,
      level_up: true,
      new_badges: [{ code: 'first_solve', name: 'Primeiro desafio', description: '1 desafio resolvido', tier: 'bronze', emoji: '⭐' }],
    })

    expect(wrapper.get('[data-testid="feedback-level-up"]').text()).toContain('nível 2')
    expect(wrapper.get('[data-testid="feedback-badge-first_solve"]').text()).toContain('Primeiro desafio')
    expect(wrapper.get('[data-testid="feedback-status"]').text()).toContain('Aprendiz')
    expect(playTone).toHaveBeenCalledTimes(1)
    expect(playTone).toHaveBeenCalledWith('badge', { muted: false })
  })

  it('T-FE-PLAY-03 one tone plays on a correct answer', async () => {
    const wrapper = await open()

    await answer(wrapper, correct)

    expect(playTone).toHaveBeenCalledTimes(1)
    expect(playTone).toHaveBeenCalledWith('correct', { muted: false })
    expect(createOscillator).toHaveBeenCalled()
  })

  it('T-FE-PLAY-03 no tone on a wrong answer, and none when muted', async () => {
    const wrongWrapper = await open()
    await answer(wrongWrapper, wrong)
    expect(playTone).not.toHaveBeenCalled()

    useSettingsStore().setMuted(true)
    const wrapper = await open()
    await answer(wrapper, correct)

    expect(playTone).toHaveBeenCalledWith('correct', { muted: true })
    expect(createOscillator).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="feedback-correct"]').exists()).toBe(true)
  })
})

describe('next challenge', () => {
  const mission: MissionDetail = {
    id: 3,
    title: 'Trilha dos padrões',
    description: null,
    challenges: [
      { id: 5, title: 'Um', type: 'pattern', skill: 'Reconhecimento de padrões', solved: false },
      { id: 7, title: 'Dois', type: 'pattern', skill: 'Reconhecimento de padrões', solved: true },
      { id: 8, title: 'Três', type: 'pattern', skill: 'Reconhecimento de padrões', solved: true },
      { id: 9, title: 'Quatro', type: 'pattern', skill: 'Reconhecimento de padrões', solved: false },
    ],
  }

  async function clickNext(wrapper: Wrapper) {
    await wrapper.get('[data-testid="challenge-next"]').trigger('click')
    await flushPromises()
  }

  it('T-FE-HOME-03 "Próximo desafio" opens the next unsolved challenge of the mission', async () => {
    vi.mocked(studentService.getMission).mockResolvedValue(mission)
    const wrapper = await open('/desafios/7?missao=3')
    await answer(wrapper, correct)

    await clickNext(wrapper)

    expect(studentService.getMission).toHaveBeenCalledWith(3)
    expect(navigateToMock).toHaveBeenCalledWith('/desafios/9?missao=3')
  })

  it('T-FE-HOME-03 wraps to an earlier unsolved challenge, then goes home when none is left', async () => {
    vi.mocked(studentService.getMission).mockResolvedValue({
      ...mission,
      challenges: mission.challenges.map((c) => (c.id === 9 ? { ...c, solved: true } : c)),
    })
    const wrapper = await open('/desafios/7?missao=3')
    await answer(wrapper, correct)
    await clickNext(wrapper)
    expect(navigateToMock).toHaveBeenLastCalledWith('/desafios/5?missao=3')

    vi.mocked(studentService.getMission).mockResolvedValue({
      ...mission,
      challenges: mission.challenges.map((c) => ({ ...c, solved: true })),
    })
    await clickNext(wrapper)
    expect(navigateToMock).toHaveBeenLastCalledWith('/inicio')
  })

  it('T-FE-HOME-03 without ?missao (daily challenge) it goes back home', async () => {
    const wrapper = await open('/desafios/7')
    await answer(wrapper, correct)

    await clickNext(wrapper)

    expect(studentService.getMission).not.toHaveBeenCalled()
    expect(navigateToMock).toHaveBeenCalledWith('/inicio')
  })
})
