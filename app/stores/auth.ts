import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authService from '~/services/auth'
import { configureHttp } from '~/services/http'
import type { Credentials, Role } from '~/types/api'

const SESSION_KEY = 'cq-session'
const ROLES: readonly Role[] = ['student', 'professor']

interface Session {
  token: string
  role: Role
  username: string
}

function readSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Session>
    if (typeof value.token === 'string' && typeof value.username === 'string' && ROLES.includes(value.role as Role)) {
      return value as Session
    }
  }
  catch {
    // Broken JSON: treated as no session below.
  }
  localStorage.removeItem(SESSION_KEY)
  return null
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const role = ref<Role | null>(null)
  const username = ref<string | null>(null)

  const isLoggedIn = computed(() => token.value !== null)
  const home = computed(() => (role.value === 'professor' ? '/professor' : '/'))

  function setSession(session: Session | null) {
    token.value = session?.token ?? null
    role.value = session?.role ?? null
    username.value = session?.username ?? null
  }

  function restore() {
    if (!token.value) setSession(readSession())
  }

  async function login(credentials: Credentials) {
    const response = await authService.login(credentials)
    // The backend stores usernames in lower case; the login response does not echo it.
    const session: Session = {
      token: response.access_token,
      role: response.role,
      username: credentials.username.trim().toLowerCase(),
    }
    setSession(session)
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  // Sign-up returns no token, so the student is logged in right after it.
  async function register(credentials: Credentials) {
    await authService.register(credentials)
    await login(credentials)
  }

  function logout() {
    setSession(null)
    localStorage.removeItem(SESSION_KEY)
  }

  configureHttp({
    baseURL: useRuntimeConfig().public.apiBase as string,
    getToken: () => token.value,
    onUnauthorized: () => {
      logout()
      navigateTo('/entrar')
    },
  })

  return { token, role, username, isLoggedIn, home, restore, login, register, logout }
})
