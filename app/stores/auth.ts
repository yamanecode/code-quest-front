import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as any,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
  },
  actions: {
    setToken(token: string) {
      this.token = token
      if (import.meta.client) localStorage.setItem('cq_token', token)
    },
    setUser(user: any) {
      this.user = user
    },
    loadFromStorage() {
      if (import.meta.client) {
        const t = localStorage.getItem('cq_token')
        if (t) this.token = t
      }
    },
    logout() {
      this.token = null
      this.user = null
      if (import.meta.client) localStorage.removeItem('cq_token')
    },
  },
})