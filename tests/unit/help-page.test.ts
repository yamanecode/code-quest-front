import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AjudaPage from '~/pages/ajuda.vue'
import { useAuthStore } from '~/stores/auth'

vi.mock('~/services/student', () => ({ getMe: vi.fn(() => new Promise(() => {})) }))

function signIn(role: 'student' | 'professor') {
  const auth = useAuthStore()
  auth.logout()
  localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role, username: 'ana' }))
  auth.restore()
}

// v-show hides with an inline display: none.
const shown = (wrapper: Awaited<ReturnType<typeof mountSuspended>>, selector: string) =>
  (wrapper.get(selector).element as HTMLElement).style.display !== 'none'

beforeEach(() => {
  localStorage.clear()
})

describe('help page', () => {
  it('T-FE-HELP-02 a student sees the student sections but not the professor section', async () => {
    signIn('student')

    const wrapper = await mountSuspended(AjudaPage)

    expect(wrapper.find('[data-testid="help-skills"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="help-professor"]').exists()).toBe(false)
  })

  it('T-FE-HELP-02 a professor sees the student sections and the professor section', async () => {
    signIn('professor')

    const wrapper = await mountSuspended(AjudaPage)

    expect(wrapper.find('[data-testid="help-skills"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="help-professor"]').exists()).toBe(true)
  })

  it('T-FE-HELP-03 only a professor gets the tabs, opening on the professor guide', async () => {
    signIn('student')
    const student = await mountSuspended(AjudaPage)
    expect(student.find('[data-testid="help-tabs"]').exists()).toBe(false)
    expect(shown(student, '[data-testid="help-game"]')).toBe(true)

    signIn('professor')
    const wrapper = await mountSuspended(AjudaPage)
    expect(wrapper.get('[data-testid="help-tab-professor"]').attributes('aria-selected')).toBe('true')
    expect(shown(wrapper, '[data-testid="help-professor"]')).toBe(true)
    expect(shown(wrapper, '[data-testid="help-game"]')).toBe(false)

    await wrapper.get('[data-testid="help-tab-game"]').trigger('click')
    expect(wrapper.get('[data-testid="help-tab-game"]').attributes('aria-selected')).toBe('true')
    expect(shown(wrapper, '[data-testid="help-game"]')).toBe(true)
    expect(shown(wrapper, '[data-testid="help-professor"]')).toBe(false)

    await wrapper.get('[data-testid="help-tab-game"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.get('[data-testid="help-tab-professor"]').attributes('aria-selected')).toBe('true')
  })
})
