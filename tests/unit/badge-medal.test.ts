import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BadgeMedal from '~/components/game/BadgeMedal.vue'
import type { Tier } from '~/types/api'

function badge(tier: Tier) {
  return { code: `medal_${tier}`, name: 'Primeiro desafio', description: '1 desafio resolvido', tier, emoji: '⭐' }
}

const TIER_HEX: Record<Tier, string> = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#d4af37' }

describe('BadgeMedal', () => {
  it('T-FE-BADGE-01 paints each tier with its spec colour token', async () => {
    const css = readFileSync('app/assets/main.css', 'utf8')
    for (const tier of ['bronze', 'silver', 'gold'] as const) {
      expect(css).toContain(`--cq-${tier}: ${TIER_HEX[tier]};`)

      const wrapper = await mountSuspended(BadgeMedal, { props: { badge: badge(tier), earned: true } })
      expect(wrapper.get('[data-testid="badge-circle"]').classes()).toContain(`bg-${tier}`)
      expect(wrapper.get('[data-testid="badge-circle"]').text()).toBe('⭐')
      expect(wrapper.text()).toContain('Primeiro desafio')
    }
  })

  it('T-FE-BADGE-01 an earned badge is filled and a locked one is an outline, greyed, that says so', async () => {
    const earned = await mountSuspended(BadgeMedal, {
      props: { badge: badge('gold'), earned: true, earnedAt: '2026-10-20T10:00:00-03:00' },
    })
    expect(earned.get('[data-testid="badge-medal_gold"]').attributes('data-earned')).toBe('true')
    expect(earned.get('[data-testid="badge-circle"]').classes()).not.toContain('border-dashed')
    expect(earned.get('[data-testid="badge-emoji"]').classes()).not.toContain('grayscale')
    expect(earned.get('[data-testid="badge-status"]').text()).toBe('Ouro')
    expect(earned.get('[data-testid="badge-earned-on"]').text()).toBe('Conquistada em 20/10')
    expect(earned.get('[data-testid="badge-earned-on"] .sr-only').text()).toBe('Conquistada em')

    const locked = await mountSuspended(BadgeMedal, { props: { badge: badge('gold'), earned: false } })
    expect(locked.get('[data-testid="badge-medal_gold"]').attributes('data-earned')).toBe('false')
    expect(locked.get('[data-testid="badge-circle"]').classes()).toContain('border-dashed')
    expect(locked.get('[data-testid="badge-circle"]').classes()).not.toContain('bg-gold')
    expect(locked.get('[data-testid="badge-emoji"]').classes()).toContain('grayscale')
    expect(locked.get('[data-testid="badge-status"]').text()).toBe('Ouro, ainda não conquistada')
    expect(locked.find('[data-testid="badge-earned-on"]').exists()).toBe(false)
    expect(locked.get('[data-testid="badge-condition"]').text()).toBe('Para conquistar: 1 desafio resolvido')
  })

  it('shows how far a locked badge is when progress is given', async () => {
    const wrapper = await mountSuspended(BadgeMedal, {
      props: { badge: badge('silver'), earned: false, progress: { current: 5, target: 7 } },
    })

    expect(wrapper.get('[data-testid="badge-progress"]').text()).toBe('Progresso: 5 de 7')
  })

  it('marks a recently earned badge as new', async () => {
    const fresh = await mountSuspended(BadgeMedal, { props: { badge: badge('bronze'), earned: true, isNew: true } })
    expect(fresh.get('[data-testid="badge-new"]').text()).toBe('Nova')

    const old = await mountSuspended(BadgeMedal, { props: { badge: badge('bronze'), earned: true } })
    expect(old.find('[data-testid="badge-new"]').exists()).toBe(false)
  })
})
