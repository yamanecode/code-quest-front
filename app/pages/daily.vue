<template>
  <div class="max-w-2xl mx-auto px-8 py-10">
    <!-- header -->
    <div class="mb-8 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-4xl mb-4 relative">
        👑
        <span class="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-75" />
        <span class="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full" />
      </div>
      <h1 class="text-2xl font-bold text-white mb-1">Desafio do Dia</h1>
      <p class="text-amber-400/70 text-sm font-medium">Renovado diariamente</p>
    </div>

        <!-- Generate button -->
    <div class="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 text-center mb-6">
      <button
        @click="generateDaily"
        :disabled="generating"
        class="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-400 px-3 py-1.5 rounded-lg transition-colors"
      >
        {{ generating ? 'Gerando...' : '🔄 Gerar novo desafio diário (teste)' }}
      </button>
    </div>

    <div v-if="daily">
      <!-- card -->
      <div class="relative bg-gray-900 border border-amber-500/30 rounded-2xl overflow-hidden mb-6">
        <!-- Glow effect -->
        <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />

        <div class="relative p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold">👑 DESAFIO</span>
            <span class="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full">{{ difficultyLabel(daily.difficulty) }}</span>
            <span class="text-xs bg-gray-800 text-indigo-400 px-2.5 py-1 rounded-full">+{{ xpForDifficulty(daily.difficulty) }} XP</span>
          </div>

          <h2 class="text-xl font-bold text-white mb-2">{{ daily.title }}</h2>
          <p class="text-gray-400 text-sm leading-relaxed mb-6">{{ daily.description }}</p>

          <NuxtLink
            :to="`/challenge/${daily.id}`"
            class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3 px-6 rounded-xl transition-all text-sm hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
          >
            <span>Aceitar Desafio</span>
            <span>→</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Flavor text -->
      <div class="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 text-center">
        <p class="text-gray-600 text-xs">Complete os desafios dos módulos laterais para se preparar para este desafio</p>
      </div>
    </div>

    <div v-else-if="loading" class="flex items-center justify-center h-40">
      <p class="text-gray-600 text-sm">Carregando...</p>
    </div>

    <div v-else class="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
      <p class="text-4xl mb-4">😴</p>
      <p class="text-gray-400 text-sm">Nenhum desafio diário disponível hoje.</p>
      <p class="text-gray-600 text-xs mt-2">Volte amanhã ou peça ao professor para configurar um!</p>
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

const daily = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  auth.loadFromStorage()
  if (!auth.isLoggedIn) { router.push('/'); return }
  try {
    const d = await api.get('/users/daily-challenge')
    if (!d.message) daily.value = d
  } catch {
    router.push('/')
  } finally {
    loading.value = false
  }
})

function difficultyLabel(d: number) { return ['', 'Fácil', 'Médio', 'Difícil', 'Muito Difícil'][d] || '' }
function xpForDifficulty(d: number) { return [0, 10, 20, 35, 50][d] || 10 }

const generating = ref(false)

async function generateDaily() {
  generating.value = true
  try {
    const d = await api.post('/tutor/generate-daily', {})
    daily.value = d
  } catch (e: any) {
    alert('Erro ao gerar: ' + e.message)
  } finally {
    generating.value = false
  }
}
</script>