<template>
  <div class="challenge-page">
    <main v-if="challenge" class="challenge-inner">

      <div class="challenge-header">
        <div class="challenge-meta">
          <span class="meta-tag">{{ difficultyLabel(challenge.difficulty) }}</span>
          <span class="meta-tag meta-tag--xp mono">+{{ xpForDifficulty(challenge.difficulty) }} XP</span>
          <span class="meta-tag meta-tag--category">{{ categoryLabel(challenge.category) }}</span>
        </div>
        <h1 class="challenge-title">{{ challenge.title }}</h1>
        <p class="challenge-desc">{{ challenge.description }}</p>
      </div>

      <!-- STEPS -->
      <div v-if="challenge.type === 'steps'" class="input-group">
        <div v-for="(step, i) in challenge.content.steps" :key="i" class="step-field">
          <label class="field-label">
            <span class="field-number mono">{{ Number(i) + 1 }}</span>
            {{ step.label }}
          </label>
          <textarea
            v-model="stepsAnswer[Number(i)]"
            :disabled="submitted"
            rows="2"
            placeholder="Sua resposta..."
            class="field-textarea"
          />
        </div>
      </div>

      <!-- PATTERN -->
      <div v-if="challenge.type === 'pattern'" class="input-group">
        <div class="sequence-display">
          <span class="sequence-text mono">{{ challenge.content.sequence }}</span>
        </div>
        <label class="field-label">Sua resposta</label>
        <input
          v-model="patternAnswer"
          :disabled="submitted"
          type="text"
          placeholder="Digite o próximo valor ou o padrão..."
          class="field-input"
        />
      </div>

      <!-- ORDERING -->
      <div v-if="['ordering', 'algorithm', 'abstraction'].includes(challenge.type)" class="input-group">
        <p class="field-label">Arraste os itens para a ordem correta:</p>
        <div class="order-list">
          <div
            v-for="(itemIndex, pos) in orderAnswer"
            :key="itemIndex"
            draggable="true"
            @dragstart="dragStart(pos)"
            @dragover.prevent
            @dragenter="dragOver = pos"
            @dragleave="dragOver = null"
            @drop="dragDrop(pos)"
            class="order-item"
            :class="{ 'order-item--over': dragOver === pos, 'order-item--disabled': submitted }"
          >
            <span class="order-pos mono">{{ pos + 1 }}</span>
            <span class="order-text">{{ challenge.content.items[itemIndex] }}</span>
            <svg class="drag-handle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="6" r="1" fill="currentColor"/>
              <circle cx="15" cy="6" r="1" fill="currentColor"/>
              <circle cx="9" cy="12" r="1" fill="currentColor"/>
              <circle cx="15" cy="12" r="1" fill="currentColor"/>
              <circle cx="9" cy="18" r="1" fill="currentColor"/>
              <circle cx="15" cy="18" r="1" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="!submitted" class="actions">
        <button @click="submit" :disabled="submitting" class="btn-submit btn-primary">
          <span v-if="submitting" class="btn-spinner" aria-hidden="true" />
          {{ submitting ? 'Enviando...' : 'Enviar resposta' }}
        </button>

        <!-- Dica button: amber glow, icon wobble, pulse animation -->
        <button
          @click="getHint"
          :disabled="hintLoading"
          class="btn-dica"
          :class="{ 'btn-dica--loading': hintLoading, 'btn-dica--revealed': !!hint }"
          aria-label="Pedir dica ao tutor"
        >
          <!-- lightbulb icon — wobbles on hover via CSS -->
          <svg
            class="dica-icon"
            width="15" height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.9V17H8v-2.1A7 7 0 0 1 12 2z"/>
          </svg>
          <span class="dica-label">{{ hintLoading ? 'Pensando…' : hint ? 'Nova dica' : 'Dica' }}</span>
        </button>
      </div>

      <!-- Hint card — amber bordered, animated entrance -->
      <Transition name="hint-slide">
        <div v-if="hint" class="hint-card" role="note" aria-live="polite">
          <div class="hint-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Tutor</span>
          </div>
          <p class="hint-text">{{ hint }}</p>
        </div>
      </Transition>

      <!-- Result -->
      <div v-if="result" class="result-card" :class="result.is_correct ? 'result-card--correct' : 'result-card--wrong'">
        <div class="result-header">
          <div class="result-icon-wrap" :class="result.is_correct ? 'result-icon-wrap--correct' : 'result-icon-wrap--wrong'">
            <svg v-if="result.is_correct" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <div>
            <p class="result-title">{{ result.is_correct ? 'Correto!' : 'Não foi dessa vez' }}</p>
            <p v-if="result.xp_earned > 0" class="result-xp mono">+{{ result.xp_earned }} XP</p>
          </div>
        </div>
        <p class="result-feedback">{{ result.ai_feedback }}</p>
        <div class="result-actions">
          <NuxtLink to="/home" class="result-link">← Início</NuxtLink>
          <button v-if="!result.is_correct" @click="retry" class="result-link result-link--retry">Tentar novamente</button>
        </div>
      </div>

    </main>

    <div v-else class="loading-screen">
      <div class="loading-dot" /><div class="loading-dot" /><div class="loading-dot" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'app' })

