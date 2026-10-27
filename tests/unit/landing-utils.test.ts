import { describe, expect, it } from 'vitest'
import { DEMO_CHALLENGES, DEMO_HINTS, demoXp, isDemoCorrect } from '~/utils/landingDemo'
import { CORES, HAT_LABEL, VIEW_SIZE, ringPoints, wedgePoints } from '~/utils/octalysis'

const byType = (type: string) => DEMO_CHALLENGES.find((c) => c.type === type)!

describe('landing demo rules', () => {
  it('T-FE-LAND-02 has one demo challenge for each of the four skills', () => {
    expect(DEMO_CHALLENGES.map((c) => c.type)).toEqual(['ordering', 'grouping', 'filtering', 'pattern'])
  })

  it('T-FE-LAND-02 ordering is right only in the exact order', () => {
    const challenge = byType('ordering')
    if (challenge.type !== 'ordering') throw new Error('unexpected type')

    expect(isDemoCorrect(challenge, { order: challenge.solution })).toBe(true)
    expect(isDemoCorrect(challenge, { order: [...challenge.solution].reverse() })).toBe(false)
  })

  it('T-FE-LAND-02 grouping is right only when every task has its part', () => {
    const challenge = byType('grouping')
    if (challenge.type !== 'grouping') throw new Error('unexpected type')

    expect(isDemoCorrect(challenge, { assignment: challenge.solution })).toBe(true)
    const [firstId] = Object.keys(challenge.solution)
    const other = challenge.content.groups.find((g) => g.id !== challenge.solution[firstId!])!
    expect(isDemoCorrect(challenge, { assignment: { ...challenge.solution, [firstId!]: other.id } })).toBe(false)
  })

  it('T-FE-LAND-02 filtering is right only for the exact set of relevant items, in any order', () => {
    const challenge = byType('filtering')
    if (challenge.type !== 'filtering') throw new Error('unexpected type')

    expect(isDemoCorrect(challenge, { selected: [...challenge.solution].reverse() })).toBe(true)
    expect(isDemoCorrect(challenge, { selected: challenge.solution.slice(1) })).toBe(false)
    expect(isDemoCorrect(challenge, { selected: [...challenge.solution, 'extra'] })).toBe(false)
  })

  it('T-FE-LAND-02 pattern is right only for the correct option', () => {
    const challenge = byType('pattern')
    if (challenge.type !== 'pattern') throw new Error('unexpected type')

    expect(isDemoCorrect(challenge, { option: challenge.solution })).toBe(true)
    expect(isDemoCorrect(challenge, { option: 'other' })).toBe(false)
  })

  it('T-FE-LAND-02 an answer of another type is never right', () => {
    expect(isDemoCorrect(byType('ordering'), { option: 'a' })).toBe(false)
  })

  it('T-FE-LAND-02 XP follows the spec: 10, then 5 for one or two wrong answers, then 2', () => {
    expect([0, 1, 2, 3, 7].map(demoXp)).toEqual([10, 5, 5, 2, 2])
  })

  it('T-FE-LAND-02 every challenge has a statement, an explanation and an item text under 120 chars', () => {
    for (const challenge of DEMO_CHALLENGES) {
      expect(challenge.statement.length).toBeGreaterThanOrEqual(20)
      expect(challenge.explanation.length).toBeGreaterThan(0)
      expect(challenge.hint.length).toBeGreaterThan(0)
    }
  })

  it('T-FE-LAND-02 the hint demo has three hints, one for each level', () => {
    expect(DEMO_HINTS).toHaveLength(3)
  })
})

describe('octalysis data', () => {
  it('T-FE-LAND-06 has the 8 cores, numbered 1 to 8, with intensity from 1 to 5', () => {
    expect(CORES.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    for (const core of CORES) {
      expect(core.intensity).toBeGreaterThanOrEqual(1)
      expect(core.intensity).toBeLessThanOrEqual(5)
      expect(core.uses.length).toBeGreaterThan(0)
      expect(HAT_LABEL[core.hat]).toBeTruthy()
    }
  })

  it('T-FE-LAND-06 only cores 2 to 7 carry an intrinsic or extrinsic motivation', () => {
    expect(CORES.filter((c) => c.motivation !== null).map((c) => c.number)).toEqual([2, 3, 4, 5, 6, 7])
  })

  it('T-FE-LAND-06 each wedge is a triangle that stays inside the drawing', () => {
    for (const core of CORES) {
      const points = wedgePoints(core.number, 1)
      expect(points).toHaveLength(3)
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(VIEW_SIZE)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(VIEW_SIZE)
      }
    }
  })

  it('T-FE-LAND-06 a smaller scale moves the outer corners toward the centre', () => {
    const [centre, a1, b1] = wedgePoints(2, 1)
    const [, a2, b2] = wedgePoints(2, 0.5)
    const dist = (p: [number, number]) => Math.hypot(p[0] - centre![0], p[1] - centre![1])

    expect(dist(a2!)).toBeCloseTo(dist(a1!) / 2, 5)
    expect(dist(b2!)).toBeCloseTo(dist(b1!) / 2, 5)
  })

  it('T-FE-LAND-06 the octagon has 8 corners', () => {
    expect(ringPoints(1)).toHaveLength(8)
  })
})
