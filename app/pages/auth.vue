<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="11,2 21,2 30,11 30,21 21,30 11,30 2,21 2,11"
            fill="rgba(0,194,255,0.08)" stroke="#00C2FF" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="16" cy="9"  r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
          <circle cx="23" cy="16" r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
          <circle cx="16" cy="23" r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
          <circle cx="9"  cy="16" r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
          <line x1="16" y1="11" x2="21" y2="14" stroke="#00C2FF" stroke-opacity="0.3" stroke-width="0.8"/>
          <line x1="21" y1="18" x2="18" y2="21" stroke="#00C2FF" stroke-opacity="0.3" stroke-width="0.8"/>
          <line x1="16" y1="21" x2="11" y2="18" stroke="#00C2FF" stroke-opacity="0.3" stroke-width="0.8"/>
          <line x1="11" y1="14" x2="14" y2="11" stroke="#00C2FF" stroke-opacity="0.3" stroke-width="0.8"/>
          <circle cx="16" cy="16" r="1.5" fill="#00C2FF" opacity="0.5"/>
        </svg>
        <div>
          <h1 class="brand-name">CodeQuest</h1>
          <p class="brand-sub">Pensamento Computacional com IA</p>
        </div>
      </div>

      <div class="tabs">
        <button
          v-for="tab in ['login', 'registro']"
          :key="tab"
          @click="mode = tab"
          class="tab"
          :class="{ 'tab--active': mode === tab }"
        >
          {{ tab === 'login' ? 'Entrar' : 'Criar conta' }}
        </button>
      </div>

      <div class="form">
        <div v-if="mode === 'registro'" class="field">
          <label class="field-label">Nome</label>
          <input v-model="form.name" type="text" placeholder="Seu nome" class="field-input" />
        </div>

        <div class="field">
          <label class="field-label">Email</label>
          <input v-model="form.email" type="email" placeholder="seu@email.com" class="field-input" />
        </div>

        <div class="field">
          <label class="field-label">Senha</label>
          <div class="password-wrap">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="field-input field-input--password"
            />
            <button @click="showPassword = !showPassword" class="password-toggle" type="button">
              <svg v-if="!showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>

        <div v-if="mode === 'registro'" class="field">
          <label class="field-label">Tipo de conta</label>
          <select v-model="form.role" class="field-input field-input--select">
            <option value="student">Estudante</option>
            <option value="professor">Professor</option>
          </select>
        </div>

        <p v-if="error" class="error-msg" :class="{ 'error-msg--success': error.includes('Conta criada') }">{{ error }}</p>

        <button @click="submit" :disabled="loading" class="btn-submit">
          {{ loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import { definePageMeta } from '#imports'

definePageMeta({ layout: false })

const mode = ref('login')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const form = reactive({ name: '', email: '', password: '', role: 'student' })

const api = useApi()
const auth = useAuthStore()
const router = useRouter()

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'registro') {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, role: form.role })
      mode.value = 'login'
      error.value = 'Conta criada! Faça login.'
    } else {
      const data = await api.post('/auth/login', { email: form.email, password: form.password })
      auth.setToken(data.access_token)
      const user = await api.get('/users/me')
      auth.setUser(user)
      router.push('/home')
    }
  } catch (e: any) { error.value = e.message }
  finally { loading.value = false }
}
</script>

<style scoped>
.auth-page {
  min-height: 100dvh;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.auth-logo { display: flex; align-items: center; gap: 0.875rem; }
.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--cyan);
  color: #080C14;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.brand-name {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  margin: 0 0 3px;
}
.brand-sub { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
.tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-base);
  border-radius: 8px;
  padding: 4px;
}
.tab {
  flex: 1;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.tab:hover { color: var(--text-secondary); }
.tab--active { background: var(--bg-elevated); color: var(--text-primary); }
.form { display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); }
.field-input {
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: var(--font-sans);
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}
.field-input:focus { border-color: var(--border-accent); }
.field-input::placeholder { color: var(--text-muted); }
.field-input--select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234A5568' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.875rem center; padding-right: 2.25rem; }
.field-input--select option { background: var(--bg-elevated); }
.password-wrap { position: relative; }
.field-input--password { padding-right: 2.75rem; }
.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.15s;
}
.password-toggle:hover { color: var(--text-secondary); }
.error-msg { font-size: 0.8125rem; color: #f87171; margin: 0; }
.error-msg--success { color: var(--green); }
.btn-submit {
  width: 100%;
  background: var(--cyan);
  color: #080C14;
  font-weight: 700;
  font-size: 0.9375rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 0.25rem;
}
.btn-submit:hover { opacity: 0.88; }
.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
</style>