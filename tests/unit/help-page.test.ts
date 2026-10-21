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
})
