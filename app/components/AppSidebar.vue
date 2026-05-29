<template>
  <aside class="w-72 flex-shrink-0 bg-gray-900 border-r border-gray-800/60 flex flex-col h-full overflow-hidden">
    <!-- Sidebar header -->
    <div class="px-5 py-4 border-b border-gray-800/60">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest">Trilha de Aprendizado</p>
    </div>

    <nav class="flex-1 overflow-y-auto py-3 space-y-1 px-2">
      <!-- Dashboard link -->
      <NuxtLink
        to="/home"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group"
        :class="isActive('/home') ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'"
      >
        <span class="text-base">🏠</span>
        <span class="font-medium">Início</span>
      </NuxtLink>

      <!-- Daily challenge -->
      <NuxtLink
        to="/daily"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative overflow-hidden group"
        :class="isActive('/daily') ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40' : 'text-gray-300 hover:text-white border border-transparent hover:border-amber-700/40 hover:bg-amber-900/10'"
      >
        <span class="relative z-10 text-base">👑</span>
        <div class="relative z-10 flex-1">
          <span class="font-semibold tracking-tight">Desafio do Dia</span>
          <p class="text-xs opacity-60 mt-0.5 leading-tight">Renovado diariamente</p>
        </div>
        <span v-if="!isActive('/daily')" class="relative z-10 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-medium border border-amber-500/30">DESAFIO</span>
      </NuxtLink>

      <div class="pt-2 pb-1 px-3">
        <p class="text-xs font-semibold text-gray-600 uppercase tracking-widest">Módulos</p>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="px-3 py-4 text-center">
        <div class="text-gray-600 text-xs">Carregando...</div>
      </div>

      <!-- Modules -->
      <div v-else v-for="mod in modules" :key="mod.category" class="space-y-0.5">
        <!-- Module header -->
        <button
          @click="toggleModule(mod.category)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-gray-800/60 group"
          :class="openModules.has(mod.category) ? 'text-white' : 'text-gray-400 hover:text-white'"
        >
          <span class="text-base flex-shrink-0">{{ mod.icon }}</span>
          <div class="flex-1 text-left min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium truncate">{{ mod.label }}</span>
              <span class="text-xs text-gray-600 flex-shrink-0">{{ mod.completed }}/{{ mod.challenges.length }}</span>
            </div>
            <!-- Progress bar -->
            <div class="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="mod.progressColor"
                :style="{ width: `${mod.progress}%` }"
              />
            </div>
          </div>
          <svg
            class="w-4 h-4 flex-shrink-0 text-gray-600 transition-transform duration-200"
            :class="openModules.has(mod.category) ? 'rotate-180' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Module challenges -->
        <div v-if="openModules.has(mod.category)" class="ml-4 pl-3 border-l border-gray-800 space-y-0.5 pb-1">
          <NuxtLink
            v-for="ch in mod.challenges"
            :key="ch.id"
            :to="`/challenge/${ch.id}`"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all group"
            :class="isActive(`/challenge/${ch.id}`)
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
              : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/50'"
          >
            <!-- Completion indicator -->
            <span class="flex-shrink-0 w-4 h-4 flex items-center justify-center">
              <span v-if="completedIds.has(ch.id)" class="text-green-400 text-sm">✓</span>
              <span v-else class="w-2 h-2 rounded-full border border-gray-700 bg-gray-800 group-hover:border-gray-500 transition-colors" />
            </span>
            <div class="flex-1 min-w-0">
              <span class="block truncate font-medium leading-tight">{{ ch.title }}</span>
              <span class="text-gray-600 group-hover:text-gray-500">{{ difficultyLabel(ch.difficulty) }}</span>
            </div>
            <span class="flex-shrink-0 text-gray-700 text-xs">{{ difficultyDot(ch.difficulty) }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- User mini profile at bottom -->
    <div v-if="user" class="px-4 py-3 border-t border-gray-800/60 flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
        {{ user.name?.charAt(0)?.toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-gray-300 truncate">{{ user.name }}</p>
        <p class="text-xs text-gray-600">Nível {{ user.level }} · {{ user.xp }} XP</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

const api = useApi()
const auth = useAuthStore()
const route = useRoute()

const loading = ref(true)
const challenges = ref<any[]>([])
const completedIds = ref<Set<number>>(new Set())
const openModules = ref<Set<string>>(new Set())
const user = computed(() => auth.user)

const MODULE_CONFIG = [
  {
    category: 'decomposition',
    label: 'Decomposição',
    icon: '🧩',
    progressColor: 'bg-blue-500',
  },
  {
    category: 'pattern',
    label: 'Reconhecimento de Padrões',
    icon: '🔍',
    progressColor: 'bg-purple-500',
  },
  {
    category: 'abstraction',
    label: 'Abstração',
    icon: '💡',
    progressColor: 'bg-cyan-500',
  },
  {
    category: 'algorithm',
    label: 'Construção de Algoritmos',
    icon: '⚙️',
    progressColor: 'bg-emerald-500',
  },
]

const modules = computed(() => {
  return MODULE_CONFIG.map(mod => {
    const modChallenges = challenges.value
      .filter(c => c.category === mod.category && !c.is_daily)
      .sort((a, b) => a.difficulty - b.difficulty)

    const completed = modChallenges.filter(c => completedIds.value.has(c.id)).length
    const progress = modChallenges.length > 0 ? Math.round((completed / modChallenges.length) * 100) : 0

    return {
      ...mod,
      challenges: modChallenges,
      completed,
      progress,
    }
  }).filter(m => m.challenges.length > 0)
})

function toggleModule(category: string) {
  if (openModules.value.has(category)) {
    openModules.value.delete(category)
  } else {
    openModules.value.add(category)
  }
}

function isActive(path: string) {
  return route.path === path
}

function difficultyLabel(d: number) {
  return ['', 'Fácil', 'Médio', 'Difícil'][d] || ''
}

function difficultyDot(d: number) {
  return ['', '●', '●●', '●●●'][d] || ''
}

async function load() {
  loading.value = true
  try {
    const [ch, subs] = await Promise.all([
      api.get('/challenges/'),
      api.get('/submissions/me').catch(() => []),
    ])
    challenges.value = ch

    // Build completed set from correct submissions
    const ids = new Set<number>()
    for (const s of subs) {
      if (s.is_correct) ids.add(s.challenge_id)
    }
    completedIds.value = ids

    // Auto-open module that has active challenge
    const activeChallenge = ch.find((c: any) => route.path === `/challenge/${c.id}`)
    if (activeChallenge) {
      openModules.value.add(activeChallenge.category)
    }
  } finally {
    loading.value = false
  }
}

// Refresh completion when navigating away from a challenge
watch(() => route.path, () => {
  load()
})

onMounted(() => {
  auth.loadFromStorage()
  load()
})
</script>