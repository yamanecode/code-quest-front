import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import EntrarPage from '~/pages/entrar.vue'
import CadastroPage from '~/pages/cadastro.vue'
import * as authService from '~/services/auth'
import { ApiError } from '~/services/http'
import { useAuthStore } from '~/stores/auth'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

vi.mock('~/services/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

beforeEach(() => {
  useAuthStore().logout()
  vi.mocked(authService.login).mockReset()
  vi.mocked(authService.register).mockReset()
  navigateToMock.mockReset()
})

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

async function fill(wrapper: Wrapper, prefix: string, username: string, password: string) {
  await wrapper.get(`[data-testid="${prefix}-username"]`).setValue(username)
  await wrapper.get(`[data-testid="${prefix}-password"]`).setValue(password)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('login page', () => {
  it('T-FE-AUTH-PAGE-01 shows the API error message', async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new ApiError(401, 'invalid_credentials', 'Usuário ou senha incorretos.'),
    )
    const wrapper = await mountSuspended(EntrarPage)

    await fill(wrapper, 'login', 'ana', 'senha-errada')

    expect(wrapper.get('[data-testid="login-error"]').text()).toBe('Usuário ou senha incorretos.')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('T-FE-AUTH-PAGE-02 a student goes to the student home after login', async () => {
    vi.mocked(authService.login).mockResolvedValue({ access_token: 't', token_type: 'bearer', role: 'student' })
    const wrapper = await mountSuspended(EntrarPage)

    await fill(wrapper, 'login', 'ana', 'segredo123')

    expect(authService.login).toHaveBeenCalledWith({ username: 'ana', password: 'segredo123' })
    expect(navigateToMock).toHaveBeenCalledWith('/inicio')
  })

  it('T-FE-AUTH-PAGE-02 a professor goes to the professor home after login', async () => {
    vi.mocked(authService.login).mockResolvedValue({ access_token: 't', token_type: 'bearer', role: 'professor' })
    const wrapper = await mountSuspended(EntrarPage)

    await fill(wrapper, 'login', 'prof', 'segredo123')

    expect(navigateToMock).toHaveBeenCalledWith('/professor')
  })
})

describe('sign-up page', () => {
  it('T-FE-AUTH-PAGE-01 warns not to use the real name and asks for no join code', async () => {
    const wrapper = await mountSuspended(CadastroPage)

    expect(wrapper.get('[data-testid="signup-real-name-warning"]').text()).toMatch(/não use seu nome real/i)
    expect(wrapper.findAll('input').map((input) => input.attributes('data-testid'))).toEqual([
      'signup-username',
      'signup-password',
    ])
  })

  it('T-FE-AUTH-PAGE-01 shows the API error message', async () => {
    vi.mocked(authService.register).mockRejectedValue(
      new ApiError(409, 'username_taken', 'Esse nome de usuário já está em uso.'),
    )
    const wrapper = await mountSuspended(CadastroPage)

    await fill(wrapper, 'signup', 'ana', 'segredo123')

    expect(wrapper.get('[data-testid="signup-error"]').text()).toBe('Esse nome de usuário já está em uso.')
    expect(authService.login).not.toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('T-FE-AUTH-PAGE-02 a new student is logged in and goes to the student home', async () => {
    vi.mocked(authService.register).mockResolvedValue({ id: 3, username: 'bia', role: 'student' })
    vi.mocked(authService.login).mockResolvedValue({ access_token: 't', token_type: 'bearer', role: 'student' })
    const wrapper = await mountSuspended(CadastroPage)

    await fill(wrapper, 'signup', 'bia', 'segredo123')

    expect(authService.register).toHaveBeenCalledWith({ username: 'bia', password: 'segredo123' })
    expect(navigateToMock).toHaveBeenCalledWith('/inicio')
  })
})
