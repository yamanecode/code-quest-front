import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import PendingRecoveryModal from '~/components/game/PendingRecoveryModal.vue'
import RecoveryCodeModal from '~/components/game/RecoveryCodeModal.vue'
import RecoveryCard from '~/components/profile/RecoveryCard.vue'
import RecuperarSenhaPage from '~/pages/recuperar-senha.vue'
import * as authService from '~/services/auth'
import { ApiError, configureHttp } from '~/services/http'
import * as studentService from '~/services/student'
import { RECOVERY_LATER_KEY, useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'
import type { Profile } from '~/types/api'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

vi.mock('~/services/auth', () => ({ login: vi.fn(), register: vi.fn(), resetPassword: vi.fn() }))
vi.mock('~/services/student', () => ({
  getMe: vi.fn(),
  regenerateRecoveryCode: vi.fn(),
  confirmRecoveryCode: vi.fn(),
}))

const CODE = 'K7QM-X2PD-9WFA-3HTR'

const profileData: Profile = {
  username: 'ana', role: 'student', xp: 0, level: 1, title: 'Aprendiz', xp_to_next_level: 50, streak: 0,
  missions_completed: 0, solved_by_skill: { ordering: 0, grouping: 0, filtering: 0, pattern: 0 },
  first_try_solves: 0, profile_public: false, badges: [],
  recovery_code_active: true, recovery_code_created_at: '2026-10-01T12:00:00-03:00', recovery_code_confirmed: false,
}

// mountSuspended uses the app's own Pinia, so the tests share it and start from a cleared profile store.
beforeEach(() => {
  useProfileStore().clear()
  useProfileStore().codeModalOpen = false
  sessionStorage.clear()
  localStorage.clear()
  vi.mocked(authService.resetPassword).mockReset()
  vi.mocked(authService.login).mockReset()
  useAuthStore().logout()
  vi.mocked(studentService.getMe).mockReset().mockResolvedValue({ ...profileData })
  vi.mocked(studentService.regenerateRecoveryCode).mockReset()
  vi.mocked(studentService.confirmRecoveryCode).mockReset().mockResolvedValue(undefined)
  navigateToMock.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const text = (wrapper: Awaited<ReturnType<typeof mountSuspended>>, id: string) => wrapper.get(`[data-testid="${id}"]`).text()

describe('recovery services and store', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.stubGlobal('$fetch', fetchMock)
    configureHttp({ baseURL: 'http://api.test', getToken: () => 'tok', onUnauthorized: vi.fn() })
  })

  it('T-FE-REC-01 the services send the contract calls', async () => {
    const real = await vi.importActual<typeof import('~/services/auth')>('~/services/auth')
    const realStudent = await vi.importActual<typeof import('~/services/student')>('~/services/student')
    fetchMock.mockResolvedValue({ recovery_code: CODE, created_at: 'x' })

    await real.resetPassword({ username: 'ana', recovery_code: CODE, new_password: 'novasenha1' })
    await realStudent.regenerateRecoveryCode('segredo123')
    await realStudent.confirmRecoveryCode()

    const [reset, issue, confirm] = fetchMock.mock.calls as [string, { method: string, body?: unknown }][]
    expect(reset![0]).toBe('/api/auth/reset-password')
    expect(reset![1].body).toEqual({ username: 'ana', recovery_code: CODE, new_password: 'novasenha1' })
    expect(issue![0]).toBe('/api/me/recovery-code')
    expect(issue![1].body).toEqual({ password: 'segredo123' })
    expect(confirm![0]).toBe('/api/me/recovery-code/confirm')
    expect(confirm![1].method).toBe('POST')
  })

  it('T-FE-REC-01 the auth store hands the code to the caller and keeps nothing', async () => {
    vi.mocked(authService.register).mockResolvedValue({ id: 1, username: 'ana', role: 'student', recovery_code: CODE })
    vi.mocked(authService.login).mockResolvedValue({ access_token: 'tok', token_type: 'bearer', role: 'student' })
    vi.mocked(authService.resetPassword).mockResolvedValue({ recovery_code: 'AAAA-BBBB-CCCC-DDDD' })
    const auth = useAuthStore()

    expect(await auth.register({ username: 'ana', password: 'segredo123' })).toBe(CODE)
    expect(await auth.resetPassword({ username: 'ana', recovery_code: CODE, new_password: 'novasenha1' })).toBe('AAAA-BBBB-CCCC-DDDD')

    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + JSON.stringify(auth.$state)
    expect(stored).not.toContain(CODE)
    expect(stored).not.toContain('AAAA-BBBB')
  })
})

