<script setup lang="ts">
import { computed } from 'vue'
import type { Goal } from '~/types/api'

// Weekly class goal (spec §5.3): first solves the turma makes together this week.
const props = defineProps<{ goal: Goal | null; name: string; testid: string }>()

const MILESTONES = [25, 50, 75, 100]

const percent = computed(() => {
  if (!props.goal || props.goal.target <= 0) return 0
  return Math.min(100, Math.round((props.goal.progress / props.goal.target) * 100))
})

const reached = computed(() => MILESTONES.filter((mark) => percent.value >= mark))
</script>

<template>
  <div :data-testid="props.testid">
    <p class="flex items-center gap-2 text-sm font-semibold">
      Meta da turma
      <HelpTip
        :topic="props.testid"
        label="Meta da turma"
        text="Toda semana a turma tem uma meta: o número de desafios que os colegas resolvem pela primeira vez, juntos. Não dá XP, mas quem ajudou ganha insígnia quando a meta é cumprida."
      />
    </p>

    <p v-if="!props.goal" class="mt-1 text-sm text-muted" data-testid="goal-none">
      Sem meta esta semana: a turma não tem desafios novos.
    </p>

    <template v-else>
      <div class="mt-2 flex items-baseline justify-between gap-3 text-sm">
        <span class="cq-num text-lg" data-testid="goal-count">
          {{ props.goal.progress }} de {{ props.goal.target }} desafios
        </span>
        <span class="cq-num text-lg font-bold" data-testid="goal-percent">{{ percent }}%</span>
      </div>
      <ProgressBar
        :value="props.goal.progress"
        :max="props.goal.target"
        :label="`Meta da semana de ${props.name}`"
        tone="go"
        :milestones="MILESTONES"
      />
      <ol class="mt-2 flex justify-between text-xs text-muted" aria-label="Marcos da meta" data-testid="goal-milestones">
        <li
          v-for="mark in MILESTONES"
          :key="mark"
          :class="{ 'font-bold text-ink': reached.includes(mark) }"
          :data-testid="`goal-milestone-${mark}`"
        >
          <span v-if="reached.includes(mark)" aria-hidden="true">✓ </span>{{ mark }}%<span v-if="reached.includes(mark)" class="sr-only"> alcançado</span>
        </li>
      </ol>
      <p v-if="props.goal.completed" class="mt-2 font-semibold text-go" data-testid="goal-completed">
        Meta concluída! Bom trabalho em equipe.
      </p>
    </template>
  </div>
</template>
