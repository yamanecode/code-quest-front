<script setup lang="ts">
import type { MissionSummary } from '~/types/api'

// One mission on the home: progress, or a note when it has no challenge yet (spec §8.4).
const props = defineProps<{ mission: MissionSummary }>()
</script>

<template>
  <NuxtLink
    :to="`/missoes/${props.mission.id}`"
    class="flex h-full flex-col border border-line-strong bg-panel p-4 transition-colors hover:border-ink"
    :data-testid="`mission-${props.mission.id}`"
  >
    <span class="font-display text-xl font-bold leading-tight text-ink">{{ props.mission.title }}</span>
    <span v-if="props.mission.description" class="mt-1 text-sm leading-snug text-muted">{{ props.mission.description }}</span>
    <span class="mt-auto pt-4">
      <span v-if="props.mission.total === 0" class="text-sm text-muted" data-testid="mission-empty">
        Nenhum desafio disponível ainda.
      </span>
      <template v-else>
        <span class="mb-1.5 flex justify-between text-sm">
          <span class="cq-num" data-testid="mission-progress">{{ props.mission.solved }} de {{ props.mission.total }} resolvidos</span>
          <span v-if="props.mission.solved === props.mission.total" class="font-semibold text-go">✓ Completa</span>
        </span>
        <ProgressBar
          :value="props.mission.solved"
          :max="props.mission.total"
          :label="`Progresso em ${props.mission.title}`"
          size="sm"
          tone="progress"
        />
      </template>
    </span>
  </NuxtLink>
</template>
