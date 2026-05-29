<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <!-- Header -->
    <header class="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-sm">⚡</div>
        <span class="font-bold text-lg tracking-tight">CodeQuest</span>
      </div>
      <div class="flex items-center gap-4">
        <NuxtLink to="/ranking" class="text-gray-400 hover:text-white text-sm transition-colors">🏆 Ranking</NuxtLink>
        <button @click="logout" class="text-gray-400 hover:text-white text-sm transition-colors">Sair</button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-8">
      <!-- User stats -->
      <div v-if="user" class="mb-8">
        <h1 class="text-2xl font-bold mb-1">Olá, {{ user.name }} 👋</h1>
        <p class="text-gray-400 text-sm mb-6">Continue sua jornada no pensamento computacional</p>

        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div class="text-3xl font-bold text-indigo-400">{{ user.xp }}</div>
            <div class="text-xs text-gray-400 mt-1">XP Total</div>
          </div>
          <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div class="text-3xl font-bold text-yellow-400">{{ user.level }}</div>
            <div class="text-xs text-gray-400 mt-1">Nível</div>
          </div>
          <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div class="text-3xl font-bold text-orange-400">{{ user.streak }}🔥</div>
            <div class="text-xs text-gray-400 mt-1">Sequência</div>
          </div>
        </div>

        <!-- XP bar -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div class="flex justify-between text-xs text-gray-400 mb-2">
            <span>Nível {{ user.level }}</span>
            <span>{{ user.xp % 100 }}/100 XP</span>
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
      </div>

      <!-- Daily challenge -->
      <div v-if="daily" class="mb-8">
        <h2 class="text-sm font-medium text-gray-400 mb-3">Desafio do dia</h2>
        <NuxtLink :to="`/challenge/${daily.id}`">
          <div class="bg-indigo-900/30 border border-indigo-700/50 rounded-xl p-5 hover:border-indigo-500 transition-colors cursor-pointer">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Diário</span>
              <span class="text-xs text-gray-400">{{ difficultyLabel(daily.difficulty) }}</span>
            </div>
            <h3 class="font-semibold text-white">{{ daily.title }}</h3>
            <p class="text-gray-400 text-sm mt-1">{{ daily.description }}</p>
          </div>
        </NuxtLink>
      </div>

      <!-- All challenges -->
      <div>
        <h2 class="text-sm font-medium text-gray-400 mb-3">Todos os desafios</h2>
        <div class="space-y-3">
          <NuxtLink
            v-for="c in challenges"
            :key="c.id"
            :to="`/challenge/${c.id}`"
            class="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs text-gray-500 uppercase tracking-wide">{{ categoryLabel(c.category) }}</span>
                  <span class="text-xs text-gray-600">·</span>
                  <span class="text-xs text-gray-500">{{ difficultyLabel(c.difficulty) }}</span>
                </div>
                <h3 class="font-medium text-white">{{ c.title }}</h3>
              </div>
              <span class="text-gray-600">→</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

const api = useApi()
const auth = useAuthStore()
const router = useRouter()

const user = ref<any>(null)
const challenges = ref<any[]>([])
const daily = ref<any>(null)

onMounted(async () => {
  auth.loadFromStorage()
  if (!auth.isLoggedIn) { router.push('/'); return }
  try {
    const [u, ch, d] = await Promise.all([
      api.get('/users/me'),
      api.get('/challenges/'),
      api.get('/users/daily-challenge'),
    ])
    user.value = u
    auth.setUser(u)
    challenges.value = ch
    if (!d.message) daily.value = d
  } catch {
    router.push('/')
  }
})

function logout() { auth.logout(); router.push('/') }

function difficultyLabel(d: number) {
  return ['', 'Fácil', 'Médio', 'Difícil'][d] || ''
}
function categoryLabel(c: string) {
  const map: Record<string, string> = {
    decomposition: 'Decomposição',
    pattern: 'Padrões',
    abstraction: 'Abstração',
    algorithm: 'Algoritmos',
  }
  return map[c] || c
}
</script>