const route = useRoute()
const api = useApi()
const auth = useAuthStore()
const router = useRouter()

const challenge = ref<any>(null)
const stepsAnswer = ref<string[]>([])
const patternAnswer = ref('')
const orderAnswer = ref<number[]>([])
const dragFrom = ref<number | null>(null)
const dragOver = ref<number | null>(null)
const result = ref<any>(null)
const hint = ref('')
const submitting = ref(false)
const hintLoading = ref(false)
const submitted = ref(false)

onMounted(async () => {
  auth.loadFromStorage()
  if (!auth.isLoggedIn) { router.push('/'); return }
  challenge.value = await api.get(`/challenges/${route.params.id}`)
  initAnswers()
})

function initAnswers() {
  const c = challenge.value
  if (!c) return
  if (c.type === 'steps') stepsAnswer.value = c.content.steps.map(() => '')
  else if (['ordering', 'algorithm', 'abstraction'].includes(c.type))
    orderAnswer.value = c.content.items.map((_: any, i: number) => i).sort(() => Math.random() - 0.5)
}

function dragStart(pos: number) { dragFrom.value = pos }
function dragDrop(pos: number) {
  if (dragFrom.value === null || submitted.value) return
  const arr = [...orderAnswer.value]
  const [moved] = arr.splice(dragFrom.value, 1)
  if (moved === undefined) return
  arr.splice(pos, 0, moved)
  orderAnswer.value = arr
  dragFrom.value = null
  dragOver.value = null
}

function buildAnswer() {
  if (challenge.value.type === 'steps') return { steps: stepsAnswer.value }
  if (['ordering', 'algorithm', 'abstraction'].includes(challenge.value.type)) return { order: orderAnswer.value }
  return { answer: patternAnswer.value }
}

async function submit() {
  submitting.value = true
  try {
    result.value = await api.post('/submissions/', { challenge_id: challenge.value.id, answer: buildAnswer() })
    submitted.value = true
  } catch (e: any) { alert(e.message) }
  finally { submitting.value = false }
}

async function getHint() {
  hintLoading.value = true
  try {
    const r = await api.post('/tutor/hint', { challenge_id: challenge.value.id, current_answer: buildAnswer() })
    hint.value = r.hint
  } catch { hint.value = 'Não foi possível obter dica agora.' }
  finally { hintLoading.value = false }
}

function retry() { result.value = null; submitted.value = false; hint.value = ''; initAnswers() }
function difficultyLabel(d: number) { return ['', 'Fácil', 'Médio', 'Difícil', 'Mestre'][d] || '' }
function xpForDifficulty(d: number) { return [0, 10, 20, 35, 50][d] || 10 }
function categoryLabel(c: string) {
  const map: Record<string, string> = {
    decomposition: 'Decomposição',
    pattern: 'Padrões',
    abstraction: 'Abstração',
    algorithm: 'Algoritmos'
  }
  return map[c] || c
}
</script>

