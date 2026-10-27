<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChallenge } from '~/composables/useChallenge'
import { usePlayStore } from '~/stores/play'

definePageMeta({ layout: 'app', compactStats: true })

const route = useRoute()
const play = usePlayStore()

const id = computed(() => Number(route.params.id))
// The challenge DTO has no mission, so links pass it as ?missao=<id> (spec §9.1).
const missionId = computed(() => {
  const value = Number(route.query.missao)
  return Number.isInteger(value) && value > 0 ? value : null
})

const {
  challenge,
  loading,
  loadError,
  sending,
  outcome,
  submitError,
  hints,
  hintsLeft,
  hintLoading,
  hintError,
  cooldown,
  solved,
  canHint,
  canSubmit,
  load,
  setAnswer,
  submit,
  retry,
  requestHint,
} = useChallenge(id)

useHead({ title: () => `${challenge.value?.title ?? 'Desafio'} · CodeQuest` })

const backLink = computed(() =>
  missionId.value === null
    ? { to: '/inicio', label: 'Voltar ao início' }
    : { to: `/missoes/${missionId.value}`, label: 'Voltar à missão' },
)

const hintLabel = computed(() => {
  if (hintLoading.value) return 'Pedindo dica…'
  if (cooldown.value > 0) return `Dica em ${cooldown.value} s`
  return `Dica (${hintsLeft.value} ${hintsLeft.value === 1 ? 'restante' : 'restantes'})`
})

// Why Enviar is disabled, in the words of the challenge type (shown under the buttons).
const SUBMIT_HELP: Record<string, string> = {
  ordering: 'Mexa nos passos para montar a sequência.',
  grouping: 'Escolha uma etapa para cada tarefa para enviar.',
  filtering: 'Marque pelo menos uma informação para enviar.',
  pattern: 'Escolha uma opção para enviar.',
}
const submitHelp = computed(() => {
  if (!challenge.value || outcome.value || sending.value || canSubmit.value) return ''
  return SUBMIT_HELP[challenge.value.type] ?? ''
})

const goingNext = ref(false)

async function goNext() {
  goingNext.value = true
  try {
    await navigateTo(await play.nextChallengePath(missionId.value, id.value))
  }
  finally {
    goingNext.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <NuxtLink
      :to="backLink.to"
      class="inline-flex min-h-11 items-center text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
      data-testid="challenge-back"
    >← {{ backLink.label }}</NuxtLink>

    <p v-if="loading" class="mt-6 text-muted" aria-live="polite">Carregando desafio…</p>

    <div v-else-if="loadError" class="cq-alert mt-6 px-4 py-3" role="alert" data-testid="challenge-error">
      <p>{{ loadError }}</p>
      <button
        type="button"
        class="mt-3 font-semibold underline underline-offset-4 hover:decoration-2"
        data-testid="challenge-retry-load"
        @click="load"
      >Tentar de novo</button>
    </div>

    <article v-else-if="challenge" class="mt-6" data-testid="challenge">
      <SkillTag :type="challenge.type" />
      <h1 class="mt-3 font-display text-4xl font-extrabold leading-tight" data-testid="challenge-title">{{ challenge.title }}</h1>
      <p class="mt-3 whitespace-pre-line text-lg leading-relaxed" data-testid="challenge-statement">{{ challenge.statement }}</p>
      <p v-if="challenge.solved && !outcome" class="mt-3 text-sm text-muted" data-testid="challenge-already-solved">
        ✓ Você já resolveu este desafio. Pode responder de novo para treinar, mas não ganha XP outra vez.
      </p>

      <section class="cq-sheet mt-6 bg-panel p-4 sm:p-6" aria-label="Sua resposta">
        <OrderingChallenge
          v-if="challenge.type === 'ordering'"
          :key="`o-${challenge.id}`"
          :content="challenge.content"
          :disabled="outcome !== null"
          @change="setAnswer"
        />
        <GroupingChallenge
          v-else-if="challenge.type === 'grouping'"
          :key="`g-${challenge.id}`"
          :content="challenge.content"
          :disabled="outcome !== null"
          @change="setAnswer"
        />
        <FilteringChallenge
          v-else-if="challenge.type === 'filtering'"
          :key="`f-${challenge.id}`"
          :content="challenge.content"
          :disabled="outcome !== null"
          @change="setAnswer"
        />
        <PatternChallenge
          v-else
          :key="`p-${challenge.id}`"
          :content="challenge.content"
          :disabled="outcome !== null"
          @change="setAnswer"
        />

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <button
            v-if="!outcome"
            type="button"
            :disabled="!canSubmit"
            class="bg-go px-6 py-3 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-not-allowed disabled:opacity-50 cq-go-shadow"
            :aria-describedby="submitHelp ? 'submit-help' : undefined"
            data-testid="challenge-submit"
            @click="submit"
          >{{ sending ? 'Enviando…' : 'Enviar' }}</button>

          <span class="inline-flex items-center gap-2">
            <button
              type="button"
              :disabled="!canHint"
              class="cq-btn-outline px-4 py-3"
              data-testid="challenge-hint"
              @click="requestHint"
            >{{ hintLabel }}</button>
            <HelpTip
              topic="hints"
              label="Dicas"
              text="Você pode pedir até 5 dicas por desafio, com uma pequena espera entre elas. Elas guiam o raciocínio sem dar a resposta e não dão nem tiram XP."
            />
          </span>
        </div>
        <p v-if="submitHelp" id="submit-help" class="mt-3 text-sm text-muted" data-testid="submit-help">{{ submitHelp }}</p>
        <p v-if="submitError" role="alert" class="mt-3 text-error-ink" data-testid="challenge-submit-error">{{ submitError }}</p>
      </section>

      <section
        v-if="hints.length > 0 || hintError"
        class="mt-4 border-2 border-line-strong px-5 py-4"
        aria-label="Dicas"
        data-testid="hints"
      >
        <ol class="grid gap-3" aria-live="polite">
          <li v-for="(hint, index) in hints" :key="index" :data-testid="`hint-${index + 1}`">
            <p class="text-sm font-semibold text-muted">Dica {{ index + 1 }}</p>
            <p class="mt-1 leading-relaxed">{{ hint }}</p>
          </li>
        </ol>
        <p v-if="hintError" role="status" class="mt-2 text-sm text-muted" data-testid="hint-error">{{ hintError }}</p>
      </section>

      <div class="mt-4" aria-live="polite" data-testid="feedback-region">
        <AnswerFeedback v-if="outcome" :outcome="outcome" @retry="retry" />
      </div>

      <button
        v-if="solved && (outcome?.is_correct ?? true)"
        type="button"
        :disabled="goingNext"
        class="mt-6 bg-go px-6 py-3 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-wait disabled:opacity-60 cq-go-shadow"
        data-testid="challenge-next"
        @click="goNext"
      >Próximo desafio</button>
    </article>
  </div>
</template>
