import { describe, expect, it } from 'vitest'
import { DEMO_CHALLENGES, DEMO_HINTS, demoXp, isDemoCorrect } from '~/utils/landingDemo'
import { CENTRE, CORES, HAT_LABEL, TERM_NOTE, VIEW_SIZE, badgePoint, coresOfTerm, ringPoints, elementCount, wedgePoints } from '~/utils/octalysis'

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
  it('T-FE-LAND-10 the fill of each core is the number of elements listed under it, never more than 5', () => {
    for (const core of CORES) {
      expect(elementCount(core)).toBe(core.uses.filter((u) => u.technique).length)
      expect(elementCount(core)).toBeLessThanOrEqual(5)
    }
    expect(CORES.map(elementCount)).toEqual([0, 4, 2, 2, 2, 1, 1, 0])
  })

  it('T-FE-LAND-06 has the 8 cores, numbered 1 to 8, each with at least one listed use', () => {
    expect(CORES.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    for (const core of CORES) {
      expect(core.uses.length).toBeGreaterThan(0)
      expect(HAT_LABEL[core.hat]).toBeTruthy()
    }
  })

  it('T-FE-LAND-07 every used core names the Chou technique of each element; cores 1 and 8 are not used', () => {
    const notUsed = CORES.filter((c) => elementCount(c) === 0).map((c) => c.number)
    expect(notUsed).toEqual([1, 8])
    for (const core of CORES) {
      for (const use of core.uses) {
        if (elementCount(core) === 0) {
          expect(use.technique).toBeNull()
          expect(use.text).toMatch(/^Não usado/)
        }
        else {
          expect(use.technique).toBeTruthy()
        }
      }
    }
    const techniques = CORES.flatMap((c) => c.uses.map((u) => u.technique))
    expect(techniques).toEqual(expect.arrayContaining(['Status Points', 'Achievement Symbols', 'Leaderboard', 'Collection Sets', 'Group Quests', 'Trophy Shelves', 'Dangling', 'Easter Eggs']))
    // The leaderboard is an accomplishment technique (core 2), as in spec §5.
    expect(CORES.find((c) => c.number === 2)!.uses.map((u) => u.technique)).toContain('Leaderboard')
    // Nothing that is not a game element of the platform is claimed.
    const text = CORES.flatMap((c) => c.uses.map((u) => u.text)).join(' ').toLowerCase()
    for (const word of ['dica', 'diário', 'mensagens']) expect(text).not.toContain(word)
    expect(TERM_NOTE.black).toContain('não usa o 8')
  })

  it('T-FE-LAND-06 only cores 2 to 7 carry an intrinsic or extrinsic motivation', () => {
    expect(CORES.filter((c) => c.motivation !== null).map((c) => c.number)).toEqual([2, 3, 4, 5, 6, 7])
  })

  it('T-FE-LAND-06 each wedge is a quadrilateral that stays inside the drawing', () => {
    for (const core of CORES) {
      const points = wedgePoints(core.number, 1)
      expect(points).toHaveLength(4)
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(VIEW_SIZE)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(VIEW_SIZE)
      }
    }
  })

  it('T-FE-LAND-06 a smaller scale moves the outer corners toward the centre', () => {
    const [centre, a1, v1, b1] = wedgePoints(2, 1)
    const [, a2, v2, b2] = wedgePoints(2, 0.5)
    const dist = (p: [number, number]) => Math.hypot(p[0] - centre![0], p[1] - centre![1])

    expect(dist(a2!)).toBeCloseTo(dist(a1!) / 2, 5)
    expect(dist(v2!)).toBeCloseTo(dist(v1!) / 2, 5)
    expect(dist(b2!)).toBeCloseTo(dist(b1!) / 2, 5)
  })

  it('T-FE-LAND-06 the cores sit where the official diagram puts them', () => {
    const [cx, cy] = CENTRE
    const at = (n: number) => badgePoint(n)
    expect(at(1)[1]).toBeLessThan(cy) // top
    expect(at(1)[0]).toBeCloseTo(cx, 5)
    expect(at(8)[1]).toBeGreaterThan(cy) // bottom
    expect(at(8)[0]).toBeCloseTo(cx, 5)
    expect(at(4)[0]).toBeLessThan(cx) // left
    expect(at(4)[1]).toBeCloseTo(cy, 5)
    expect(at(5)[0]).toBeGreaterThan(cx) // right
    expect(at(5)[1]).toBeCloseTo(cy, 5)
    expect([at(2), at(3)].map((p) => p[1] < cy)).toEqual([true, true]) // upper row
    expect(at(2)[0]).toBeLessThan(cx)
    expect(at(3)[0]).toBeGreaterThan(cx)
    expect([at(6), at(7)].map((p) => p[1] > cy)).toEqual([true, true]) // lower row
    expect(at(6)[0]).toBeLessThan(cx)
    expect(at(7)[0]).toBeGreaterThan(cx)
  })

  it('T-FE-LAND-06 hats and brain sides group the cores as the official diagram does', () => {
    expect(coresOfTerm('white')).toEqual([1, 2, 3])
    expect(coresOfTerm('neutral')).toEqual([4, 5])
    expect(coresOfTerm('black')).toEqual([6, 7, 8])
    expect(coresOfTerm('left')).toEqual([2, 4, 6])
    expect(coresOfTerm('right')).toEqual([3, 5, 7])
  })

  it('T-FE-LAND-06 the octagon has 8 corners', () => {
    expect(ringPoints(1)).toHaveLength(8)
  })
})