<style scoped>
.challenge-page { padding: 2.5rem 2rem; max-width: 640px; margin: 0 auto; }
.challenge-header { margin-bottom: 2rem; }
.challenge-meta { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-bottom: 0.875rem; }
.meta-tag {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  letter-spacing: 0.03em;
}
.meta-tag--xp   { color: var(--cyan);  border-color: rgba(41,182,246,0.25); background: var(--cyan-dim); }
.meta-tag--category { color: #A78BFA; border-color: rgba(167,139,250,0.2); background: rgba(167,139,250,0.08); }
.challenge-title {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0 0 0.625rem;
}
.challenge-desc { font-size: 0.9375rem; color: var(--text-secondary); margin: 0; line-height: 1.65; }

/* ── INPUT GROUP ── */
.input-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}
.field-number {
  width: 20px; height: 20px;
  border-radius: 4px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6875rem;
  color: var(--text-muted);
  flex-shrink: 0;
}
.field-textarea, .field-input {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: var(--font-sans);
  transition: border-color 0.15s;
  resize: none; outline: none;
}
.field-textarea:focus, .field-input:focus { border-color: var(--border-accent); }
.field-textarea::placeholder, .field-input::placeholder { color: var(--text-muted); }
.field-textarea:disabled, .field-input:disabled { opacity: 0.5; cursor: not-allowed; }

.sequence-display {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
}
.sequence-text {
  font-size: 1.5rem; font-weight: 600; letter-spacing: 0.12em; color: var(--cyan);
}

/* ── ORDER LIST ── */
.order-list { display: flex; flex-direction: column; gap: 6px; }
.order-item {
  display: flex; align-items: center; gap: 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: grab;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.order-item:active { cursor: grabbing; }
.order-item--over { border-color: var(--cyan); background: var(--cyan-dim); }
.order-item--disabled { cursor: default; opacity: 0.6; }
.order-pos { font-size: 0.6875rem; color: var(--text-muted); width: 16px; text-align: center; flex-shrink: 0; }
.order-text { flex: 1; font-size: 0.9375rem; color: var(--text-secondary); }
.drag-handle { width: 14px; height: 14px; color: var(--text-muted); flex-shrink: 0; }

/* ── ACTIONS ROW ── */
.actions { display: flex; gap: 0.625rem; margin-bottom: 1.25rem; }

/* Submit */
.btn-submit {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: var(--cyan);
  color: #080C14;
  font-weight: 700;
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  letter-spacing: 0.04em;
  padding: 0.75rem 1.5rem;
  border-radius: 8px; border: none;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.btn-submit:hover { opacity: 0.88; }
.btn-submit:active { transform: scale(0.98); }
.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

/* Spinner inside submit */
.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(8,12,20,0.25);
  border-top-color: #080C14;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── DICA BUTTON ──
   Amber-forward with pulsing glow. Lightbulb icon wobbles on hover.
   "Nova dica" label appears after first hint is fetched.
── */
.btn-dica {
  display: flex; align-items: center; gap: 0.4rem;
  background: rgba(255, 170, 0, 0.10);
  border: 1.5px solid var(--amber);
  color: var(--amber);
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  padding: 0.75rem 1.125rem;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  /* Continuous ambient pulse */
  animation: dica-pulse 2.8s ease-in-out infinite;
  box-shadow:
    0 0 12px 0 rgba(255, 170, 0, 0.22),
    inset 0 1px 0 rgba(255,255,255,0.05);
  transition: background 0.2s, box-shadow 0.2s, border-color 0.2s, transform 0.1s;
  touch-action: manipulation; /* remove 300ms tap delay on mobile */
}
.btn-dica:hover {
  background: rgba(255, 170, 0, 0.18);
  box-shadow:
    0 0 28px 6px rgba(255, 170, 0, 0.40),
    inset 0 1px 0 rgba(255,255,255,0.08);
  border-color: rgba(255, 200, 60, 0.95);
  animation: none; /* freeze pulse — hover owns the glow */
}
.btn-dica:hover .dica-icon {
  animation: bulb-wobble 0.45s ease-in-out;
}
.btn-dica:active { transform: scale(0.96); }
.btn-dica:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  animation: none;
}
/* after a hint exists, add a subtle "already used" ring */
.btn-dica--revealed {
  border-color: rgba(255, 170, 0, 0.55);
}

/* Loading state: replace glow pulse with a shimmer */
.btn-dica--loading {
  animation: none;
  opacity: 0.72;
  cursor: wait;
}

@keyframes dica-pulse {
  0%, 100% {
    box-shadow:
      0 0 10px 0 rgba(255, 170, 0, 0.18),
      inset 0 1px 0 rgba(255,255,255,0.05);
  }
  50% {
    box-shadow:
      0 0 22px 4px rgba(255, 170, 0, 0.36),
      inset 0 1px 0 rgba(255,255,255,0.05);
  }
}

/* Lightbulb wobble keyframe */
@keyframes bulb-wobble {
  0%   { transform: rotate(0deg) scale(1); }
  20%  { transform: rotate(-14deg) scale(1.12); }
  40%  { transform: rotate(10deg) scale(1.08); }
  60%  { transform: rotate(-6deg) scale(1.05); }
  80%  { transform: rotate(3deg) scale(1.02); }
  100% { transform: rotate(0deg) scale(1); }
}

.dica-icon { flex-shrink: 0; }
.dica-label { line-height: 1; }

/* ── HINT CARD with slide-down entrance ── */
.hint-card {
  background: rgba(255, 170, 0, 0.07);
  border: 1px solid rgba(255, 170, 0, 0.26);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  /* left accent stripe */
  border-left: 3px solid var(--amber);
}
.hint-header {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.6875rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--amber);
  margin-bottom: 0.5rem;
}
.hint-text { font-size: 0.9375rem; color: var(--text-secondary); margin: 0; line-height: 1.65; }

