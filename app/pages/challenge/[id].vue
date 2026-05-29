<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <header class="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
      <NuxtLink to="/dashboard" class="text-gray-400 hover:text-white transition-colors text-sm">← Voltar</NuxtLink>
      <span class="text-gray-600">|</span>
      <span class="text-sm text-gray-400">{{ challenge?.category }}</span>
    </header>

    <main class="max-w-2xl mx-auto px-6 py-8" v-if="challenge">
      <!-- Challenge header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{{ difficultyLabel(challenge.difficulty) }}</span>
          <span class="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">+{{ xpForDifficulty(challenge.difficulty) }} XP</span>
        </div>
        <h1 class="text-2xl font-bold mb-2">{{ challenge.title }}</h1>
        <p class="text-gray-400">{{ challenge.description }}</p>
      </div>

      <!-- STEPS challenge -->
      <div v-if="challenge.type === 'steps'" class="space-y-4 mb-8">
        <div v-for="(step, i) in challenge.content.steps" :key="i">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {{ Number(i) + 1 }}. {{ step.label }}
          </label>
          <textarea
            v-model="stepsAnswer[Number(i)]"
            :disabled="submitted"
            rows="2"
            placeholder="Sua resposta..."
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm resize-none disabled:opacity-60"
          />
        </div>
      </div>

      <!-- PATTERN challenge -->
      <div v-if="challenge.type === 'pattern'" class="mb-8">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 text-center">
          <p class="text-2xl font-mono font-bold text-indigo-300 tracking-widest">{{ challenge.content.sequence }}</p>
        </div>
        <label class="block text-sm font-medium text-gray-300 mb-2">Sua resposta</label>
        <input
          v-model="patternAnswer"
          :disabled="submitted"
          type="text"
          placeholder="Digite o próximo valor ou o padrão..."
          class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm disabled:opacity-60"
        />
      </div>

      <!-- Actions -->
      <div v-if="!submitted" class="flex gap-3 mb-8">
        <button
          @click="submit"
          :disabled="submitting"
          class="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors text-sm"
        >
          {{ submitting ? 'Enviando...' : 'Enviar resposta' }}
        </button>
        <button
          @click="getHint"
          :disabled="hintLoading"
          class="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-medium py-3 px-5 rounded-lg transition-colors text-sm"
        >
          {{ hintLoading ? '...' : '💡 Dica' }}
        </button>
      </div>

      <!-- Hint -->
      <div v-if="hint" class="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-5 mb-6">
        <p class="text-xs text-yellow-500 font-medium mb-2">💡 Tutor</p>
        <p class="text-gray-300 text-sm leading-relaxed">{{ hint }}</p>
      </div>

      <!-- Result -->
      <div v-if="result" :class="[
        'rounded-xl p-6 border',
        result.is_correct
          ? 'bg-green-900/20 border-green-700/40'
          : 'bg-red-900/20 border-red-700/40'
      ]">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">{{ result.is_correct ? '✅' : '❌' }}</span>
          <div>
            <p class="font-semibold">{{ result.is_correct ? 'Correto!' : 'Não foi dessa vez' }}</p>
            <p v-if="result.xp_earned > 0" class="text-xs text-indigo-400">+{{ result.xp_earned }} XP ganhos</p>
          </div>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed">{{ result.ai_feedback }}</p>
        <div class="mt-4 flex gap-3">
          <NuxtLink to="/dashboard" class="text-sm text-gray-400 hover:text-white transition-colors">← Voltar</NuxtLink>
          <button v-if="!result.is_correct" @click="retry" class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">Tentar novamente</button>
        </div>
      </div>
    </main>

    <div v-else class="flex items-center justify-center h-64">
      <p class="text-gray-500">Carregando...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const api = useApi()
const auth = useAuthStore()
const router = useRouter()

const challenge = ref<any>(null)
const stepsAnswer = ref<string[]>([])
const patternAnswer = ref('')
const result = ref<any>(null)
const hint = ref('')
const submitting = ref(false)
const hintLoading = ref(false)
const submitted = ref(false)

onMounted(async () => {
  auth.loadFromStorage()
  if (!auth.isLoggedIn) { router.push('/'); return }
  challenge.value = await api.get(`/challenges/${route.params.id}`)
  if (challenge.value?.type === 'steps') {
    stepsAnswer.value = challenge.value.content.steps.map(() => '')
  }
})

function buildAnswer() {
  if (challenge.value.type === 'steps') return { steps: stepsAnswer.value }
  return { answer: patternAnswer.value }
}

async function submit() {
  submitting.value = true
  try {
    result.value = await api.post('/submissions/', {
      challenge_id: challenge.value.id,
      answer: buildAnswer(),
    })
    submitted.value = true
  } catch (e: any) {
    alert(e.message)
  } finally {
    submitting.value = false
  }
}

async function getHint() {
  hintLoading.value = true
  try {
    const r = await api.post('/tutor/hint', {
      challenge_id: challenge.value.id,
      current_answer: buildAnswer(),
    })
    hint.value = r.hint
  } catch (e: any) {
    hint.value = 'Não foi possível obter dica agora.'
  } finally {
    hintLoading.value = false
  }
}

function retry() {
  result.value = null
  submitted.value = false
  hint.value = ''
  if (challenge.value?.type === 'steps') stepsAnswer.value = challenge.value.content.steps.map(() => '')
  else patternAnswer.value = ''
}

function difficultyLabel(d: number) { return ['', 'Fácil', 'Médio', 'Difícil'][d] || '' }
function xpForDifficulty(d: number) { return [0, 10, 20, 35][d] || 10 }
</script>