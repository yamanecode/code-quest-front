<template>
  <div class="home">
    <div v-if="user" class="home-inner">

      <div class="home-header">
        <h1 class="greeting">Olá, {{ user.name }}</h1>
        <p class="greeting-sub">Continue sua jornada no pensamento computacional</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">XP Total</span>
          <span class="stat-value mono" style="color: var(--cyan)">{{ user.xp }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Nível</span>
          <span class="stat-value mono" style="color: #F59E0B">{{ user.level }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Sequência</span>
          <div class="streak-value">
            <span class="stat-value mono" style="color: #F97316">{{ user.streak }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F97316" stroke="none"><path d="M12 2c0 0-5 5.5-5 10a5 5 0 0 0 10 0C17 7.5 12 2 12 2zm0 13a2 2 0 0 1-2-2c0-2 2-4.5 2-4.5s2 2.5 2 4.5a2 2 0 0 1-2 2z"/></svg>
          </div>
        </div>
      </div>

      <div class="xp-card">
        <div class="xp-card-header">
          <span class="xp-label">Nível {{ user.level }}</span>
          <span class="xp-progress mono">{{ user.xp % 100 }}<span class="xp-total">/100 XP</span></span>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" :style="{ width: `${user.xp % 100}%` }" />
        </div>
      </div>

      <div v-if="user.badges?.length" class="badges-section">
        <h2 class="section-title">Conquistas</h2>
        <div class="badges-list">
          <div v-for="badge in user.badges" :key="badge.id" :title="badge.description" class="badge-chip">
            <span class="badge-icon">{{ badge.icon }}</span>
            <span class="badge-name">{{ badge.name }}</span>
          </div>
        </div>
      </div>

      <div class="tip-card">
        <div class="tip-header">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span class="tip-label">Dica</span>
        </div>
        <p class="tip-text">Use o menu lateral para navegar pelos módulos. Complete os desafios de um módulo antes de tentar o <span class="tip-highlight">Desafio do Dia</span>.</p>
      </div>

    </div>

    <div v-else class="loading-screen">
      <div class="loading-dot" /><div class="loading-dot" /><div class="loading-dot" />
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
  } catch { router.push('/') }
})
</script>

<style scoped>
.home {
  padding: 2.5rem 2rem;
  max-width: 640px;
  margin: 0 auto;
}
.home-header { margin-bottom: 1.75rem; }
.greeting {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
}
.greeting-sub {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.stat-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.stat-label {
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1;
}
.streak-value { display: flex; align-items: center; gap: 0.375rem; }
.xp-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}
.xp-card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.625rem;
}
.xp-label { font-size: 0.8125rem; color: var(--text-secondary); font-weight: 500; }
.xp-progress { font-size: 0.8125rem; color: var(--text-primary); }
.xp-total { color: var(--text-muted); font-size: 0.75rem; }
.xp-bar-track {
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
  overflow: hidden;
}
.xp-bar-fill {
  height: 100%;
  background: var(--cyan);
  border-radius: 4px;
  transition: width 0.7s ease;
  box-shadow: 0 0 8px rgba(0,194,255,0.4);
}
.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}
.badges-section { margin-bottom: 1.5rem; }
.badges-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.badge-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}
.tip-card {
  background: rgba(0,194,255,0.04);
  border: 1px solid rgba(0,194,255,0.12);
  border-radius: 10px;
  padding: 1rem 1.25rem;
}
.tip-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}
.tip-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cyan);
}
.tip-text { font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.6; }
.tip-highlight { color: var(--amber); font-weight: 500; }
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 60vh;
}
.loading-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: pulse 1.2s ease-in-out infinite;
}
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
</style>