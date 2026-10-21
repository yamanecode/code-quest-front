<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProfessorStore } from '~/stores/professor'
import type { ProfChallenge, Review } from '~/types/api'
import { CHALLENGE_TYPES, type ChallengeType } from '~/types/challenge'
import { emptyForm, formFromChallenge, toInput, type FormState } from '~/utils/challengeForm'
import { errorLines, errorMessage } from '~/utils/format'
import { SKILLS } from '~/utils/skills'

// Create or edit one challenge: save, review with AI, generate a draft, publish, duplicate, delete.
const props = defineProps<{ challengeId: number | null }>()

const professor = useProfessorStore()

const form = ref<FormState>(emptyForm('ordering'))
const challenge = ref<ProfChallenge | null>(null)
const locked = ref(false)
const loadError = ref<string | null>(null)
const errors = ref<string[]>([])
const status = ref('')
const busy = ref(false)
const review = ref<Review | null>(null)
const draftType = ref<ChallengeType>('ordering')
const draftTopic = ref('')
const askDelete = ref(false)

async function load(id: number | null) {
  loadError.value = null
  errors.value = []
  status.value = ''
  review.value = null
  if (id === null) {
    challenge.value = null
    locked.value = false
    form.value = emptyForm('ordering')
    return
  }
  try {
    const loaded = await professor.getChallenge(id)
    challenge.value = loaded
    locked.value = loaded.locked
    form.value = formFromChallenge(loaded)
  }
  catch (e) {
    loadError.value = errorMessage(e)
  }
}

watch(() => props.challengeId, load, { immediate: true })

// A new challenge may change type; the texts typed so far are kept.
function changeType(type: ChallengeType) {
  const { title, statement, explanation } = form.value
  form.value = { ...emptyForm(type), title, statement, explanation }
}

// Runs one action and shows what went wrong under the form (rule errors are listed one by one).
async function run(action: () => Promise<void>) {
  busy.value = true
  errors.value = []
  status.value = ''
  try {
    await action()
  }
  catch (e) {
    errors.value = errorLines(e)
    if ((e as { detail?: string }).detail === 'challenge_locked') locked.value = true
  }
  finally {
    busy.value = false
  }
}

function adopt(saved: ProfChallenge) {
  challenge.value = saved
  locked.value = saved.locked
  form.value = formFromChallenge(saved)
}

async function persist(): Promise<ProfChallenge> {
  const input = toInput(form.value)
  if (challenge.value) {
    const saved = await professor.updateChallenge(challenge.value.id, input)
    adopt(saved)
    return saved
  }
  const created = await professor.createChallenge(input)
  await navigateTo(`/professor/desafios/${created.id}`)
  return created
}

const save = () => run(async () => {
  await persist()
  status.value = 'Rascunho salvo.'
})

const publish = () => run(async () => {
  const saved = await persist()
  adopt(await professor.publishChallenge(saved.id))
  status.value = 'Desafio publicado.'
})

const unpublish = () => run(async () => {
  if (!challenge.value) return
  adopt(await professor.unpublishChallenge(challenge.value.id))
  status.value = 'Desafio voltou para rascunho.'
})

const duplicate = () => run(async () => {
  if (!challenge.value) return
  const copy = await professor.duplicateChallenge(challenge.value.id)
  await navigateTo(`/professor/desafios/${copy.id}`)
})

const runReview = () => run(async () => {
  if (!challenge.value) return
  review.value = await professor.reviewChallenge(challenge.value.id)
})

const generate = () => run(async () => {
  const topic = draftTopic.value.trim()
  if (!topic) {
    errors.value = ['Escreva o tema do rascunho.']
    return
  }
  const draft = await professor.generateDraft({ type: draftType.value, topic })
  await navigateTo(`/professor/desafios/${draft.id}`)
})

const remove = () => run(async () => {
  askDelete.value = false
  if (!challenge.value) return
  await professor.deleteChallenge(challenge.value.id)
  await navigateTo('/professor/desafios')
})

const primary = 'bg-go px-5 py-2.5 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-wait disabled:opacity-60 cq-go-shadow'
const secondary = 'border-2 border-line-strong px-4 py-2.5 font-semibold transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50'
</script>

