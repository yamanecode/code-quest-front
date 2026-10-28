import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import authGuard from '~/middleware/auth.global'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn((path: string) => path) }))
mockNuxtImport('navigateTo', () => navigateToMock)

function route(path: string) {
  return { path, fullPath: path } as RouteLocationNormalized
}

// Runs the guard for a path and returns the redirect target, or undefined when allowed.
function visit(path: string) {
  return authGuard(route(path), route('/'))
}

function saveSession(role: 'student' | 'professor') {
  localStorage.setItem('cq-session', JSON.stringify({ token: 'tok', role, username: 'ana' }))
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  navigateToMock.mockClear()
})

describe('auth.global middleware', () => {
  it('T-FE-MW-01 a visitor is sent to /entrar from protected pages', () => {
    expect(visit('/inicio')).toBe('/entrar')
    expect(visit('/perfil')).toBe('/entrar')
    expect(visit('/professor')).toBe('/entrar')
    expect(visit('/ajuda')).toBe('/entrar')
  })

  it('T-FE-MW-01 a visitor may open the public pages', () => {
    expect(visit('/entrar')).toBeUndefined()
    expect(visit('/cadastro')).toBeUndefined()
  })

  it('T-FE-MW-02 a student cannot open professor pages', () => {
    saveSession('student')

    expect(visit('/professor')).toBe('/inicio')
    expect(visit('/professor/turmas/3')).toBe('/inicio')
    expect(visit('/missoes/1')).toBeUndefined()
    expect(visit('/inicio')).toBeUndefined()
    expect(visit('/ajuda')).toBeUndefined()
    expect(visit('/entrar')).toBe('/inicio')
  })

  it('T-FE-MW-02 a professor is redirected to /professor from student pages', () => {
    saveSession('professor')

    expect(visit('/inicio')).toBe('/professor')
    expect(visit('/ranking')).toBe('/professor')
    expect(visit('/professor/desafios')).toBeUndefined()
    expect(visit('/ajuda')).toBeUndefined()
    expect(visit('/cadastro')).toBe('/professor')
  })

  it('T-FE-MW-02 a path that only starts with "professor" is a student page', () => {
    saveSession('student')

    expect(visit('/professores')).toBeUndefined()
  })

  it('T-FE-ROUTE-01 a visitor may open the landing page and the limitations page', () => {
    expect(visit('/')).toBeUndefined()
    expect(visit('/limitacoes')).toBeUndefined()
  })

  it('T-FE-ROUTE-02 a logged-in user may still open the landing page, but not the login forms', () => {
    saveSession('student')
    expect(visit('/')).toBeUndefined()
    expect(visit('/entrar')).toBe('/inicio')

    localStorage.clear()
    setActivePinia(createPinia())
    saveSession('professor')
    expect(visit('/')).toBeUndefined()
    expect(visit('/entrar')).toBe('/professor')
  })

  it('T-FE-ROUTE-03 the limitations page stays open for both roles', () => {
    saveSession('student')
    expect(visit('/limitacoes')).toBeUndefined()

    localStorage.clear()
    setActivePinia(createPinia())
    saveSession('professor')
    expect(visit('/limitacoes')).toBeUndefined()
  })
})
