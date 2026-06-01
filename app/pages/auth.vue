<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-2xl">⚡</div>
          <span class="text-3xl font-bold text-white tracking-tight">CodeQuest</span>
        </div>
        <p class="text-gray-400 text-sm">Treine seu pensamento computacional</p>
      </div>

      <!-- Card -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <!-- Tabs -->
        <div class="flex gap-1 bg-gray-800 rounded-lg p-1 mb-8">
          <button
            v-for="tab in ['login', 'registro']"
            :key="tab"
            @click="mode = tab"
            :class="[
              'flex-1 py-2 rounded-md text-sm font-medium transition-all',
              mode === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            ]"
          >
            {{ tab === 'login' ? 'Entrar' : 'Criar conta' }}
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div v-if="mode === 'registro'">
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Nome</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Seu nome"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="seu@email.com"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Senha</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
          </div>

          <div v-if="mode === 'registro'">
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Tipo de conta</label>
            <select
              v-model="form.role"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            >
              <option value="student">Estudante</option>
              <option value="professor">Professor</option>
            </select>
          </div>

          <p v-if="error" class="text-red-400 text-xs">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2"
          >
            {{ loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta' }}
          </button>
        </form>
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
const form = reactive({ name: '', email: '', password: '', role: 'student' })

const api = useApi()
const auth = useAuthStore()
const router = useRouter()

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'registro') {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
      mode.value = 'login'
      error.value = 'Conta criada! Faça login.'
    } else {
      const data = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      })
      auth.setToken(data.access_token)
      const user = await api.get('/users/me')
      auth.setUser(user)
      router.push('/home')
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>