<template>
  <div class="max-w-3xl">
    <p v-if="loadError" role="alert" class="border border-error-line bg-error-bg px-4 py-3 text-error-ink" data-testid="challenge-load-error">{{ loadError }}</p>

    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="font-display text-4xl font-extrabold">{{ challenge ? 'Editar desafio' : 'Novo desafio' }}</h1>
        <span
          v-if="challenge"
          class="border-2 border-line-strong px-2 py-0.5 text-sm font-semibold"
          data-testid="challenge-status"
        >{{ challenge.status === 'published' ? 'Publicado' : 'Rascunho' }}</span>
      </div>

      <form v-if="!challenge" class="cq-sheet mt-6 grid gap-4 bg-panel p-5" novalidate @submit.prevent="generate">
        <h2 class="font-display text-xl font-bold">Gerar rascunho com IA</h2>
        <div class="grid items-start gap-4 sm:grid-cols-[auto_1fr]">
          <label class="grid gap-1.5">
            <span class="font-semibold">Tipo</span>
            <select v-model="draftType" class="h-12 border-2 border-line-strong bg-panel px-3" data-testid="draft-type">
              <option v-for="type in CHALLENGE_TYPES" :key="type" :value="type">{{ SKILLS[type].label }}</option>
            </select>
          </label>
          <TextField v-model="draftTopic" label="Tema" testid="draft-topic" hint="Por exemplo: ciclo da água." :maxlength="120" autocomplete="off" />
        </div>
        <div>
          <button type="submit" :disabled="busy" :class="secondary" data-testid="draft-submit">Gerar rascunho com IA</button>
        </div>
        <p class="text-sm text-muted">O rascunho é salvo sem publicar: você revisa e decide.</p>
      </form>

      <label v-if="!challenge" class="mt-6 grid max-w-sm gap-1.5">
        <span class="font-semibold">Tipo de desafio</span>
        <select
          :value="form.type"
          class="h-11 border-2 border-line-strong bg-panel px-3"
          data-testid="field-type"
          @change="changeType(($event.target as HTMLSelectElement).value as ChallengeType)"
        >
          <option v-for="type in CHALLENGE_TYPES" :key="type" :value="type">{{ SKILLS[type].label }}</option>
        </select>
      </label>
      <p v-else class="mt-2 text-muted" data-testid="challenge-skill">{{ challenge.skill }}</p>

      <div class="mt-6">
        <ChallengeForm v-model="form" :locked="locked" />
      </div>

      <ul v-if="errors.length" role="alert" class="mt-6 list-disc border border-error-line bg-error-bg py-3 pl-8 pr-4 text-error-ink" data-testid="form-errors">
        <li v-for="message in errors" :key="message">{{ message }}</li>
      </ul>
      <p class="mt-4 min-h-6 font-semibold" role="status" data-testid="form-status">{{ status }}</p>

      <div class="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" :disabled="busy" :class="secondary" data-testid="save" @click="save">Salvar rascunho</button>
        <button type="button" :disabled="busy" :class="primary" data-testid="publish" @click="publish">Publicar</button>
        <button v-if="challenge?.status === 'published'" type="button" :disabled="busy" :class="secondary" data-testid="unpublish" @click="unpublish">Voltar para rascunho</button>
        <button type="button" :disabled="busy || !challenge" :class="secondary" data-testid="review" @click="runReview">Revisar com IA</button>
        <button type="button" :disabled="busy || !challenge" :class="secondary" data-testid="duplicate" @click="duplicate">Duplicar</button>
        <button v-if="challenge" type="button" :disabled="busy" :class="secondary" data-testid="delete" @click="askDelete = true">Excluir</button>
      </div>
      <p v-if="!challenge" class="mt-2 text-sm text-muted">Salve o rascunho para revisar com IA ou duplicar.</p>

      <section v-if="review" class="cq-sheet mt-8 grid gap-3 bg-panel p-5" aria-labelledby="h-review" data-testid="review-panel">
        <h2 id="h-review" class="font-display text-xl font-bold">Revisão da IA</h2>
        <p class="text-sm text-muted">São só sugestões: o desafio não foi alterado.</p>
        <div>
          <h3 class="font-semibold">Regras do modelo</h3>
          <p v-if="review.rule_violations.length === 0" class="text-success" data-testid="review-rules-ok">Nenhuma regra violada.</p>
          <ul v-else class="list-disc pl-5" data-testid="review-violations">
            <li v-for="violation in review.rule_violations" :key="violation">{{ violation }}</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold">Sugestões</h3>
          <p class="whitespace-pre-line" data-testid="review-suggestions">{{ review.suggestions }}</p>
        </div>
      </section>
    </template>

    <ConfirmDialog
      v-if="askDelete"
      title="Excluir desafio?"
      message="O desafio some da sua lista. Se algum aluno já respondeu, ele não pode ser excluído."
      confirm-label="Excluir"
      testid="delete-dialog"
      :busy="busy"
      @confirm="remove"
      @cancel="askDelete = false"
    />
  </div>
</template>