describe('RecoveryCodeModal', () => {
  it('T-FE-REC-03 the code is covered until shown, and Copiar only exists while it is shown', async () => {
    const wrapper = await mountSuspended(RecoveryCodeModal, { props: { code: CODE } })

    expect(text(wrapper, 'recovery-code-text')).toBe('••••-••••-••••-••••')
    expect(wrapper.html()).not.toContain(CODE)
    expect(wrapper.find('[data-testid="recovery-copy"]').exists()).toBe(false)
    expect(text(wrapper, 'recovery-toggle')).toBe('Mostrar')

    await wrapper.get('[data-testid="recovery-toggle"]').trigger('click')
    expect(text(wrapper, 'recovery-code-text')).toBe(CODE)
    expect(text(wrapper, 'recovery-toggle')).toBe('Ocultar')
    expect(wrapper.find('[data-testid="recovery-copy"]').exists()).toBe(true)

    await wrapper.get('[data-testid="recovery-toggle"]').trigger('click')
    expect(text(wrapper, 'recovery-code-text')).toBe('••••-••••-••••-••••')
    expect(wrapper.find('[data-testid="recovery-copy"]').exists()).toBe(false)
  })

  it('T-FE-REC-03 copying shows "Copiado" for about two seconds; a refused copy says so', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = await mountSuspended(RecoveryCodeModal, { props: { code: CODE } })
    await wrapper.get('[data-testid="recovery-toggle"]').trigger('click')

    await wrapper.get('[data-testid="recovery-copy"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(CODE)
    expect(text(wrapper, 'recovery-copied')).toBe('Copiado')
    vi.advanceTimersByTime(2100)
    await flushPromises()
    expect(wrapper.find('[data-testid="recovery-copied"]').exists()).toBe(false)

    writeText.mockRejectedValue(new Error('denied'))
    await wrapper.get('[data-testid="recovery-copy"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="recovery-copied"]').exists()).toBe(false)
    expect(text(wrapper, 'recovery-copy-error')).toContain('Não foi possível copiar')
  })

  it('T-FE-REC-04 Continuar waits for the checkbox and Esc does not close the dialog', async () => {
    const wrapper = await mountSuspended(RecoveryCodeModal, { props: { code: CODE } })
    const dialog = wrapper.get('[role="dialog"]')

    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-labelledby')).toBeTruthy()
    expect(wrapper.get('[data-testid="recovery-continue"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="recovery-confirm-check"]').setValue(true)
    expect(wrapper.get('[data-testid="recovery-continue"]').attributes('disabled')).toBeUndefined()

    await dialog.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[data-testid="recovery-modal"]').exists()).toBe(true)
    expect(wrapper.emitted('confirmed')).toBeUndefined()

    await wrapper.get('[data-testid="recovery-continue"]').trigger('click')
    expect(wrapper.emitted('confirmed')).toHaveLength(1)
  })

  it('T-FE-REC-04 the dialog has no close button or cancel action', async () => {
    const wrapper = await mountSuspended(RecoveryCodeModal, { props: { code: CODE } })
    const buttons = wrapper.findAll('button').map((button) => button.attributes('data-testid'))
    expect(buttons).toEqual(['recovery-toggle', 'recovery-continue'])
  })

  it('T-FE-REC-05 the code is never written to the browser storage', async () => {
    const wrapper = await mountSuspended(RecoveryCodeModal, { props: { code: CODE } })
    await wrapper.get('[data-testid="recovery-toggle"]').trigger('click')

    expect(JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })).not.toContain(CODE)
    expect(useProfileStore().codeModalOpen).toBe(true)
    wrapper.unmount()
    expect(useProfileStore().codeModalOpen).toBe(false)
  })
})

