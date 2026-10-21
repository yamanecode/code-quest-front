import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useAuthStore } from '~/stores/auth'
import * as authService from '~/services/auth'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

vi.mock('~/services/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

const SESSION_KEY = 'cq-session'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.mocked(authService.login).mockReset()
  vi.mocked(authService.register).mockReset()
  navigateToMock.mockReset()
})

describe('auth store', () => {
  it('T-FE-AUTH-01 login stores token, role and username', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 'tok-1',
      token_type: 'bearer',
      role: 'student',
    })
    const auth = useAuthStore()

    await auth.login({ username: 'Ana_01', password: 'segredo123' })

    expect(authService.login).toHaveBeenCalledWith({ username: 'Ana_01', password: 'segredo123' })
    expect(auth.token).toBe('tok-1')
    expect(auth.role).toBe('student')
    expect(auth.username).toBe('ana_01')
    expect(auth.isLoggedIn).toBe(true)
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!)).toEqual({
      token: 'tok-1',
      role: 'student',
      username: 'ana_01',
    })
  })

  it('T-FE-AUTH-01 register creates the account and then logs in', async () => {
    vi.mocked(authService.register).mockResolvedValue({ id: 7, username: 'bia', role: 'student' })
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 'tok-2',
      token_type: 'bearer',
      role: 'student',
    })
    const auth = useAuthStore()

    await auth.register({ username: 'bia', password: 'segredo123' })

    expect(authService.register).toHaveBeenCalledWith({ username: 'bia', password: 'segredo123' })
    expect(auth.token).toBe('tok-2')
  })

  it('T-FE-AUTH-02 logout clears the session and the storage', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 'tok-1',
      token_type: 'bearer',
      role: 'professor',
    })
    const auth = useAuthStore()
    await auth.login({ username: 'prof', password: 'segredo123' })

    auth.logout()

    expect(auth.token).toBeNull()
    expect(auth.role).toBeNull()
    expect(auth.username).toBeNull()
    expect(auth.isLoggedIn).toBe(false)
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('T-FE-AUTH-03 restore reads the saved session', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'tok-9', role: 'professor', username: 'prof' }))
    const auth = useAuthStore()

    auth.restore()

    expect(auth.token).toBe('tok-9')
    expect(auth.role).toBe('professor')
    expect(auth.username).toBe('prof')
    expect(auth.home).toBe('/professor')
  })

  it('T-FE-AUTH-03 restore ignores a broken saved session', () => {
    localStorage.setItem(SESSION_KEY, '{not json')
    const auth = useAuthStore()

    auth.restore()

    expect(auth.isLoggedIn).toBe(false)
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('T-FE-AUTH-03 restore ignores a session with an unknown role', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'tok', role: 'system', username: 'codequest' }))
    const auth = useAuthStore()

    auth.restore()

    expect(auth.isLoggedIn).toBe(false)
  })
})
