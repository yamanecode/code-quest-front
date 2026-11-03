<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import type { AnswerOutcome } from '~/composables/useChallenge'
import { useCountUp } from '~/composables/useCountUp'
import { useReducedMotion } from '~/composables/useReducedMotion'
import { badgeFamily, TIER_LABEL } from '~/utils/badges'
import { resultHeadline } from '~/utils/feedback'
import { XP_PER_LEVEL, levelLabel } from '~/utils/levels'

// Result of a correct answer (spec §9.2): XP, level and title always come together with the
// new badges. Focus stays inside; Escape and "Fechar" close it.
const props = defineProps<{ outcome: AnswerOutcome; busy?: boolean }>()
const emit = defineEmits<{ next: []; close: [] }>()

const COUNT_MS = 500
const BADGE_STAGGER_MS = 120

const reduced = useReducedMotion()
const headlineId = `result-${useId()}`
const panel = ref<HTMLElement | null>(null)
const nextButton = ref<HTMLButtonElement | null>(null)

const headline = computed(() => resultHeadline(props.outcome.xp_earned))
const levelText = computed(() => levelLabel(props.outcome.level, props.outcome.title))
const xpCount = useCountUp(props.outcome.xp_earned, { durationMs: COUNT_MS, reduced })

// The bar of the current level fills from where it was before this answer (empty after a level-up).
const barEnd = props.outcome.xp % XP_PER_LEVEL
const barStart = props.outcome.level_up ? 0 : Math.max(barEnd - props.outcome.xp_earned, 0)
const barValue = ref(reduced ? barEnd : barStart)
let barTimer: ReturnType<typeof setTimeout> | null = null

// Each card comes in after the one before; with reduced motion they are simply there.
function badgeStyle(index: number) {
  return reduced ? {} : { animationDelay: `${index * BADGE_STAGGER_MS}ms` }
}

onMounted(() => {
  nextTick(() => nextButton.value?.focus())
  // The bar moves once the count-up is done.
  if (!reduced) barTimer = setTimeout(() => (barValue.value = barEnd), COUNT_MS)
})

onBeforeUnmount(() => {
  if (barTimer) clearTimeout(barTimer)
})

function trapTab(event: KeyboardEvent) {
  const buttons = [...(panel.value?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])]
  if (buttons.length === 0) return
  const first = buttons[0]!
  const last = buttons[buttons.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[var(--cq-scrim)] px-4 py-6"
    data-testid="result-modal"
    @keydown.esc="emit('close')"
  >
    <div
      ref="panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="headlineId"
      class="cq-sheet w-full max-w-lg p-6"
      data-testid="feedback-correct"
      @keydown.tab="trapTab"
    >
      <h2 :id="headlineId" class="font-display text-3xl font-extrabold leading-tight" data-testid="result-headline">{{ headline }}</h2>
      <p class="mt-1 text-muted" data-testid="feedback-message">{{ props.outcome.message }}</p>

      <div class="mt-5 border-t border-line pt-4">
        <p data-testid="feedback-xp">
          <span class="cq-num font-display text-4xl font-extrabold text-success" aria-hidden="true" data-testid="result-xp-count">+{{ xpCount }} XP</span>
          <span class="sr-only">+{{ props.outcome.xp_earned }} XP</span>
        </p>
        <ProgressBar
          class="mt-3"
          :value="barValue"
          :max="XP_PER_LEVEL"
          tone="progress"
          label="XP no nível atual"
          :value-text="`${barEnd} de ${XP_PER_LEVEL} XP neste nível`"
        />
        <p class="mt-2 text-sm text-muted" data-testid="feedback-status">
          {{ levelText }} · {{ props.outcome.xp }} XP no total
        </p>
        <p v-if="props.outcome.level_up" class="mt-3 font-display text-xl font-bold" data-testid="feedback-level-up">
          Você subiu para o {{ levelText }}!
        </p>
      </div>

      <div v-if="props.outcome.new_badges.length > 0" class="mt-5" data-testid="feedback-badges">
        <p class="font-semibold">{{ props.outcome.new_badges.length > 1 ? 'Novas insígnias!' : 'Nova insígnia!' }}</p>
        <ul class="mt-2 grid gap-2">
          <li
            v-for="(badge, index) in props.outcome.new_badges"
            :key="badge.code"
            class="flex items-center gap-3 border-2 border-line-strong bg-panel px-3 py-2"
            :class="{ 'cq-result-in': !reduced }"
            :style="badgeStyle(index)"
            :data-testid="`feedback-badge-${badge.code}`"
          >
            <span class="cq-sticker block h-12 w-12 shrink-0" aria-hidden="true">
              <BadgeIcon class="h-full w-full" :family="badgeFamily(badge.code)" :tier="badge.tier" earned />
            </span>
            <span>
              <span class="block font-semibold">{{ badge.name }}</span>
              <span class="block text-sm text-muted">{{ TIER_LABEL[badge.tier] }} · {{ badge.description }}</span>
            </span>
          </li>
        </ul>
      </div>

      <div v-if="props.outcome.explanation" class="mt-5 border-t border-line pt-4" data-testid="feedback-explanation">
        <p class="text-sm font-semibold text-muted">Por que essa é a resposta</p>
        <p class="mt-1 leading-relaxed">{{ props.outcome.explanation }}</p>
      </div>

      <div class="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          class="min-h-11 px-4 font-display text-lg font-bold text-muted transition-colors hover:text-ink"
          data-testid="result-close"
          @click="emit('close')"
        >Fechar</button>
        <button
          ref="nextButton"
          type="button"
          :disabled="props.busy"
          class="min-h-11 bg-go px-6 py-2.5 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover disabled:cursor-wait disabled:opacity-60 cq-go-shadow"
          data-testid="result-next"
          @click="emit('next')"
        >Próximo desafio</button>
      </div>
    </div>
  </div>
</template>
