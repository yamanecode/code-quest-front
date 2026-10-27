<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AnswerOutcome } from '~/composables/useChallenge'
import type { Answer, ChallengeType } from '~/types/challenge'
import { CORRECT_MESSAGES, WRONG_MESSAGES, pickMessage } from '~/utils/feedback'
import { DEMO_CHALLENGES, demoXp, isDemoCorrect } from '~/utils/landingDemo'
import { levelTitle } from '~/utils/levels'
import { SKILLS } from '~/utils/skills'

// One playable challenge for each skill, answered with the same components as the real screen.
// Grading, XP and the automatic hint after the first wrong answer follow the platform rules,
// but everything is local: nothing is sent anywhere and nothing is saved.
const index = ref(0)
const challenge = computed(() => DEMO_CHALLENGES[index.value]!)

const attempt = ref(0) // changes on "Recomeçar" and on a tab change, so the answer component starts again
const answer = ref<Answer | null>(null)
const outcome = ref<AnswerOutcome | null>(null)
const wrongs = ref(0)
const solved = ref<Partial<Record<ChallengeType, boolean>>>({})
const xp = ref(0)

const SKILL_VAR: Record<ChallengeType, string> = {
  ordering: 'var(--cq-ordering)',
  grouping: 'var(--cq-grouping)',
  filtering: 'var(--cq-filtering)',
  pattern: 'var(--cq-pattern)',
}
const MARK: Record<ChallengeType, string> = {
  ordering: 'cq-mark-ordering',
  grouping: 'cq-mark-grouping',
  filtering: 'cq-mark-filtering',
  pattern: 'cq-mark-pattern',
}
// Why Enviar is disabled, in the words of each type (same as the real screen).
const SUBMIT_HELP: Record<ChallengeType, string> = {
  ordering: 'Mexa nos passos para montar a sequência.',
  grouping: 'Escolha uma etapa para cada tarefa para enviar.',
  filtering: 'Marque pelo menos uma informação para enviar.',
  pattern: 'Escolha uma opção para enviar.',
}

const canSubmit = computed(() => answer.value !== null && outcome.value === null)
const submitHelp = computed(() => (canSubmit.value || outcome.value ? '' : SUBMIT_HELP[challenge.value.type]))
const locked = computed(() => outcome.value?.is_correct === true)

function start() {
  answer.value = null
  outcome.value = null
  wrongs.value = 0
  attempt.value += 1
}

function open(position: number) {
  index.value = position
  start()
}

function onChange(value: Answer | null) {
  answer.value = value
}

function result(correct: boolean, earned: number, hint: string | null): AnswerOutcome {
  const level = Math.floor(xp.value / 50) + 1
  return {
    is_correct: correct,
    xp_earned: earned,
    xp: xp.value,
    level,
    title: levelTitle(level),
    level_up: false,
    new_badges: [],
    explanation: correct ? challenge.value.explanation : null,
    hint,
    message: pickMessage(correct ? CORRECT_MESSAGES : WRONG_MESSAGES),
  }
}

function submit() {
  if (!answer.value || !canSubmit.value) return
  if (isDemoCorrect(challenge.value, answer.value)) {
    const first = !solved.value[challenge.value.type]
    const earned = first ? demoXp(wrongs.value) : 0
    xp.value += earned
    solved.value = { ...solved.value, [challenge.value.type]: true }
    outcome.value = result(true, earned, null)
    return
  }
  wrongs.value += 1
  outcome.value = result(false, 0, wrongs.value === 1 ? challenge.value.hint : null)
}

function retry() {
  outcome.value = null
}
</script>

<template>
  <div class="cq-sheet grid gap-4 p-4 pt-6 sm:p-5 sm:pt-7" data-testid="demo-challenge">
    <div class="flex flex-wrap gap-1.5" role="group" aria-label="Escolha a habilidade do desafio">
      <button
        v-for="(item, position) in DEMO_CHALLENGES"
        :key="item.type"
        type="button"
        class="min-h-11 border-2 px-3 py-1 text-sm font-bold leading-tight text-ink transition-colors"
        :class="position === index ? 'border-line-strong bg-raised' : 'border-control bg-panel hover:bg-raised'"
        :style="{ boxShadow: `inset 0 -5px 0 ${SKILL_VAR[item.type]}` }"
        :aria-pressed="position === index"
        :aria-label="SKILLS[item.type].label + (solved[item.type] ? ', resolvido' : '')"
        :data-testid="`demo-tab-${item.type}`"
        @click="open(position)"
      >{{ SKILLS[item.type].short }}<span v-if="solved[item.type]" aria-hidden="true"> ✓</span></button>
    </div>

    <div :data-testid="`demo-${challenge.type}`">
      <p class="font-display text-sm font-bold">
        <span class="cq-mark px-0.5 text-on-color" :class="MARK[challenge.type]">{{ SKILLS[challenge.type].label }}</span>
      </p>
      <h3 class="mt-2 font-display text-xl font-bold">{{ challenge.title }}</h3>
      <p class="mt-1 leading-relaxed">{{ challenge.statement }}</p>
      <div class="mt-4">
        <OrderingChallenge v-if="challenge.type === 'ordering'" :key="`o-${attempt}`" :content="challenge.content" :disabled="locked" @change="onChange" />
        <GroupingChallenge v-else-if="challenge.type === 'grouping'" :key="`g-${attempt}`" :content="challenge.content" :disabled="locked" @change="onChange" />
        <FilteringChallenge v-else-if="challenge.type === 'filtering'" :key="`f-${attempt}`" :content="challenge.content" :disabled="locked" @change="onChange" />
        <PatternChallenge v-else :key="`p-${attempt}`" :content="challenge.content" :disabled="locked" @change="onChange" />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="bg-go px-6 py-3 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-not-allowed disabled:opacity-50 cq-go-shadow"
        :disabled="!canSubmit"
        :aria-describedby="submitHelp ? 'demo-submit-help' : undefined"
        data-testid="demo-submit"
        @click="submit"
      >Enviar</button>
      <button
        v-if="locked"
        type="button"
        class="cq-btn-outline px-4 py-3"
        data-testid="demo-reset"
        @click="start"
      >Recomeçar</button>
    </div>
    <p v-if="submitHelp" id="demo-submit-help" class="text-sm text-muted" data-testid="demo-submit-help">{{ submitHelp }}</p>

    <div aria-live="polite" data-testid="demo-feedback">
      <AnswerFeedback v-if="outcome" :outcome="outcome" @retry="retry" />
    </div>
  </div>
</template>