describe('recovery card on the profile', () => {
  async function open(profile: Partial<Profile> = {}) {
    vi.mocked(studentService.getMe).mockResolvedValue({ ...profileData, ...profile })
    const store = useProfileStore()
    await store.load()
    return mountSuspended(RecoveryCard)
  }

  it('T-FE-REC-09 shows the status, and a warning while the code is unconfirmed', async () => {
    const wrapper = await open()
    expect(text(wrapper, 'recovery-status')).toMatch(/^Código de recuperação ativo desde \d{2}\/\d{2}\/\d{4}$/)
    expect(text(wrapper, 'recovery-unconfirmed')).toContain('não confirmou')

    const none = await open({ recovery_code_active: false, recovery_code_created_at: null })
    expect(text(none, 'recovery-status')).toBe('Você ainda não tem um código de recuperação.')

    const confirmed = await open({ recovery_code_confirmed: true })
    expect(confirmed.find('[data-testid="recovery-unconfirmed"]').exists()).toBe(false)
  })

  it('T-FE-REC-02 a wrong password shows the error under the field and nobody is logged out', async () => {
    const onUnauthorized = vi.fn()
    configureHttp({ onUnauthorized })
    vi.mocked(studentService.regenerateRecoveryCode).mockRejectedValue(new ApiError(403, 'invalid_password', 'Senha incorreta.'))
    const wrapper = await open()

    await wrapper.get('[data-testid="recovery-generate"]').trigger('click')
    await wrapper.get('[data-testid="recovery-password"]').setValue('errada')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(text(wrapper, 'recovery-generate-error')).toBe('Senha incorreta.')
    expect(wrapper.find('[data-testid="recovery-modal"]').exists()).toBe(false)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('T-FE-REC-09 the right password shows the new code once; confirming it refreshes the profile and drops the code', async () => {
    vi.mocked(studentService.regenerateRecoveryCode).mockResolvedValue({ recovery_code: CODE, created_at: '2026-10-29T10:00:00-03:00' })
    const wrapper = await open({ recovery_code_confirmed: true })

    await wrapper.get('[data-testid="recovery-generate"]').trigger('click')
    await wrapper.get('[data-testid="recovery-password"]').setValue('segredo123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(studentService.regenerateRecoveryCode).toHaveBeenCalledWith('segredo123')
    expect(wrapper.find('[data-testid="recovery-modal"]').exists()).toBe(true)

    await wrapper.get('[data-testid="recovery-confirm-check"]').setValue(true)
    await wrapper.get('[data-testid="recovery-continue"]').trigger('click')
    await flushPromises()

    expect(studentService.confirmRecoveryCode).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="recovery-modal"]').exists()).toBe(false)
    expect(wrapper.html()).not.toContain(CODE)
    expect(useProfileStore().profile?.recovery_code_confirmed).toBe(true)
  })
})

describe('reset page', () => {
  async function submit(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
    await wrapper.get('[data-testid="reset-username"]').setValue('ana')
    await wrapper.get('[data-testid="reset-code"]').setValue(CODE.toLowerCase())
    await wrapper.get('[data-testid="reset-password"]').setValue('novasenha1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
  }

  it('T-FE-REC-02 invalid_recovery shows one fixed message', async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue(
      new ApiError(400, 'invalid_recovery', 'Mensagem do servidor que não deve aparecer.'),
    )
    const wrapper = await mountSuspended(RecuperarSenhaPage)

    await submit(wrapper)

    expect(text(wrapper, 'reset-error')).toBe('Usuário ou código de recuperação inválido.')
    expect(wrapper.find('[data-testid="recovery-modal"]').exists()).toBe(false)
  })

  it('T-FE-REC-10 success logs in with the new password, confirms the replacement code and opens the home', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({ recovery_code: 'AAAA-BBBB-CCCC-DDDD' })
    vi.mocked(authService.login).mockResolvedValue({ access_token: 'tok', token_type: 'bearer', role: 'student' })
    const wrapper = await mountSuspended(RecuperarSenhaPage)

    await submit(wrapper)

    expect(authService.resetPassword).toHaveBeenCalledWith({ username: 'ana', recovery_code: CODE.toLowerCase(), new_password: 'novasenha1' })
    expect(authService.login).toHaveBeenCalledWith({ username: 'ana', password: 'novasenha1' })
    expect(wrapper.find('[data-testid="recovery-modal"]').exists()).toBe(true)

    await wrapper.get('[data-testid="recovery-confirm-check"]').setValue(true)
    await wrapper.get('[data-testid="recovery-continue"]').trigger('click')
    await flushPromises()

    expect(studentService.confirmRecoveryCode).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('/inicio')
    expect(wrapper.html()).not.toContain('AAAA-BBBB-CCCC-DDDD')
  })

  it('T-FE-REC-10 if the automatic login fails, the page ends on "Senha alterada" and the login link', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({ recovery_code: 'AAAA-BBBB-CCCC-DDDD' })
    vi.mocked(authService.login).mockRejectedValue(new ApiError(0, 'network_error', 'Sem conexão.'))
    const wrapper = await mountSuspended(RecuperarSenhaPage)

    await submit(wrapper)
    await wrapper.get('[data-testid="recovery-confirm-check"]').setValue(true)
    await wrapper.get('[data-testid="recovery-continue"]').trigger('click')
    await flushPromises()

    expect(studentService.confirmRecoveryCode).not.toHaveBeenCalled()
    expect(navigateToMock).not.toHaveBeenCalled()
    expect(text(wrapper, 'reset-done')).toBe('Senha alterada')
    expect(wrapper.find('[data-testid="reset-go-login"]').attributes('href')).toBe('/entrar')
  })

  it('T-FE-REC-10 the password can be shown or hidden', async () => {
    const wrapper = await mountSuspended(RecuperarSenhaPage)
    const field = () => wrapper.get('[data-testid="reset-password"]').attributes('type')

    expect(field()).toBe('password')
    await wrapper.get('[data-testid="reset-show-password"]').setValue(true)
    expect(field()).toBe('text')
  })

  it('T-FE-REC-11 a 429 with retry_after disables the button and counts down', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    vi.mocked(authService.resetPassword).mockRejectedValue(
      new ApiError(429, 'too_many_attempts', 'Muitas tentativas. Aguarde e tente de novo.', 3),
    )
    const wrapper = await mountSuspended(RecuperarSenhaPage)

    await submit(wrapper)

    expect(text(wrapper, 'reset-error')).toBe('Muitas tentativas. Aguarde e tente de novo.')
    expect(text(wrapper, 'reset-wait')).toBe('Tente de novo em 3 s.')
    expect(wrapper.get('[data-testid="reset-submit"]').attributes('disabled')).toBeDefined()

    vi.advanceTimersByTime(3000)
    await flushPromises()
    expect(wrapper.find('[data-testid="reset-wait"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="reset-submit"]').attributes('disabled')).toBeUndefined()
  })
})

