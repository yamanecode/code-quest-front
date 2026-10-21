import { describe, expect, it } from 'vitest'
import { rankingPeriod } from '~/utils/ranking'

// 2026-10-21 is a Wednesday.
const wednesday = new Date('2026-10-21T15:00:00-03:00')

describe('rankingPeriod', () => {
  it('names the current week from Monday to Sunday and when it restarts', () => {
    expect(rankingPeriod('week', wednesday)).toEqual({
      title: 'Semana de 19/10 a 25/10',
      resets: 'Recomeça na segunda-feira, 26/10.',
    })
  })

  it('names the current month and when it restarts', () => {
    expect(rankingPeriod('month', wednesday)).toEqual({
      title: 'Outubro de 2026',
      resets: 'Recomeça em 1º/11.',
    })
  })

  it('uses São Paulo dates, not UTC', () => {
    // 01:00 UTC on Monday the 26th is still Sunday the 25th in São Paulo.
    expect(rankingPeriod('week', new Date('2026-10-26T01:00:00Z')).title).toBe('Semana de 19/10 a 25/10')
    // 02:00 UTC on 1 November is still 31 October in São Paulo.
    expect(rankingPeriod('month', new Date('2026-11-01T02:00:00Z')).title).toBe('Outubro de 2026')
  })

  it('handles a week that crosses into the next year', () => {
    expect(rankingPeriod('week', new Date('2026-12-31T12:00:00-03:00'))).toEqual({
      title: 'Semana de 28/12 a 03/01',
      resets: 'Recomeça na segunda-feira, 04/01.',
    })
  })
})
