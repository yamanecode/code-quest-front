<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <span class="sidebar-brand-name">CodeQuest</span>
      </div>
      <p class="sidebar-label">Trilha de Aprendizado</p>
    </div>

    <nav class="sidebar-nav">
      <NuxtLink to="/home" class="nav-item" :class="{ 'nav-item--active': isActive('/home') }">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Início</span>
      </NuxtLink>

      <NuxtLink to="/daily" class="nav-item nav-item--daily" :class="{ 'nav-item--daily-active': isActive('/daily') }">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        <div class="nav-item-body">
          <span class="nav-item-title">Desafio do Dia</span>
          <span class="nav-item-sub">Renovado diariamente</span>
        </div>
        <span v-if="!isActive('/daily')" class="daily-badge">HOJE</span>
      </NuxtLink>

      <div class="section-label">Módulos</div>

      <div v-if="loading" class="loading-state">Carregando...</div>

      <div v-else v-for="mod in modules" :key="mod.category">
        <button
          @click="toggleModule(mod.category)"
          class="module-header"
          :class="{ 'module-header--open': openModules.has(mod.category) }"
        >
          <component :is="mod.icon" class="nav-icon" />
          <div class="module-header-body">
            <div class="module-header-top">
              <span class="module-header-label">{{ mod.label }}</span>
              <span class="module-progress-text mono">{{ mod.completed }}/{{ mod.challenges.length }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${mod.progress}%`, background: mod.color }" />
            </div>
          </div>
          <svg class="chevron" :class="{ 'chevron--open': openModules.has(mod.category) }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
        </button>

        <div v-if="openModules.has(mod.category)" class="module-challenges">
          <NuxtLink
            v-for="ch in mod.challenges"
            :key="ch.id"
            :to="`/challenge/${ch.id}`"
            class="challenge-item"
            :class="{ 'challenge-item--active': isActive(`/challenge/${ch.id}`) }"
          >
            <span class="challenge-status">
              <svg v-if="completedIds.has(ch.id)" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span v-else class="dot" />
            </span>
            <div class="challenge-info">
              <span class="challenge-title">{{ ch.title }}</span>
              <span class="challenge-diff mono">{{ difficultyLabel(ch.difficulty) }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <div v-if="user" class="sidebar-footer">
      <div class="user-avatar">{{ user.name?.charAt(0)?.toUpperCase() }}</div>
      <div class="user-info">
        <span class="user-name">{{ user.name }}</span>
        <span class="user-stats mono">Nv.{{ user.level }} · {{ user.xp }} XP</span>
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

const IconDecomp = defineComponent({
  render: () => h('svg', { class: 'nav-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('rect', { x: '2', y: '3', width: '20', height: '14', rx: '2' }),
    h('path', { d: 'M8 21h8M12 17v4' }),
    h('path', { d: 'M7 10h2M11 10h2M15 10h2' }),
  ])
})
const IconPattern = defineComponent({
  render: () => h('svg', { class: 'nav-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('circle', { cx: '11', cy: '11', r: '8' }),
    h('path', { d: 'M21 21l-4.35-4.35' }),
  ])
})
const IconAbstraction = defineComponent({
  render: () => h('svg', { class: 'nav-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }),
    h('path', { d: 'M2 17l10 5 10-5' }),
    h('path', { d: 'M2 12l10 5 10-5' }),
  ])
})
const IconAlgorithm = defineComponent({
  render: () => h('svg', { class: 'nav-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
    h('polyline', { points: '16 18 22 12 16 6' }),
    h('polyline', { points: '8 6 2 12 8 18' }),
  ])
})

const MODULE_CONFIG = [
  { category: 'decomposition', label: 'Decomposição', icon: IconDecomp, color: '#00C2FF' },
  { category: 'pattern', label: 'Rec. de Padrões', icon: IconPattern, color: '#A78BFA' },
  { category: 'abstraction', label: 'Abstração', icon: IconAbstraction, color: '#34D399' },
  { category: 'algorithm', label: 'Algoritmos', icon: IconAlgorithm, color: '#F59E0B' },
]

const modules = computed(() =>
  MODULE_CONFIG.map(mod => {
    const modChallenges = challenges.value
      .filter(c => c.category === mod.category && !c.is_daily)
      .sort((a, b) => a.difficulty - b.difficulty)
    const completed = modChallenges.filter(c => completedIds.value.has(c.id)).length
    const progress = modChallenges.length > 0 ? Math.round((completed / modChallenges.length) * 100) : 0
    return { ...mod, challenges: modChallenges, completed, progress }
  }).filter(m => m.challenges.length > 0)
)

function toggleModule(category: string) {
  openModules.value.has(category) ? openModules.value.delete(category) : openModules.value.add(category)
}
function isActive(path: string) { return route.path === path }
function difficultyLabel(d: number) { return ['', 'Fácil', 'Médio', 'Difícil'][d] || '' }

async function load() {
  loading.value = true
  try {
    const [ch, subs] = await Promise.all([
      api.get('/challenges/'),
      api.get('/submissions/me').catch(() => []),
    ])
    challenges.value = ch
    const ids = new Set<number>()
    for (const s of subs) { if (s.is_correct) ids.add(s.challenge_id) }
    completedIds.value = ids
    const activeChallenge = ch.find((c: any) => route.path === `/challenge/${c.id}`)
    if (activeChallenge) openModules.value.add(activeChallenge.category)
  } finally {
    loading.value = false
  }
}

watch(() => route.path, () => load())
onMounted(() => { auth.loadFromStorage(); load() })
</script>

<style scoped>
.sidebar {
  width: 256px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.sidebar-header {
  padding: 0.875rem 1rem 0.75rem;
  border-bottom: 1px solid var(--border);
}
.sidebar-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.sidebar-brand-name {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

.nav-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
}
.nav-item:hover { color: var(--text-primary); background: rgba(255,255,255,0.04); }
.nav-item--active {
  color: var(--cyan);
  background: var(--cyan-dim);
}
.nav-item--daily {
  margin-top: 2px;
  border: 1px solid transparent;
}
.nav-item--daily:hover { border-color: rgba(245,158,11,0.2); background: var(--amber-dim); }
.nav-item--daily-active { color: var(--amber); background: var(--amber-dim); border-color: rgba(245,158,11,0.3); }
.nav-item-body { flex: 1; min-width: 0; }
.nav-item-title { display: block; font-weight: 600; }
.nav-item-sub { display: block; font-size: 0.6875rem; opacity: 0.5; margin-top: 1px; }
.daily-badge {
  font-size: 0.625rem;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  color: var(--amber);
  background: var(--amber-dim);
  border: 1px solid rgba(245,158,11,0.25);
  padding: 2px 6px;
  border-radius: 4px;
}
.section-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0.75rem 0.625rem 0.375rem;
}
.loading-state {
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 1rem 0.625rem;
}
.module-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.15s, background 0.15s;
  text-align: left;
}
.module-header:hover { color: var(--text-primary); background: rgba(255,255,255,0.04); }
.module-header--open { color: var(--text-primary); }
.module-header-body { flex: 1; min-width: 0; }
.module-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
.module-header-label { font-size: 0.8125rem; font-weight: 500; }
.module-progress-text { font-size: 0.6875rem; color: var(--text-muted); }
.progress-bar {
  height: 2px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
  opacity: 0.8;
}
.chevron {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}
.chevron--open { transform: rotate(180deg); }
.module-challenges {
  margin-left: 0.875rem;
  padding-left: 0.75rem;
  border-left: 1px solid var(--border);
  margin-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.challenge-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 5px;
  text-decoration: none;
  transition: background 0.15s;
}
.challenge-item:hover { background: rgba(255,255,255,0.04); }
.challenge-item--active { background: var(--cyan-dim); }
.challenge-item--active .challenge-title { color: var(--cyan); }
.challenge-status {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.check-icon { width: 12px; height: 12px; stroke: #22C55E; }
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  border: 1px solid var(--text-muted);
  display: block;
}
.challenge-info { flex: 1; min-width: 0; }
.challenge-title {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.challenge-diff {
  font-size: 0.625rem;
  color: var(--text-muted);
}
.sidebar-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--cyan-dim);
  border: 1px solid var(--border-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--cyan);
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-stats {
  display: block;
  font-size: 0.6875rem;
  color: var(--text-muted);
}
</style>