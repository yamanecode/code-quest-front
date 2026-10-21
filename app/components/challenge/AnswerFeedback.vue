<script setup lang="ts">
import type { Tier } from '~/types/api'
import type { AnswerOutcome } from '~/composables/useChallenge'

// Result of one answer (spec §9.2). Badges always appear together with XP, level and title.
const props = defineProps<{ outcome: AnswerOutcome }>()
const emit = defineEmits<{ retry: [] }>()

const TIER_LABEL: Record<Tier, string> = { bronze: 'Bronze', silver: 'Prata', gold: 'Ouro' }
</script>

<template>
  <div
    v-if="props.outcome.is_correct"
    class="cq-cut bg-panel px-5 py-4"
    data-testid="feedback-correct"
  >
    <p class="text-sm font-semibold text-go">✓ Resposta certa</p>
    <p class="mt-1 font-display text-2xl font-bold" data-testid="feedback-message">{{ props.outcome.message }}</p>

    <p class="mt-2" data-testid="feedback-xp">
      <template v-if="props.outcome.xp_earned > 0">
        <span class="cq-num text-xl font-bold text-go">+{{ props.outcome.xp_earned }} XP</span>
      </template>
      <template v-else>Você já tinha resolvido este desafio, então não há XP novo.</template>
    </p>
    <p class="mt-1 text-sm text-muted" data-testid="feedback-status">
      Nível {{ props.outcome.level }} · {{ props.outcome.title }} · {{ props.outcome.xp }} XP no total
    </p>

    <p v-if="props.outcome.level_up" class="mt-3 font-semibold" data-testid="feedback-level-up">
      Você subiu para o nível {{ props.outcome.level }}: {{ props.outcome.title }}!
    </p>

    <div v-if="props.outcome.new_badges.length > 0" class="mt-3" data-testid="feedback-badges">
      <p class="font-semibold">Nova insígnia!</p>
      <ul class="mt-2 flex flex-wrap gap-3">
        <li
          v-for="badge in props.outcome.new_badges"
          :key="badge.code"
          class="flex items-center gap-2 border border-line-strong px-3 py-2"
          :data-testid="`feedback-badge-${badge.code}`"
        >
          <span class="text-2xl" aria-hidden="true">{{ badge.emoji }}</span>
          <span>
            <span class="block font-semibold">{{ badge.name }}</span>
            <span class="block text-sm text-muted">{{ TIER_LABEL[badge.tier] }} · {{ badge.description }}</span>
          </span>
        </li>
      </ul>
    </div>

    <div v-if="props.outcome.explanation" class="mt-4 border-t border-line pt-3" data-testid="feedback-explanation">
      <p class="text-sm font-semibold text-muted">Por que essa é a resposta</p>
      <p class="mt-1 leading-relaxed">{{ props.outcome.explanation }}</p>
    </div>
  </div>

  <div v-else class="border border-error-line bg-error-bg px-5 py-4" data-testid="feedback-wrong">
    <p class="text-sm font-semibold text-error-ink">✗ Resposta incorreta</p>
    <p class="mt-1 font-display text-2xl font-bold" data-testid="feedback-message">{{ props.outcome.message }}</p>
    <div v-if="props.outcome.hint" class="mt-3" data-testid="feedback-hint">
      <p class="text-sm font-semibold text-muted">Dica</p>
      <p class="mt-1 leading-relaxed">{{ props.outcome.hint }}</p>
    </div>
    <button
      type="button"
      class="mt-4 border border-ink px-4 py-2 font-semibold transition-colors hover:bg-ink hover:text-on-color"
      data-testid="feedback-retry"
      @click="emit('retry')"
    >Tentar novamente</button>
  </div>
</template>
