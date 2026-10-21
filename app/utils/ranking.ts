// Ranking periods as the student sees them (spec §5): weeks start on Monday 00:00 and
// months on day 1 00:00, both in São Paulo time.

import type { RankingPeriod } from '~/types/api'

const DAY_MS = 24 * 60 * 60 * 1000

const SAO_PAULO_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' })

// The calendar day in São Paulo, as a UTC midnight timestamp so day arithmetic is exact.
function saoPauloDay(now: Date): number {
  const [year, month, day] = SAO_PAULO_DATE.format(now).split('-').map(Number)
  return Date.UTC(year!, month! - 1, day!)
}

function dayMonth(day: number): string {
  const date = new Date(day)
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export interface PeriodText {
  title: string
  resets: string
}

export function rankingPeriod(period: RankingPeriod, now: Date): PeriodText {
  const today = saoPauloDay(now)
  const date = new Date(today)

  if (period === 'week') {
    const sinceMonday = (date.getUTCDay() + 6) % 7
    const monday = today - sinceMonday * DAY_MS
    return {
      title: `Semana de ${dayMonth(monday)} a ${dayMonth(monday + 6 * DAY_MS)}`,
      resets: `Recomeça na segunda-feira, ${dayMonth(monday + 7 * DAY_MS)}.`,
    }
  }

  const month = MONTH_NAME.format(date)
  const nextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  return {
    title: `${month.charAt(0).toUpperCase()}${month.slice(1)} de ${date.getUTCFullYear()}`,
    resets: `Recomeça em 1º/${String(nextMonth.getUTCMonth() + 1).padStart(2, '0')}.`,
  }
}
