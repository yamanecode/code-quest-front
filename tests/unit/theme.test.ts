import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ThemeToggle from '~/components/layout/ThemeToggle.vue'
import { useSettingsStore } from '~/stores/settings'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

// The device setting the browser reports through matchMedia.
function deviceDark(dark: boolean) {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? dark : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('theme setting', () => {
  it('T-FE-THEME-01 a first visit follows the device setting', () => {
    deviceDark(true)
    setActivePinia(createPinia())
    expect(useSettingsStore().theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    deviceDark(false)
    setActivePinia(createPinia())
    expect(useSettingsStore().theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    // Nothing is saved until the student chooses, so the device setting keeps applying.
    expect(localStorage.getItem('cq-theme')).toBeNull()
  })

  it('T-FE-THEME-02 toggling switches the theme and remembers the choice', () => {
    deviceDark(false)
    setActivePinia(createPinia())
    const settings = useSettingsStore()

    settings.toggleTheme()
    expect(settings.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('cq-theme')).toBe('dark')

    // A saved choice wins over the device setting on the next visit.
    deviceDark(false)
    setActivePinia(createPinia())
    expect(useSettingsStore().theme).toBe('dark')
  })
})

describe('ThemeToggle', () => {
  it('T-FE-THEME-03 names the mode it switches to and switches on click', async () => {
    // The mounted component uses the app's Pinia, not the ones created above.
    const settings = useSettingsStore(useNuxtApp().$pinia as Pinia)
    settings.setTheme('light')
    const wrapper = await mountSuspended(ThemeToggle)

    const button = wrapper.get('[data-testid="theme-toggle"]')
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('aria-label')).toBe('Mudar para o modo escuro')
    expect(button.text()).toBe('Escuro')

    await button.trigger('click')
    await flushPromises()

    expect(settings.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(button.attributes('aria-label')).toBe('Mudar para o modo claro')
    expect(button.text()).toBe('Claro')
  })
})
