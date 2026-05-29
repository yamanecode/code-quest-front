<template>
  <div class="max-w-2xl mx-auto px-8 py-10">
    <div v-if="user">
      <h1 class="text-2xl font-bold mb-1 text-white">Olá, {{ user.name }} 👋</h1>
      <p class="text-gray-400 text-sm mb-8">Continue sua jornada no pensamento computacional</p>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div class="text-3xl font-bold text-indigo-400">{{ user.xp }}</div>
          <div class="text-xs text-gray-500 mt-1">XP Total</div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div class="text-3xl font-bold text-yellow-400">{{ user.level }}</div>
          <div class="text-xs text-gray-500 mt-1">Nível</div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div class="text-3xl font-bold text-orange-400">{{ user.streak }}🔥</div>
          <div class="text-xs text-gray-500 mt-1">Sequência</div>
        </div>
      </div>

      <!-- XP Bar -->
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div class="flex justify-between text-xs text-gray-500 mb-2">
          <span>Nível {{ user.level }}</span>
          <span>{{ user.xp % 100 }}/100 XP para o próximo nível</span>
        </div>
        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-indigo-500 rounded-full transition-all duration-700"
            :style="{ width: `${user.xp % 100}%` }"
          />
        </div>
      </div>

      <!-- Badges -->
      <div v-if="user.badges?.length" class="mb-6">
        <h2 class="text-sm font-medium text-gray-400 mb-3">Conquistas</h2>
        <div class="flex gap-2 flex-wrap">
          <div
            v-for="badge in user.badges"
            :key="badge.id"
            :title="badge.description"
            class="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
          >
            <span>{{ badge.icon }}</span>
            <span class="text-gray-300">{{ badge.name }}</span>
          </div>
        </div>
      </div>

      <!-- Quick tip -->
      <div class="bg-indigo-900/10 border border-indigo-800/30 rounded-xl p-5">
        <p class="text-xs text-indigo-400 font-semibold mb-1">💡 Dica</p>
        <p class="text-gray-400 text-sm">Use o menu lateral para navegar pelos módulos. Complete todos os desafios de um módulo antes de tentar o <span class="text-amber-400 font-medium">Desafio Diário</span></p>
      </div>
    </div>

    <div v-else class="flex items-center justify-center h-64">
      <p class="text-gray-600">Carregando...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app' })

const api = useApi()
const auth = useAuthStore()
const router = useRouter()
const user = ref<any>(null)

onMounted(async () => {
  auth.loadFromStorage()
  if (!auth.isLoggedIn) { router.push('/'); return }
  try {
    const u = await api.get('/users/me')
    user.value = u
    auth.setUser(u)
  } catch {
    router.push('/')
  }
})
</script>