describe('pending recovery reminder', () => {
  it('T-FE-REC-06 shows only while the code is unconfirmed, not postponed and no code modal is open', async () => {
    const store = useProfileStore()
    expect(store.showRecoveryReminder).toBe(false) // no profile yet

    await store.load()
    expect(store.showRecoveryReminder).toBe(true)

    store.codeModalOpen = true
    expect(store.showRecoveryReminder).toBe(false)
    store.codeModalOpen = false

    await store.confirmRecoveryCode()
    expect(store.showRecoveryReminder).toBe(false)
  })

  it('T-FE-REC-06 "Depois" hides it for the session and logging out brings it back', async () => {
    const store = useProfileStore()
    await store.load()

    store.postponeReminder()
    expect(store.showRecoveryReminder).toBe(false)
    expect(sessionStorage.getItem(RECOVERY_LATER_KEY)).toBe('1')
    expect(RECOVERY_LATER_KEY).toBe('cq-recovery-later')

    useAuthStore().logout()
    store.clear()
    await store.load()
    expect(sessionStorage.getItem(RECOVERY_LATER_KEY)).toBeNull()
    expect(store.showRecoveryReminder).toBe(true)
  })

  it('T-FE-REC-06 postponing works even when the storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const store = useProfileStore()
    await store.load()

    expect(() => store.postponeReminder()).not.toThrow()
    expect(store.showRecoveryReminder).toBe(false)
    vi.restoreAllMocks()
  })

  it('T-FE-REC-06 the dialog offers "Ir para o perfil" and "Depois"', async () => {
    const wrapper = await mountSuspended(PendingRecoveryModal)

    expect(wrapper.get('[role="alertdialog"]').attributes('aria-modal')).toBe('true')
    await wrapper.get('[data-testid="recovery-pending-profile"]').trigger('click')
    await wrapper.get('[data-testid="recovery-pending-later"]').trigger('click')
    expect(wrapper.emitted('profile')).toHaveLength(1)
    expect(wrapper.emitted('later')).toHaveLength(1)
  })
})
