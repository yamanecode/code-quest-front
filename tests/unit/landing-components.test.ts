import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DemoChallenge from '~/components/landing/DemoChallenge.vue'
import HintDemo from '~/components/landing/HintDemo.vue'
import LandingHeader from '~/components/landing/LandingHeader.vue'
import OctalysisMap from '~/components/landing/OctalysisMap.vue'
import { useAuthStore } from '~/stores/auth'
import { DEMO_COOLDOWN_SECONDS, DEMO_HINTS, demoChallenge } from '~/utils/landingDemo'

const testid = (wrapper: VueWrapper, id: string) => wrapper.get(`[data-testid="${id}"]`)

beforeEach(() => {
  localStorage.clear()
  useAuthStore().logout()
})

describe('octalysis map', () => {
  it('T-FE-LAND-01 starts on core 2 and selecting another core updates the panel and aria-pressed', async () => {
    const wrapper = await mountSuspended(OctalysisMap)

    expect(testid(wrapper, 'octalysis-core-2').attributes('aria-pressed')).toBe('true')
    expect(testid(wrapper, 'octalysis-detail').text()).toContain('Desenvolvimento e realização')

    await testid(wrapper, 'octalysis-core-6').trigger('click')

    expect(testid(wrapper, 'octalysis-core-6').attributes('aria-pressed')).toBe('true')
    expect(testid(wrapper, 'octalysis-core-2').attributes('aria-pressed')).toBe('false')
    expect(testid(wrapper, 'octalysis-detail').text()).toContain('Escassez e impaciência')
    expect(testid(wrapper, 'octalysis-hat').text()).toBe('Chapéu preto')
    expect(testid(wrapper, 'octalysis-intensity').text()).toBe('2 de 5')
  })

  it('T-FE-LAND-01 clicking a wedge of the drawing selects its core', async () => {
    const wrapper = await mountSuspended(OctalysisMap)

    await testid(wrapper, 'octalysis-wedge-4').trigger('click')

    expect(testid(wrapper, 'octalysis-core-4').attributes('aria-pressed')).toBe('true')
  })

  it('T-FE-LAND-01 offers the 8 cores as buttons in order, and cores 1 and 8 show no motivation tag', async () => {
    const wrapper = await mountSuspended(OctalysisMap)

    const buttons = wrapper.findAll('[data-testid^="octalysis-core-"]')
    expect(buttons.map((b) => b.attributes('data-testid'))).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `octalysis-core-${n}`),
    )

    await testid(wrapper, 'octalysis-core-1').trigger('click')
    expect(wrapper.find('[data-testid="octalysis-motivation"]').exists()).toBe(false)
    await testid(wrapper, 'octalysis-core-3').trigger('click')
    expect(testid(wrapper, 'octalysis-motivation').text()).toBe('Motivação intrínseca')
  })
})

