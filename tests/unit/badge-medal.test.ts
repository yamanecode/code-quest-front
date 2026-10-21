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
      expect(wrapper.get('[data-testid="badge-disc"]').attributes('style')).toContain(`var(--cq-${tier})`)
      expect(wrapper.text()).toContain('Primeiro desafio')
      // Drawn as SVG, never the API's emoji.
      expect(wrapper.find('[data-testid="badge-icon"]').element.tagName.toLowerCase()).toBe('svg')
      expect(wrapper.text()).not.toContain('⭐')
    }
  })

  it('T-FE-BADGE-01 an earned badge is a filled sticker and a locked one is a dashed outline that says so', async () => {
    const earned = await mountSuspended(BadgeMedal, {
      props: { badge: badge('gold'), earned: true, earnedAt: '2026-10-20T10:00:00-03:00' },
    })
    expect(earned.get('[data-testid="badge-medal_gold"]').attributes('data-earned')).toBe('true')
    expect(earned.get('[data-testid="badge-circle"]').classes()).toContain('cq-sticker')
    expect(earned.get('[data-testid="badge-disc"]').attributes('stroke-dasharray')).toBeUndefined()
    expect(earned.get('[data-testid="badge-status"]').text()).toBe('Ouro')
    expect(earned.get('[data-testid="badge-earned-on"]').text()).toBe('Conquistada em 20/10')
    expect(earned.get('[data-testid="badge-earned-on"] .sr-only').text()).toBe('Conquistada em')

    const locked = await mountSuspended(BadgeMedal, { props: { badge: badge('gold'), earned: false } })
    expect(locked.get('[data-testid="badge-medal_gold"]').attributes('data-earned')).toBe('false')
    expect(locked.get('[data-testid="badge-circle"]').classes()).not.toContain('cq-sticker')
    expect(locked.get('[data-testid="badge-disc"]').attributes('stroke-dasharray')).toBe('5 4')
    expect(locked.get('[data-testid="badge-disc"]').attributes('style') ?? '').not.toContain('var(--cq-gold)')
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

  it('T-FE-BADGE-02 draws the symbol of the badge family, and "?" for a secret badge', async () => {
    const skill = await mountSuspended(BadgeMedal, {
      props: { badge: { code: 'skill_pattern_7', name: 'Padrões II', tier: 'silver' }, earned: true },
    })
    expect(skill.get('[data-testid="badge-icon"]').attributes('data-family')).toBe('pattern')

    const secret = await mountSuspended(BadgeMedal, {
      props: { badge: { code: 'all_types_day', name: 'Insígnia secreta', tier: 'silver' }, earned: false, secret: true },
    })
    expect(secret.get('[data-testid="badge-icon"]').attributes('data-family')).toBe('secret')
  })

  it('marks a recently earned badge as new', async () => {
    const fresh = await mountSuspended(BadgeMedal, { props: { badge: badge('bronze'), earned: true, isNew: true } })
    expect(fresh.get('[data-testid="badge-new"]').text()).toBe('Nova')

    const old = await mountSuspended(BadgeMedal, { props: { badge: badge('bronze'), earned: true } })
    expect(old.find('[data-testid="badge-new"]').exists()).toBe(false)
  })
})
