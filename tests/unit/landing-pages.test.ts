import { beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LandingPage from '~/pages/index.vue'
import LimitationsPage from '~/pages/limitacoes.vue'
import { useAuthStore } from '~/stores/auth'

beforeEach(() => {
  localStorage.clear()
  useAuthStore().logout()
})

describe('landing page', () => {
  it('T-FE-LAND-09 opens with the quote of Wing, its source and the translation note', async () => {
    const wrapper = await mountSuspended(LandingPage, { route: '/' })

    expect(wrapper.get('[data-testid="hero-quote"]').text()).toBe(
      '“Pensamento computacional é uma habilidade fundamental para todos, não apenas para cientistas da computação.”',
    )
    const source = wrapper.get('[data-testid="hero-source"]').text()
    expect(source).toContain('Jeannette M. Wing')
    expect(source).toContain('Communications of the ACM, 2006')
    expect(source).toContain('Tradução nossa')
  })

  it('T-FE-LAND-09 shows the 4 skills with the labels of the platform', async () => {
    const wrapper = await mountSuspended(LandingPage, { route: '/' })

    const text = wrapper.get('#habilidades').text()
    for (const label of ['Pensamento algorítmico', 'Decomposição', 'Abstração', 'Reconhecimento de padrões']) {
      expect(text).toContain(label)
    }
    expect(wrapper.findAll('[data-testid^="landing-skill-"]')).toHaveLength(4)
  })

  it('T-FE-LAND-09 explains missão and Trilha CodeQuest, and gives the XP rule 10, 5 and 2', async () => {
    const wrapper = await mountSuspended(LandingPage, { route: '/' })

    const steps = wrapper.get('#como-funciona').text()
    expect(steps).toContain('Uma missão é um conjunto de desafios')
    expect(steps).toContain('Trilha CodeQuest')
    expect(steps).not.toContain('Trilhas para todos')
    const xp = wrapper.get('[data-testid="landing-xp"]').text()
    expect(xp).toContain('10 XP')
    expect(xp).toContain('5 XP')
    expect(xp).toContain('2 XP')
  })

  it('T-FE-LAND-09 does not say "protótipo", does not list references and does not promise a hint limit', async () => {
    const wrapper = await mountSuspended(LandingPage, { route: '/' })

    const text = wrapper.text().toLowerCase()
    expect(text).not.toContain('protótipo')
    expect(text).not.toContain('em que o projeto se apoia')
    expect(text).not.toMatch(/\b5 dicas\b|restantes/)
  })

  it('T-FE-LAND-09 tells that the AI needs a provider that is paid for, and links the limitations page', async () => {
    const wrapper = await mountSuspended(LandingPage, { route: '/' })

    expect(wrapper.get('[data-testid="landing-provider-note"]').text()).toContain('provedor de IA')
    expect(wrapper.get('[data-testid="landing-provider-note"]').text()).toContain('pago')
    expect(wrapper.get('[data-testid="landing-limits-link"]').attributes('href')).toBe('/limitacoes')
  })

  it('T-FE-LAND-09 lists the protections for students, without any chat or notification', async () => {
    const wrapper = await mountSuspended(LandingPage, { route: '/' })

    const text = wrapper.get('[data-testid="landing-protections"]').text()
    expect(text).toContain('só nome de usuário e senha')
    expect(text).toContain('Não há chat, comentários nem notificações')
  })

  it('T-FE-LAND-07 the whole page has no free-text field', async () => {
    const wrapper = await mountSuspended(LandingPage, { route: '/' })

    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.find('input[type="text"]').exists()).toBe(false)
  })

  it('T-FE-LAND-09 sign-up and login links lead to the right pages', async () => {
    const wrapper = await mountSuspended(LandingPage, { route: '/' })

    expect(wrapper.get('[data-testid="hero-signup"]').attributes('href')).toBe('/cadastro')
    expect(wrapper.get('[data-testid="hero-login"]').attributes('href')).toBe('/entrar')
    expect(wrapper.get('[data-testid="final-signup"]').attributes('href')).toBe('/cadastro')
  })
})

describe('limitations page', () => {
  it('T-FE-LAND-08 lists the limitations, including the AI provider that has to be paid for', async () => {
    const wrapper = await mountSuspended(LimitationsPage, { route: '/limitacoes' })

    for (const id of ['comercial', 'provedor-ia', 'avaliacao', 'dicas', 'qualidade-ia', 'responsaveis']) {
      expect(wrapper.find(`[data-testid="limitation-${id}"]`).exists(), id).toBe(true)
    }
    const provider = wrapper.get('[data-testid="limitation-provedor-ia"]').text()
    expect(provider).toContain('provedor de IA')
    expect(provider).toContain('custo')
    expect(wrapper.text().toLowerCase()).not.toContain('protótipo')
  })

  it('T-FE-LAND-08 the link back goes to the landing page for a visitor and to the home for a student', async () => {
    const visitor = await mountSuspended(LimitationsPage, { route: '/limitacoes' })
    expect(visitor.get('[data-testid="limitations-back"]').attributes('href')).toBe('/')

    localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role: 'student', username: 'ana' }))
    useAuthStore().restore()
    const student = await mountSuspended(LimitationsPage, { route: '/limitacoes' })
    expect(student.get('[data-testid="limitations-back"]').attributes('href')).toBe('/inicio')
  })
})