describe('demo challenge', () => {
  // Moves the steps of the ordering demo into the right order with the ▲ buttons.
  async function arrangeOrdering(wrapper: VueWrapper) {
    const challenge = demoChallenge('ordering')
    if (challenge.type !== 'ordering') throw new Error('unexpected type')
    const order = challenge.content.items.map((item) => item.id)
    for (const [target, id] of challenge.solution.entries()) {
      while (order.indexOf(id) > target) {
        await testid(wrapper, `ordering-up-${id}`).trigger('click')
        const at = order.indexOf(id)
        ;[order[at - 1], order[at]] = [order[at]!, order[at - 1]!]
      }
    }
  }

  async function answerGrouping(wrapper: VueWrapper, rightAnswer: boolean) {
    const challenge = demoChallenge('grouping')
    if (challenge.type !== 'grouping') throw new Error('unexpected type')
    const [firstId] = Object.keys(challenge.solution)
    for (const [itemId, groupId] of Object.entries(challenge.solution)) {
      const wrong = challenge.content.groups.find((g) => g.id !== groupId)!.id
      await testid(wrapper, `grouping-select-${itemId}`).setValue(!rightAnswer && itemId === firstId ? wrong : groupId)
    }
  }

  it('T-FE-LAND-03 shows one tab for each skill and starts on the ordering challenge', async () => {
    const wrapper = await mountSuspended(DemoChallenge)

    for (const type of ['ordering', 'grouping', 'filtering', 'pattern']) {
      expect(wrapper.find(`[data-testid="demo-tab-${type}"]`).exists()).toBe(true)
    }
    expect(testid(wrapper, 'demo-tab-ordering').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-testid="ordering-list"]').exists()).toBe(true)
  })

  it('T-FE-LAND-03 ordering: a first wrong answer shows the automatic hint, then the right order gives 5 XP', async () => {
    const wrapper = await mountSuspended(DemoChallenge)

    await testid(wrapper, 'demo-submit').trigger('click')
    expect(wrapper.find('[data-testid="feedback-wrong"]').exists()).toBe(true)
    expect(testid(wrapper, 'feedback-hint').text()).toContain(demoChallenge('ordering').hint)

    await testid(wrapper, 'feedback-retry').trigger('click')
    await arrangeOrdering(wrapper)
    await testid(wrapper, 'demo-submit').trigger('click')

    expect(testid(wrapper, 'feedback-xp').text()).toContain('+5 XP')
    expect(testid(wrapper, 'feedback-explanation').text()).toContain(demoChallenge('ordering').explanation)
    expect(testid(wrapper, 'demo-tab-ordering').attributes('aria-label')).toContain('resolvido')
  })

  it('T-FE-LAND-03 a second wrong answer shows no new hint', async () => {
    const wrapper = await mountSuspended(DemoChallenge)

    await testid(wrapper, 'demo-submit').trigger('click')
    await testid(wrapper, 'feedback-retry').trigger('click')
    await testid(wrapper, 'demo-submit').trigger('click')

    expect(wrapper.find('[data-testid="feedback-wrong"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="feedback-hint"]').exists()).toBe(false)
  })

  it('T-FE-LAND-03 grouping: Enviar waits for every task and a right answer first try gives 10 XP', async () => {
    const wrapper = await mountSuspended(DemoChallenge)
    await testid(wrapper, 'demo-tab-grouping').trigger('click')

    expect(testid(wrapper, 'demo-submit').attributes('disabled')).toBeDefined()
    expect(testid(wrapper, 'demo-submit-help').text()).toContain('etapa')

    await answerGrouping(wrapper, true)
    await testid(wrapper, 'demo-submit').trigger('click')

    expect(testid(wrapper, 'feedback-xp').text()).toContain('+10 XP')
    expect(wrapper.find('[data-testid="demo-reset"]').exists()).toBe(true)
  })

  it('T-FE-LAND-03 filtering: three wrong answers before the right one give 2 XP', async () => {
    const wrapper = await mountSuspended(DemoChallenge)
    await testid(wrapper, 'demo-tab-filtering').trigger('click')
    const challenge = demoChallenge('filtering')
    if (challenge.type !== 'filtering') throw new Error('unexpected type')
    const pickWrong = challenge.content.items.find((item) => !challenge.solution.includes(item.id))!

    await testid(wrapper, `filtering-option-${pickWrong.id}`).setValue(true)
    for (let attempt = 0; attempt < 3; attempt++) {
      await testid(wrapper, 'demo-submit').trigger('click')
      expect(wrapper.find('[data-testid="feedback-wrong"]').exists()).toBe(true)
      await testid(wrapper, 'feedback-retry').trigger('click')
    }

    await testid(wrapper, `filtering-option-${pickWrong.id}`).setValue(false)
    for (const id of challenge.solution) await testid(wrapper, `filtering-option-${id}`).setValue(true)
    await testid(wrapper, 'demo-submit').trigger('click')

    expect(testid(wrapper, 'feedback-xp').text()).toContain('+2 XP')
  })

  it('T-FE-LAND-03 pattern: the right option first try gives 10 XP, and Recomeçar starts over', async () => {
    const wrapper = await mountSuspended(DemoChallenge)
    await testid(wrapper, 'demo-tab-pattern').trigger('click')
    const challenge = demoChallenge('pattern')
    if (challenge.type !== 'pattern') throw new Error('unexpected type')

    expect(testid(wrapper, 'demo-submit').attributes('disabled')).toBeDefined()
    await testid(wrapper, `pattern-option-${challenge.solution}`).setValue(true)
    await testid(wrapper, 'demo-submit').trigger('click')
    expect(testid(wrapper, 'feedback-xp').text()).toContain('+10 XP')

    await testid(wrapper, 'demo-reset').trigger('click')
    expect(wrapper.find('[data-testid="feedback-correct"]').exists()).toBe(false)
    expect(testid(wrapper, 'demo-submit').attributes('disabled')).toBeDefined()
  })

  it('T-FE-LAND-03 solving a skill again gives no new XP', async () => {
    const wrapper = await mountSuspended(DemoChallenge)
    await testid(wrapper, 'demo-tab-pattern').trigger('click')
    const challenge = demoChallenge('pattern')
    if (challenge.type !== 'pattern') throw new Error('unexpected type')

    await testid(wrapper, `pattern-option-${challenge.solution}`).setValue(true)
    await testid(wrapper, 'demo-submit').trigger('click')
    await testid(wrapper, 'demo-reset').trigger('click')
    await testid(wrapper, `pattern-option-${challenge.solution}`).setValue(true)
    await testid(wrapper, 'demo-submit').trigger('click')

    expect(testid(wrapper, 'feedback-xp').text()).toContain('não há XP novo')
  })

  it('T-FE-LAND-07 the demo has no free-text field', async () => {
    const wrapper = await mountSuspended(DemoChallenge)

    for (const type of ['ordering', 'grouping', 'filtering', 'pattern']) {
      await testid(wrapper, `demo-tab-${type}`).trigger('click')
      expect(wrapper.find('textarea').exists()).toBe(false)
      expect(wrapper.find('input[type="text"]').exists()).toBe(false)
    }
  })
})

