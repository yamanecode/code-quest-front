<template>
  <div class="daily-page">
    <div class="daily-inner">

      <div class="daily-header">
        <div class="daily-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          <span class="daily-icon-pulse" />
        </div>
        <h1 class="daily-title">Desafio do Dia</h1>
        <p class="daily-sub">Renovado diariamente</p>
      </div>

      <div class="generate-row">
        <button @click="generateDaily" :disabled="generating" class="btn-ghost">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          {{ generating ? 'Gerando...' : 'Gerar novo desafio (teste)' }}
        </button>
      </div>

      <div v-if="daily" class="challenge-card">
        <div class="challenge-card-meta">
          <span class="meta-tag meta-tag--daily">Desafio</span>
          <span class="meta-tag">{{ difficultyLabel(daily.difficulty) }}</span>
          <span class="meta-tag meta-tag--xp mono">+{{ xpForDifficulty(daily.difficulty) }} XP</span>
        </div>
        <h2 class="challenge-card-title">{{ daily.title }}</h2>
        <p class="challenge-card-desc">{{ daily.description }}</p>
        <NuxtLink :to="`/challenge/${daily.id}`" class="btn-accept center">
          Aceitar Desafio
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </NuxtLink>
      </div>

      <div v-else-if="loading" class="loading-screen">
        <div class="loading-dot" /><div class="loading-dot" /><div class="loading-dot" />
      </div>

      <div v-else class="empty-card">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        <p class="empty-title">Nenhum desafio disponível hoje</p>
        <p class="empty-sub">Volte amanhã ou peça ao professor para configurar um.</p>
      </div>

      <p class="daily-hint">Complete os desafios dos módulos para se preparar para este desafio.</p>

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
const generating = ref(false)

onMounted(async () => {
  auth.loadFromStorage()
  if (!auth.isLoggedIn) { router.push('/'); return }
  try {
    const d = await api.get('/users/daily-challenge')
    if (!d.message) daily.value = d
  } catch { router.push('/') }
  finally { loading.value = false }
})

function difficultyLabel(d: number) { return ['', 'Fácil', 'Médio', 'Difícil', 'Mestre'][d] || '' }
function xpForDifficulty(d: number) { return [0, 10, 20, 35, 50][d] || 10 }

async function generateDaily() {
  generating.value = true
  try {
    daily.value = await api.post('/tutor/generate-daily', {})
  } catch (e: any) { alert('Erro ao gerar: ' + e.message) }
  finally { generating.value = false }
}
</script>

<style scoped>
.daily-page { padding: 2.5rem 2rem; max-width: 580px; margin: 0 auto; }
.daily-inner { display: flex; flex-direction: column; gap: 1.25rem; }
.daily-header { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.625rem; }
.daily-icon-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--amber-dim);
  border: 1px solid rgba(245,158,11,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.daily-icon-pulse {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--amber);
  animation: ping 1.5s ease-in-out infinite;
}
@keyframes ping {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.4); }
}
.daily-title {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0;
}
.daily-sub { font-size: 0.875rem; color: var(--amber); opacity: 0.7; margin: 0; font-weight: 500; }
.generate-row { display: flex; justify-content: center; }
.btn-ghost {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.8125rem;
  padding: 0.4rem 0.875rem;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.btn-ghost:hover { color: var(--text-secondary); border-color: rgba(255,255,255,0.12); }
.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
.challenge-card {
  background: var(--bg-elevated);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.challenge-card-meta { display: flex; gap: 0.375rem; flex-wrap: wrap; }
.meta-tag {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  letter-spacing: 0.03em;
}
.meta-tag--daily { color: var(--amber); border-color: rgba(245,158,11,0.25); background: var(--amber-dim); }
.meta-tag--xp { color: var(--cyan); border-color: rgba(0,194,255,0.2); background: var(--cyan-dim); }
.challenge-card-title {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin: 0;
}
.challenge-card-desc { font-size: 0.9375rem; color: var(--text-secondary); margin: 0; line-height: 1.65; }
.btn-accept {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  background: var(--amber);
  color: #080C14;
  font-weight: 700;
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  text-decoration: none;
  transition: opacity 0.15s;
}
.btn-accept:hover { opacity: 0.88; }
.empty-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 3rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
}
.empty-title { font-size: 0.9375rem; font-weight: 600; color: var(--text-secondary); margin: 0; }
.empty-sub { font-size: 0.8125rem; color: var(--text-muted); margin: 0; }
.daily-hint { font-size: 0.8125rem; color: var(--text-muted); text-align: center; margin: 0; }
.loading-screen { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 4rem 0; }
.loading-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: pulse 1.2s ease-in-out infinite; }
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
</style>