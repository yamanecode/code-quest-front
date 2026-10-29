import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import AppHeader from '~/components/layout/AppHeader.vue'
import * as studentService from '~/services/student'
import { useAuthStore } from '~/stores/auth'
import type { Profile } from '~/types/api'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

vi.mock('~/services/student', () => ({ getMe: vi.fn() }))

const profile: Profile = {
  username: 'ana',
  role: 'student',
  xp: 131,
  level: 3,
  title: 'Explorador(a)',
  xp_to_next_level: 19,
  streak: 4,
  missions_completed: 1,
  solved_by_skill: { ordering: 5, grouping: 2, filtering: 0, pattern: 1 },
  first_try_solves: 3,
  profile_public: false,
  recovery_code_active: true,
  recovery_code_created_at: '2026-10-01T12:00:00-03:00',
  recovery_code_confirmed: true,
  badges: [],
}

// Starts each test from a saved session of the given role.
function signIn(role: 'student' | 'professor') {
  const auth = useAuthStore()
  auth.logout()
  localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role, username: 'ana' }))
  auth.restore()
  return auth
}

beforeEach(() => {
  vi.mocked(studentService.getMe).mockReset()
  navigateToMock.mockReset()
})

describe('AppHeader', () => {
  it('T-FE-LAYOUT-01 a student sees level, title and XP bar from the profile', async () => {
    signIn('student')
    vi.mocked(studentService.getMe).mockResolvedValue(profile)

    const wrapper = await mountSuspended(AppHeader)
    await flushPromises()

    expect(wrapper.get('[data-testid="header-level"]').text()).toContain('3')
    expect(wrapper.get('[data-testid="header-title"]').text()).toContain('Explorador(a)')
    const bar = wrapper.get('[data-testid="header-xp"] [role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('31')
    expect(bar.attributes('aria-valuemax')).toBe('50')
    for (const link of ['inicio', 'turmas', 'ranking', 'perfil', 'ajuda']) {
      expect(wrapper.find(`[data-testid="nav-${link}"]`).exists()).toBe(true)
    }
  })

  it('the profile page shows its own stat panel, so the header leaves it out there', async () => {
    signIn('student')
    vi.mocked(studentService.getMe).mockResolvedValue(profile)

    const wrapper = await mountSuspended(AppHeader, { route: '/perfil' })
    await flushPromises()

    expect(wrapper.find('[data-testid="header-stats"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nav-perfil"]').exists()).toBe(true)
  })

  it('T-FE-LAYOUT-01 a professor sees only professor links and no game stats', async () => {
    signIn('professor')

    const wrapper = await mountSuspended(AppHeader)
    await flushPromises()

    expect(studentService.getMe).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="header-level"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="nav-prof-turmas"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-prof-desafios"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-ajuda"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-ranking"]').exists()).toBe(false)
  })

  it('T-FE-LAYOUT-01 Sair logs out and goes to the login page', async () => {
    const auth = signIn('professor')
    const wrapper = await mountSuspended(AppHeader)

    await wrapper.get('[data-testid="nav-sair"]').trigger('click')

    expect(auth.isLoggedIn).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith('/entrar')
  })
})