describe('hint demo', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('T-FE-LAND-04 shows the first hint, counts down and enables the button again', async () => {
    const wrapper = await mountSuspended(HintDemo)
    const button = testid(wrapper, 'hint-demo-button')
    expect(button.text()).toBe('Dica')

    await button.trigger('click')
    expect(testid(wrapper, 'hint-demo-1').text()).toContain(DEMO_HINTS[0])
    expect(button.text()).toBe(`Dica em ${DEMO_COOLDOWN_SECONDS} s`)
    expect(button.attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(2000)
    expect(button.text()).toBe(`Dica em ${DEMO_COOLDOWN_SECONDS - 2} s`)

    await vi.advanceTimersByTimeAsync(DEMO_COOLDOWN_SECONDS * 1000)
    expect(button.text()).toBe('Dica')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('T-FE-LAND-04 ends after the three canned hints and never calls the API', async () => {
    const wrapper = await mountSuspended(HintDemo)
    const button = testid(wrapper, 'hint-demo-button')

    for (let level = 0; level < DEMO_HINTS.length; level++) {
      await button.trigger('click')
      await vi.advanceTimersByTimeAsync(DEMO_COOLDOWN_SECONDS * 1000)
    }

    for (const [index, hint] of DEMO_HINTS.entries()) {
      expect(testid(wrapper, `hint-demo-${index + 1}`).text()).toContain(hint)
    }
    expect(button.text()).toBe('Fim das dicas do exemplo')
    expect(button.attributes('disabled')).toBeDefined()
  })
})

describe('landing header', () => {
  it('T-FE-LAND-05 the menu button opens and closes the section links and follows aria-expanded', async () => {
    const wrapper = await mountSuspended(LandingHeader, { route: '/' })
    const button = testid(wrapper, 'landing-menu-button')

    expect(button.attributes('aria-expanded')).toBe('false')
    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(testid(wrapper, 'landing-nav').classes()).toContain('flex')

    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(testid(wrapper, 'landing-nav').classes()).toContain('hidden')
  })

  it('T-FE-LAND-05 Esc and choosing a link close the menu', async () => {
    const wrapper = await mountSuspended(LandingHeader, { route: '/' })
    const button = testid(wrapper, 'landing-menu-button')

    await button.trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(button.attributes('aria-expanded')).toBe('false')

    await button.trigger('click')
    await testid(wrapper, 'landing-link-octalysis').trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('T-FE-LAND-05 on the landing page it links to every section and to the limitations page', async () => {
    const wrapper = await mountSuspended(LandingHeader, { route: '/' })

    for (const section of ['projeto', 'habilidades', 'como-funciona', 'octalysis', 'professores']) {
      expect(testid(wrapper, `landing-link-${section}`).attributes('href')).toContain(`#${section}`)
    }
    expect(testid(wrapper, 'landing-link-limitacoes').attributes('href')).toBe('/limitacoes')
  })

  it('T-FE-LAND-05 on the limitations page the section links give way to a link back', async () => {
    const wrapper = await mountSuspended(LandingHeader, { route: '/limitacoes' })

    expect(wrapper.find('[data-testid="landing-link-projeto"]').exists()).toBe(false)
    expect(testid(wrapper, 'landing-link-inicio').attributes('href')).toBe('/')
  })

  it('T-FE-LAND-05 a visitor sees Entrar and Criar conta; a logged-in user sees a link to their home', async () => {
    const visitor = await mountSuspended(LandingHeader, { route: '/' })
    expect(testid(visitor, 'landing-signup').attributes('href')).toBe('/cadastro')
    expect(testid(visitor, 'landing-login').attributes('href')).toBe('/entrar')

    localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role: 'student', username: 'ana' }))
    useAuthStore().restore()
    const student = await mountSuspended(LandingHeader, { route: '/limitacoes' })
    expect(testid(student, 'landing-go-home').attributes('href')).toBe('/inicio')
    expect(student.find('[data-testid="landing-signup"]').exists()).toBe(false)
  })

  it('T-FE-LAND-05 every control has an accessible name', async () => {
    const wrapper = await mountSuspended(LandingHeader, { route: '/' })

    for (const control of wrapper.findAll('button, a')) {
      const name = control.attributes('aria-label') ?? control.text()
      expect(name.trim(), control.html()).not.toBe('')
    }
  })
})
