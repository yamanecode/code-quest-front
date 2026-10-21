import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ChallengeForm from '~/components/professor/ChallengeForm.vue'
import type { ProfChallenge } from '~/types/api'
import type { ChallengeType } from '~/types/challenge'
import { emptyForm, formFromChallenge, toInput, type FormState } from '~/utils/challengeForm'
import { validateForm } from '~/utils/rules'

const STATEMENT = 'Um enunciado com mais de vinte caracteres.'

async function open(form: FormState, locked = false) {
  const state = reactive(form)
  const wrapper = await mountSuspended(ChallengeForm, { props: { modelValue: state, locked } })
  return { wrapper, state }
}

async function fillCommon(wrapper: Awaited<ReturnType<typeof open>>['wrapper']) {
  await wrapper.get('[data-testid="field-title"]').setValue('Um título')
  await wrapper.get('[data-testid="field-statement"]').setValue(STATEMENT)
}

const rules = (wrapper: Awaited<ReturnType<typeof open>>['wrapper']) =>
  wrapper.findAll('[data-testid="rule-errors"] li').map((li) => li.text())

describe('challenge editors', () => {
  it('T-FE-EDIT-01 ordering editor builds the solution from the list order and shows rule errors', async () => {
    const { wrapper, state } = await open(emptyForm('ordering'))
    expect(wrapper.find('[data-testid="rule-errors"]').exists()).toBe(true)

    await fillCommon(wrapper)
    await wrapper.get('[data-testid="editor-item-0"]').setValue('Primeiro')
    await wrapper.get('[data-testid="editor-item-1"]').setValue('Segundo')
    await wrapper.get('[data-testid="editor-item-2"]').setValue('Terceiro')
    expect(wrapper.find('[data-testid="rules-ok"]').exists()).toBe(true)

    await wrapper.get('[data-testid="editor-down-0"]').trigger('click')
    const input = toInput(state)
    expect(input.type).toBe('ordering')
    if (input.type === 'ordering') {
      expect(input.content.items.map((i) => i.text)).toEqual(['Segundo', 'Primeiro', 'Terceiro'])
      expect(input.content.solution).toEqual(['b', 'a', 'c'])
    }

    await wrapper.get('[data-testid="editor-item-2"]').setValue('Segundo')
    expect(rules(wrapper).join(' ')).toContain('não podem se repetir')

    // 3 steps is the minimum, 8 the maximum
    expect(wrapper.get('[data-testid="editor-remove-0"]').attributes('disabled')).toBeDefined()
    for (let i = 0; i < 5; i++) await wrapper.get('[data-testid="editor-add"]').trigger('click')
    expect(state.items).toHaveLength(8)
    expect(wrapper.get('[data-testid="editor-add"]').attributes('disabled')).toBeDefined()
  })

  it('T-FE-EDIT-02 grouping editor assigns every task to an etapa', async () => {
    const { wrapper, state } = await open(emptyForm('grouping'))
    await fillCommon(wrapper)
    await wrapper.get('[data-testid="editor-group-0"]').setValue('Antes')
    await wrapper.get('[data-testid="editor-group-1"]').setValue('Depois')
    for (let i = 0; i < 4; i++) await wrapper.get(`[data-testid="editor-item-${i}"]`).setValue(`Tarefa ${i}`)
    expect(rules(wrapper).join(' ')).toContain('Escolha a etapa')

    await wrapper.get('[data-testid="editor-assign-0"]').setValue('g1')
    await wrapper.get('[data-testid="editor-assign-1"]').setValue('g1')
    await wrapper.get('[data-testid="editor-assign-2"]').setValue('g1')
    await wrapper.get('[data-testid="editor-assign-3"]').setValue('g1')
    expect(rules(wrapper).join(' ')).toContain('Toda etapa precisa ter pelo menos uma tarefa')

    await wrapper.get('[data-testid="editor-assign-3"]').setValue('g2')
    expect(wrapper.find('[data-testid="rules-ok"]').exists()).toBe(true)
    const input = toInput(state)
    if (input.type === 'grouping') expect(input.content.solution).toEqual({ a: 'g1', b: 'g1', c: 'g1', d: 'g2' })
  })

  it('T-FE-EDIT-03 filtering editor needs a relevant and an irrelevant piece of information', async () => {
    const { wrapper, state } = await open(emptyForm('filtering'))
    await fillCommon(wrapper)
    await wrapper.get('[data-testid="editor-question"]').setValue('Quanto custa a viagem inteira?')
    for (let i = 0; i < 4; i++) await wrapper.get(`[data-testid="editor-item-${i}"]`).setValue(`Informação ${i}`)
    expect(rules(wrapper).join(' ')).toContain('pelo menos uma informação relevante')

    for (let i = 0; i < 4; i++) await wrapper.get(`[data-testid="editor-relevant-${i}"]`).setValue(true)
    expect(rules(wrapper).join(' ')).toContain('pelo menos uma informação irrelevante')

    await wrapper.get('[data-testid="editor-relevant-3"]').setValue(false)
    expect(wrapper.find('[data-testid="rules-ok"]').exists()).toBe(true)
    const input = toInput(state)
    if (input.type === 'filtering') expect(input.content.solution).toEqual(['a', 'b', 'c'])
  })

  it('T-FE-EDIT-04 pattern editor needs 4 to 5 options and one correct', async () => {
    const { wrapper, state } = await open(emptyForm('pattern'))
    await fillCommon(wrapper)
    for (let i = 0; i < 3; i++) await wrapper.get(`[data-testid="editor-term-${i}"]`).setValue(String(2 ** i))
    for (let i = 0; i < 4; i++) await wrapper.get(`[data-testid="editor-item-${i}"]`).setValue(String(10 + i))
    expect(rules(wrapper).join(' ')).toContain('Marque a opção correta')

    // 4 options is the minimum, 5 the maximum
    expect(wrapper.get('[data-testid="editor-remove-0"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-testid="editor-add"]').trigger('click')
    expect(state.options).toHaveLength(5)
    expect(wrapper.get('[data-testid="editor-add"]').attributes('disabled')).toBeDefined()
    expect(rules(wrapper).join(' ')).toContain('Opções: cada texto')

    await wrapper.get('[data-testid="editor-item-4"]').setValue('14')
    await wrapper.get('[data-testid="editor-correct-2"]').setValue(true)
    expect(wrapper.find('[data-testid="rules-ok"]').exists()).toBe(true)
    const input = toInput(state)
    if (input.type === 'pattern') {
      expect(input.content.sequence).toEqual(['1', '2', '4'])
      expect(input.content.solution).toBe('c')
    }
  })

  it.each<ChallengeType>(['ordering', 'grouping', 'filtering', 'pattern'])(
    'T-FE-EDIT-04 an empty %s form builds the matching input type',
    (type) => {
      expect(toInput(emptyForm(type)).type).toBe(type)
      expect(validateForm(emptyForm(type)).length).toBeGreaterThan(0)
    },
  )

  it('T-FE-EDIT-05 a locked challenge keeps only its texts editable', async () => {
    const challenge: ProfChallenge = {
      id: 7,
      title: 'Fazer café',
      statement: STATEMENT,
      skill: 'Pensamento algorítmico',
      explanation: null,
      status: 'published',
      origin: 'professor',
      locked: true,
      solve_stats: { attempted: 3, solved: 2 },
      type: 'ordering',
      content: {
        items: [
          { id: 'x', text: 'Beber' },
          { id: 'y', text: 'Coar' },
          { id: 'z', text: 'Ferver a água' },
        ],
        solution: ['z', 'y', 'x'],
      },
    }
    const form = formFromChallenge(challenge)
    expect(form.items.map((i) => i.id)).toEqual(['z', 'y', 'x'])

    const { wrapper, state } = await open(form, true)
    expect(wrapper.get('[data-testid="locked-note"]').text()).toBe(
      'Este desafio já foi respondido: só os textos podem mudar. Use Duplicar para alterar a estrutura.',
    )
    for (const testid of ['editor-add', 'editor-up-1', 'editor-down-0', 'editor-remove-0']) {
      expect(wrapper.get(`[data-testid="${testid}"]`).attributes('disabled')).toBeDefined()
    }
    expect(wrapper.get('[data-testid="editor-item-0"]').attributes('disabled')).toBeUndefined()

    await wrapper.get('[data-testid="editor-item-0"]').setValue('Ferver a água da chaleira')
    const input = toInput(state)
    if (input.type === 'ordering') {
      expect(input.content.solution).toEqual(['z', 'y', 'x'])
      expect(input.content.items[0]).toEqual({ id: 'z', text: 'Ferver a água da chaleira' })
    }
  })
})