/* Vue Transition */
.hint-slide-enter-active { transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
.hint-slide-leave-active { transition: all 0.18s ease-in; }
.hint-slide-enter-from  { opacity: 0; transform: translateY(-8px); }
.hint-slide-leave-to    { opacity: 0; transform: translateY(-4px); }

/* ── RESULT CARD ── */
.result-card { border-radius: 12px; padding: 1.25rem; border: 1px solid; }
.result-card--correct { background: rgba(34,197,94,0.06);  border-color: rgba(34,197,94,0.2); }
.result-card--wrong   { background: rgba(248,113,113,0.06); border-color: rgba(248,113,113,0.18); }
.result-header { display: flex; align-items: center; gap: 0.875rem; margin-bottom: 0.875rem; }
.result-icon-wrap {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.result-icon-wrap--correct { background: rgba(34,197,94,0.15);  color: #22C55E; }
.result-icon-wrap--wrong   { background: rgba(248,113,113,0.15); color: #f87171; }
.result-title    { font-weight: 700; font-size: 1rem; color: var(--text-primary); margin: 0 0 2px; }
.result-xp       { font-size: 0.75rem; color: var(--cyan); margin: 0; }
.result-feedback { font-size: 0.9375rem; color: var(--text-secondary); margin: 0 0 1rem; line-height: 1.65; }
.result-actions  { display: flex; gap: 1rem; }
.result-link {
  font-size: 0.875rem; color: var(--text-muted);
  text-decoration: none; background: none; border: none; cursor: pointer; padding: 0;
  transition: color 0.15s;
}
.result-link:hover         { color: var(--text-primary); }
.result-link--retry        { color: var(--cyan); }
.result-link--retry:hover  { color: #33CCFF; }

/* ── LOADING SCREEN ── */
.loading-screen { display: flex; align-items: center; justify-content: center; gap: 6px; height: 60vh; }
.loading-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: pulse 1.2s ease-in-out infinite; }
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1); }
}
</style>