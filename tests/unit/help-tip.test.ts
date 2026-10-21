import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HelpTip from '~/components/game/HelpTip.vue'

const props = { topic: 'xp', label: 'XP', text: 'Você ganha XP na primeira vez que acerta um desafio.' }

afterEach(() => {
  document.body.innerHTML = ''
})

async function mountTip() {
  return mountSuspended(HelpTip, { props, attachTo: document.body })
}

describe('HelpTip', () => {
  it('T-FE-HELP-01 the button has an accessible name and starts closed', async () => {
    const wrapper = await mountTip()
    const button = wrapper.get('[data-testid="help-xp"]')

    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('aria-label')).toBe('Ajuda: XP')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-testid="help-xp-panel"]').exists()).toBe(false)
  })

  it('T-FE-HELP-01 Enter opens the explanation and Escape closes it, giving focus back', async () => {
    const wrapper = await mountTip()
    const button = wrapper.get('[data-testid="help-xp"]')

    await button.trigger('keydown', { key: 'Enter' })

    const panel = wrapper.get('[data-testid="help-xp-panel"]')
    expect(panel.text()).toContain(props.text)
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(button.attributes('aria-controls')).toBe(panel.attributes('id'))

    await panel.trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[data-testid="help-xp-panel"]').exists()).toBe(false)
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)
  })

  it('T-FE-HELP-01 Space toggles the explanation open and closed', async () => {
    const wrapper = await mountTip()
    const button = wrapper.get('[data-testid="help-xp"]')

    await button.trigger('keydown', { key: ' ' })
    expect(wrapper.find('[data-testid="help-xp-panel"]').exists()).toBe(true)

    await button.trigger('keydown', { key: ' ' })
    expect(wrapper.find('[data-testid="help-xp-panel"]').exists()).toBe(false)
  })
})
