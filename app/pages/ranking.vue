<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <header class="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
      <NuxtLink to="/dashboard" class="text-gray-400 hover:text-white transition-colors text-sm">← Voltar</NuxtLink>
      <span class="font-bold">🏆 Ranking</span>
    </header>

    <main class="max-w-xl mx-auto px-6 py-8">
      <div class="space-y-3">
        <div
          v-for="(entry, i) in ranking"
          :key="entry.id"
          :class="[
            'flex items-center gap-4 rounded-xl p-4 border transition-colors',
            entry.id === auth.user?.id
              ? 'bg-indigo-900/30 border-indigo-700/50'
              : 'bg-gray-900 border-gray-800'
          ]"
        >
          <div class="w-8 text-center">
            <span v-if="i === 0" class="text-xl">🥇</span>
            <span v-else-if="i === 1" class="text-xl">🥈</span>
            <span v-else-if="i === 2" class="text-xl">🥉</span>
            <span v-else class="text-gray-500 text-sm font-medium">{{ i + 1 }}</span>
          </div>
          <div class="flex-1">
            <p class="font-medium text-sm">{{ entry.name }}</p>
            <p class="text-xs text-gray-500">Nível {{ entry.level }}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-indigo-400">{{ entry.xp }}</p>
            <p class="text-xs text-gray-500">XP</p>
          </div>
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
const ranking = ref<any[]>([])

onMounted(async () => {
  auth.loadFromStorage()
  if (!auth.isLoggedIn) { router.push('/'); return }
  ranking.value = await api.get('/users/ranking')
})
</script>