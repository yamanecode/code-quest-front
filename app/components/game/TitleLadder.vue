<script setup lang="ts">
import type { TitleStep } from '~/types/api'
import { bandRange } from '~/utils/levels'

// The five titles as a ladder from Iniciante to Mestre (spec §5.2, §9.1), with the student's
// current one highlighted and the XP still missing for the next level.
const props = defineProps<{
  steps: TitleStep[]
  level: number
  xpToNextLevel: number
}>()

const isCurrent = (step: TitleStep) =>
  props.level >= step.min_level && (step.max_level === null || props.level <= step.max_level)
</script>

<template>
  <div data-testid="title-ladder">
    <ol class="grid gap-1.5 sm:grid-cols-5" aria-label="Títulos por faixa de nível">
      <li
        v-for="step in props.steps"
        :key="step.title"
        class="border-2 px-3 py-2"
        :class="isCurrent(step) ? 'border-ink bg-ink text-bg' : 'border-line bg-panel text-muted'"
        :aria-current="isCurrent(step) ? 'step' : undefined"
        :data-testid="`title-step-${step.min_level}`"
      >
        <span class="block font-display font-bold" :class="isCurrent(step) ? 'text-bg' : 'text-ink'">{{ step.title }}</span>
        <span class="block text-sm">Nível {{ bandRange(step.min_level, step.max_level) }}</span>
      </li>
    </ol>
    <p class="mt-2 text-sm text-muted" data-testid="title-ladder-next">
      Faltam <span class="cq-num font-bold text-ink">{{ props.xpToNextLevel }} XP</span> para o nível {{ props.level + 1 }}.
    </p>
  </div>
</template>
