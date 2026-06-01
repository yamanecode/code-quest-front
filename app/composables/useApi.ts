import { useAuthStore } from '../stores/auth'
import { useRuntimeConfig } from 'nuxt/app'

export const useApi = () => {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const auth = useAuthStore()

  const request = async (path: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`

    const res = await fetch(`${base}${path}`, { ...options, headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || `HTTP ${res.status}`)
    }
    return res.json()
  }

  return {
    get: (path: string) => request(path),
    post: (path: string, body: any) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  }
}