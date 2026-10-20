<template>
  <div class="ranking-page">
    <div class="ranking-header">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
      <h1 class="ranking-title">Ranking</h1>
    </div>

    <div class="ranking-list">
      <div
        v-for="(entry, i) in ranking"
        :key="entry.id"
        class="ranking-row"
        :class="{ 'ranking-row--me': entry.id === auth.user?.id, 'ranking-row--top': i < 3 }"
      >
        <div class="rank-pos">
          <span v-if="i === 0" class="rank-medal rank-medal--gold mono">1</span>
          <span v-else-if="i === 1" class="rank-medal rank-medal--silver mono">2</span>
          <span v-else-if="i === 2" class="rank-medal rank-medal--bronze mono">3</span>
          <span v-else class="rank-num mono">{{ i + 1 }}</span>
        </div>
        <div class="rank-avatar">{{ entry.name?.charAt(0)?.toUpperCase() }}</div>
        <div class="rank-info">
          <span class="rank-name">{{ entry.name }}</span>
          <span class="rank-level mono">Nv. {{ entry.level }}</span>
        </div>
        <div class="rank-xp">
          <span class="rank-xp-value mono">{{ entry.xp }}</span>
          <span class="rank-xp-label">XP</span>
        </div>
      </div>
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
const ranking = ref<any[]>([])

onMounted(async () => {
  auth.loadFromStorage()
  if (!auth.isLoggedIn) { router.push('/'); return }
  ranking.value = await api.get('/users/ranking')
})
</script>

<style scoped>
.ranking-page { padding: 2.5rem 2rem; max-width: 540px; margin: 0 auto; }
.ranking-header { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1.75rem; }
.ranking-title { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text-primary); margin: 0; }
.ranking-list { display: flex; flex-direction: column; gap: 6px; }
.ranking-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: border-color 0.15s;
}
.ranking-row--me { background: var(--cyan-dim); border-color: var(--border-accent); }
.ranking-row--top.ranking-row:first-child { border-color: rgba(245,158,11,0.25); }
.rank-pos { width: 28px; display: flex; justify-content: center; flex-shrink: 0; }
.rank-num { font-size: 0.8125rem; color: var(--text-muted); }
.rank-medal {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
}
.rank-medal--gold { background: rgba(245,158,11,0.15); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }
.rank-medal--silver { background: rgba(148,163,184,0.12); color: #94a3b8; border: 1px solid rgba(148,163,184,0.25); }
.rank-medal--bronze { background: rgba(180,120,80,0.12); color: #b4805a; border: 1px solid rgba(180,120,80,0.25); }
.rank-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.rank-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.rank-name { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-level { font-size: 0.6875rem; color: var(--text-muted); }
.rank-xp { text-align: right; display: flex; flex-direction: column; gap: 1px; }
.rank-xp-value { font-size: 1rem; font-weight: 700; color: var(--cyan); }
.rank-xp-label { font-size: 0.6875rem; color: var(--text-muted); }
</style>