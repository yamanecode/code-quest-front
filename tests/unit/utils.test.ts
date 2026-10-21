import { afterEach, describe, expect, it, vi } from 'vitest'
import { CHALLENGE_TYPES } from '~/types/challenge'
import { levelTitle } from '~/utils/levels'
import { SKILLS, skillDescription, skillLabel } from '~/utils/skills'
import { CORRECT_MESSAGES, WRONG_MESSAGES, pickMessage } from '~/utils/feedback'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('levels', () => {
  it('T-FE-UTIL-01 gives the title of each level band', () => {
    expect(levelTitle(1)).toBe('Aprendiz')
    expect(levelTitle(2)).toBe('Aprendiz')
    expect(levelTitle(3)).toBe('Explorador(a)')
    expect(levelTitle(4)).toBe('Explorador(a)')
    expect(levelTitle(5)).toBe('Estrategista')
    expect(levelTitle(7)).toBe('Estrategista')
    expect(levelTitle(8)).toBe('Arquiteto(a) de soluções')
    expect(levelTitle(10)).toBe('Arquiteto(a) de soluções')
    expect(levelTitle(11)).toBe('Mestre do pensamento')
    expect(levelTitle(40)).toBe('Mestre do pensamento')
  })
})

describe('skills', () => {
  it('T-FE-UTIL-02 every challenge type has a skill label and description', () => {
    for (const type of CHALLENGE_TYPES) {
      expect(skillLabel(type).length).toBeGreaterThan(0)
      expect(skillDescription(type).length).toBeGreaterThan(0)
    }
    expect(Object.keys(SKILLS).sort()).toEqual([...CHALLENGE_TYPES].sort())
    expect(skillLabel('ordering')).toBe('Pensamento algorítmico')
    expect(skillLabel('grouping')).toBe('Decomposição')
    expect(skillLabel('filtering')).toBe('Abstração')
    expect(skillLabel('pattern')).toBe('Reconhecimento de padrões')
    expect(skillDescription('pattern')).toBe(
      'Encontrar a regra que se repete e usá-la para prever o próximo passo.',
    )
  })
})

describe('feedback messages', () => {
  it('has at least five distinct messages for each outcome', () => {
    expect(new Set(CORRECT_MESSAGES).size).toBeGreaterThanOrEqual(5)
    expect(new Set(WRONG_MESSAGES).size).toBeGreaterThanOrEqual(5)
  })

  it('picks a message from the list', () => {
    expect(pickMessage(CORRECT_MESSAGES, () => 0)).toBe(CORRECT_MESSAGES[0])
    expect(pickMessage(WRONG_MESSAGES, () => 0.999)).toBe(WRONG_MESSAGES[WRONG_MESSAGES.length - 1])
  })
})

describe('sound', () => {
  function fakeAudioContext() {
    const node = () => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 0 },
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      type: 'sine',
    })
    return vi.fn(function (this: Record<string, unknown>) {
      this.currentTime = 0
      this.destination = {}
      this.state = 'running'
      this.createOscillator = vi.fn(node)
      this.createGain = vi.fn(node)
    })
  }

  it('T-FE-UTIL-03 does nothing when muted', async () => {
    const AudioContextMock = fakeAudioContext()
    vi.stubGlobal('AudioContext', AudioContextMock)
    const { playTone } = await import('~/utils/sound')

    playTone('correct', { muted: true })
    playTone('levelUp', { muted: true })
    playTone('badge', { muted: true })

    expect(AudioContextMock).not.toHaveBeenCalled()
  })

  it('T-FE-UTIL-03 plays a tone when not muted', async () => {
    const AudioContextMock = fakeAudioContext()
    vi.stubGlobal('AudioContext', AudioContextMock)
    const { playTone } = await import('~/utils/sound')

    playTone('correct', { muted: false })

    expect(AudioContextMock).toHaveBeenCalledTimes(1)
  })

  it('T-FE-UTIL-03 does nothing when the browser has no AudioContext', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const { playTone } = await import('~/utils/sound')

    expect(() => playTone('badge', { muted: false })).not.toThrow()
  })
})
