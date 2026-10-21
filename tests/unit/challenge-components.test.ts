import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import OrderingChallenge from '~/components/challenge/OrderingChallenge.vue'
import GroupingChallenge from '~/components/challenge/GroupingChallenge.vue'
import FilteringChallenge from '~/components/challenge/FilteringChallenge.vue'
import PatternChallenge from '~/components/challenge/PatternChallenge.vue'
import type { FilteringContent, GroupingContent, OrderingContent, PatternContent } from '~/types/challenge'

// Ids as the API sends them to a student: renamed by displayed position and
// deliberately not in alphabetical order of the texts.
const ordering: OrderingContent = {
  items: [
    { id: 'a', text: 'Servir o café' },
    { id: 'b', text: 'Ferver a água' },
    { id: 'c', text: 'Passar o café no filtro' },
  ],
}

const grouping: GroupingContent = {
  groups: [
    { id: 'g1', text: 'Antes da festa' },
    { id: 'g2', text: 'Durante a festa' },
  ],
  items: [
    { id: 'a', text: 'Servir o bolo' },
    { id: 'b', text: 'Enviar convites' },
    { id: 'c', text: 'Comprar balões' },
  ],
}

const filtering: FilteringContent = {
  question: 'Quanto custa a entrada para duas pessoas?',
  items: [
    { id: 'a', text: 'O parque abre às 9h' },
    { id: 'b', text: 'A entrada custa R$ 10' },
    { id: 'c', text: 'Vão duas pessoas' },
  ],
}

const pattern: PatternContent = {
  sequence: ['2', '4', '8', '16'],
  options: [
    { id: 'a', text: '18' },
    { id: 'b', text: '32' },
    { id: 'c', text: '24' },
    { id: 'd', text: '20' },
  ],
}

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

function lastPayload(wrapper: Wrapper) {
  const events = wrapper.emitted('change') ?? []
  return events.at(-1)?.[0]
}

function texts(wrapper: Wrapper, selector: string) {
  return wrapper.findAll(selector).map((node: { text(): string }) => node.text())
}

function expectNoFreeText(wrapper: Wrapper) {
  expect(wrapper.find('textarea').exists()).toBe(false)
  expect(wrapper.find('input:not([type="checkbox"]):not([type="radio"])').exists()).toBe(false)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('OrderingChallenge', () => {
  it('T-FE-CH-01 ordering emits the order payload with the received ids, starting from the received order', async () => {
    const wrapper = await mountSuspended(OrderingChallenge, { props: { content: ordering } })

    expect(texts(wrapper, '[data-testid^="ordering-item-"] [data-testid="ordering-text"]')).toEqual([
      'Servir o café',
      'Ferver a água',
      'Passar o café no filtro',
    ])
    expect(lastPayload(wrapper)).toEqual({ order: ['a', 'b', 'c'] })

    await wrapper.get('[data-testid="ordering-up-b"]').trigger('click')

    expect(lastPayload(wrapper)).toEqual({ order: ['b', 'a', 'c'] })
    expectNoFreeText(wrapper)
  })

  it('T-FE-CH-05 ▲/▼ move items, the ends are disabled and focus follows the moved item', async () => {
    const wrapper = await mountSuspended(OrderingChallenge, { props: { content: ordering }, attachTo: document.body })

    const up = wrapper.get('[data-testid="ordering-up-a"]')
    expect(up.element.tagName).toBe('BUTTON')
    expect(up.attributes('aria-label')).toBe('Mover para cima: Servir o café')
    expect(up.attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="ordering-down-c"]').attributes('disabled')).toBeDefined()

    const down = wrapper.get('[data-testid="ordering-down-a"]')
    ;(down.element as HTMLButtonElement).focus()
    await down.trigger('click')
    expect(lastPayload(wrapper)).toEqual({ order: ['b', 'a', 'c'] })
    expect(document.activeElement).toBe(wrapper.get('[data-testid="ordering-down-a"]').element)

    await wrapper.get('[data-testid="ordering-down-a"]').trigger('click')
    expect(lastPayload(wrapper)).toEqual({ order: ['b', 'c', 'a'] })
    // At the bottom the down button is disabled, so focus moves to the up button of the same item.
    expect(document.activeElement).toBe(wrapper.get('[data-testid="ordering-up-a"]').element)
  })

  it('T-FE-CH-05 disabled locks every move button', async () => {
    const wrapper = await mountSuspended(OrderingChallenge, { props: { content: ordering, disabled: true } })

    for (const button of wrapper.findAll('button')) expect(button.attributes('disabled')).toBeDefined()
  })
})

describe('GroupingChallenge', () => {
  it('T-FE-CH-02 grouping emits the assignment with the received ids once every item has a group', async () => {
    const wrapper = await mountSuspended(GroupingChallenge, { props: { content: grouping } })

    expect(texts(wrapper, '[data-testid="grouping-item-text"]')).toEqual([
      'Servir o bolo',
      'Enviar convites',
      'Comprar balões',
    ])
    const select = wrapper.get('[data-testid="grouping-select-a"]')
    expect(select.element.tagName).toBe('SELECT')
    expect(wrapper.get(`label[for="${select.attributes('id')}"]`).text()).toContain('Servir o bolo')
    expect(lastPayload(wrapper)).toBeNull()

    await select.setValue('g2')
    await wrapper.get('[data-testid="grouping-select-b"]').setValue('g1')
    expect(lastPayload(wrapper)).toBeNull()

    await wrapper.get('[data-testid="grouping-select-c"]').setValue('g1')
    expect(lastPayload(wrapper)).toEqual({ assignment: { a: 'g2', b: 'g1', c: 'g1' } })
    expectNoFreeText(wrapper)
  })
})

describe('FilteringChallenge', () => {
  it('T-FE-CH-03 filtering emits the selected received ids', async () => {
    const wrapper = await mountSuspended(FilteringChallenge, { props: { content: filtering } })

    expect(wrapper.text()).toContain(filtering.question)
    expect(texts(wrapper, '[data-testid^="filtering-label-"]')).toEqual([
      'O parque abre às 9h',
      'A entrada custa R$ 10',
      'Vão duas pessoas',
    ])
    expect(lastPayload(wrapper)).toBeNull()

    await wrapper.get('[data-testid="filtering-option-c"]').setValue(true)
    await wrapper.get('[data-testid="filtering-option-b"]').setValue(true)
    expect(lastPayload(wrapper)).toEqual({ selected: ['b', 'c'] })

    await wrapper.get('[data-testid="filtering-option-b"]').setValue(false)
    expect(lastPayload(wrapper)).toEqual({ selected: ['c'] })
    expectNoFreeText(wrapper)
  })
})

describe('PatternChallenge', () => {
  it('T-FE-CH-04 pattern emits the chosen received option id', async () => {
    const wrapper = await mountSuspended(PatternChallenge, { props: { content: pattern } })

    expect(texts(wrapper, '[data-testid="pattern-term"]')).toEqual(['2', '4', '8', '16'])
    expect(texts(wrapper, '[data-testid^="pattern-label-"]')).toEqual(['18', '32', '24', '20'])
    expect(lastPayload(wrapper)).toBeNull()

    const option = wrapper.get('[data-testid="pattern-option-b"]')
    expect(option.attributes('type')).toBe('radio')
    await option.setValue(true)

    expect(lastPayload(wrapper)).toEqual({ option: 'b' })
    expectNoFreeText(wrapper)
  })
})
